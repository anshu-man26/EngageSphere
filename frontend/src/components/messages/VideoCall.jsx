import React, { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhone,
  FaTimes,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useVideoCall } from '../../context/VideoCallContext';
import { apiGet } from '../../config/api';
import ringingSound from '../../assets/sounds/RINGING.mp3';

AgoraRTC.setLogLevel(4);
try { AgoraRTC.disableLogUpload(); } catch {}

const isValidAppId = (id) => id && id.length === 32 && /^[a-f0-9]+$/i.test(id);

// Fetch a freshly-minted RTC token from the backend. Returns null on any failure
// (no auth cookie, missing certificate, network error, etc.) — the caller
// surfaces a clear error rather than falling back to a different project.
const fetchAgoraToken = async (channel) => {
  try {
    const data = await apiGet(`/api/agora/token?channel=${encodeURIComponent(channel)}`);
    return {
      appId: data.appId,
      token: data.token,
      uid: typeof data.uid === 'number' ? data.uid : null,
    };
  } catch (e) {
    console.warn('[VideoCall] token fetch failed:', e?.message || e);
    return null;
  }
};

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function VideoCall({
  recipientId,
  socket,
  currentUser,
  isIncoming = false,
  channelName,
  onCallEnded,
}) {
  const { endCall, activeCall } = useVideoCall();

  const [phase, setPhase] = useState('connecting'); // connecting | ringing | connected | error
  const [error, setError] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const localContainerRef = useRef(null); // current div the local track is attached to
  const remoteContainersRef = useRef(new Map()); // uid → div
  const channelRef = useRef(channelName || `call-${Date.now()}`);
  const ringingAudioRef = useRef(null);
  const hideControlsTimerRef = useRef(null);

  const peerName = activeCall?.recipientName || activeCall?.callerName || 'User';
  const peerInitial = peerName.charAt(0).toUpperCase();

  // ── Auto-hide controls during connected calls ─────────────────────
  const wakeControls = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

  // ── Callback ref for local container (stage or PiP, only one mounted at a time) ─
  const setLocalContainer = useCallback((node) => {
    localContainerRef.current = node;
    const track = localVideoTrackRef.current;
    if (node && track) {
      try {
        track.play(node, { mirror: true, fit: 'cover' });
      } catch (e) {
        console.warn('Local video play failed', e);
      }
    }
  }, []);

  // ── Callback ref for remote containers (one per uid) ─────────────
  const setRemoteContainer = useCallback((uid) => (node) => {
    if (node) {
      remoteContainersRef.current.set(uid, node);
      const user = remoteUsers.find((u) => u.uid === uid);
      if (user?.videoTrack) {
        try {
          user.videoTrack.play(node, { fit: 'cover' });
        } catch {}
      }
    } else {
      remoteContainersRef.current.delete(uid);
    }
  }, [remoteUsers]);

  // ── Ringing audio (outgoing only) ────────────────────────────────
  const startRinging = () => {
    try {
      const a = new Audio(ringingSound);
      a.volume = 0.5;
      a.loop = true;
      a.play().catch(() => {});
      ringingAudioRef.current = a;
    } catch {}
  };
  const stopRinging = () => {
    if (ringingAudioRef.current) {
      try {
        ringingAudioRef.current.pause();
        ringingAudioRef.current.currentTime = 0;
        ringingAudioRef.current.src = '';
        ringingAudioRef.current.load();
      } catch {}
      ringingAudioRef.current = null;
    }
  };

  // ── No-answer timeout for outgoing ringing ───────────────────────
  useEffect(() => {
    if (phase !== 'ringing') return;
    const t = setTimeout(() => {
      toast.error('No answer');
      onCallEnded ? onCallEnded() : endCall();
    }, 30000);
    return () => clearTimeout(t);
  }, [phase, endCall, onCallEnded]);

  // ── Call duration timer ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'connected') return;
    const start = Date.now();
    const t = setInterval(() => setDuration(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // ── Mouse activity wakes controls ────────────────────────────────
  useEffect(() => {
    if (phase !== 'connected') {
      setShowControls(true);
      return;
    }
    wakeControls();
    const onMove = () => wakeControls();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchstart', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchstart', onMove);
    };
  }, [phase, wakeControls]);

  // ── Agora join + publish + listen (StrictMode-safe) ──────────────
  useEffect(() => {
    let alive = true;
    let client = null;
    let audioTrack = null;
    let videoTrack = null;

    const cleanup = () => {
      alive = false;
      stopRinging();
      clearTimeout(hideControlsTimerRef.current);

      try { audioTrack?.stop(); } catch {}
      try { audioTrack?.close(); } catch {}
      try { videoTrack?.stop(); } catch {}
      try { videoTrack?.close(); } catch {}

      if (client) {
        try { client.removeAllListeners(); } catch {}
        Promise.resolve()
          .then(() => client.leave())
          .catch(() => {});
      }

      // Belt-and-suspenders: stop any stray media tracks
      document.querySelectorAll('video').forEach((v) => {
        if (v.srcObject) {
          try {
            v.srcObject.getTracks?.().forEach((t) => {
              try { t.stop(); } catch {}
            });
          } catch {}
          v.srcObject = null;
        }
      });
    };

    const join = async () => {
      try {
        // Token MUST come from the backend so both peers land on the same Agora project.
        const tokenData = await fetchAgoraToken(channelRef.current);
        if (!tokenData) {
          throw new Error('Could not fetch Agora token from server. Make sure you are logged in and the backend has AGORA_APP_ID + AGORA_APP_CERTIFICATE set.');
        }
        const { appId, token } = tokenData;
        const uid = tokenData.uid; // numeric or null — preserved exactly

        if (!isValidAppId(appId)) {
          throw new Error('Invalid Agora App ID returned by server.');
        }

        client = AgoraRTC.createClient({
          mode: 'rtc',
          codec: 'vp8',
          enableLogUpload: false,
        });
        clientRef.current = client;

        client.on('user-published', async (user, mediaType) => {
          if (!alive) return;
          try {
            await client.subscribe(user, mediaType);
          } catch {
            return;
          }
          if (!alive) return;
          if (mediaType === 'video') {
            setRemoteUsers((prev) => {
              const others = prev.filter((u) => u.uid !== user.uid);
              return [...others, user];
            });
            stopRinging();
            setPhase('connected');
            // Try playing immediately if a container already exists for this uid
            const existing = remoteContainersRef.current.get(user.uid);
            if (existing && user.videoTrack) {
              try { user.videoTrack.play(existing, { fit: 'cover' }); } catch {}
            }
          } else if (mediaType === 'audio' && user.audioTrack) {
            try { user.audioTrack.play(); } catch {}
          }
        });
        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') {
            setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
          }
        });
        client.on('user-left', (user) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        await client.join(appId, channelRef.current, token, uid);
        if (!alive) return;

        audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        if (!alive) { try { audioTrack.close(); } catch {} return; }

        videoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: '720p_1',
          facingMode: 'user',
        });
        if (!alive) {
          try { audioTrack.close(); } catch {}
          try { videoTrack.close(); } catch {}
          return;
        }
        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;

        // Play local video immediately into whatever container is currently mounted
        if (localContainerRef.current) {
          try {
            videoTrack.play(localContainerRef.current, { mirror: true, fit: 'cover' });
          } catch {}
        }

        await client.publish([audioTrack, videoTrack]);
        if (!alive) return;

        if (isIncoming) {
          setPhase('connected');
        } else {
          setPhase('ringing');
          startRinging();
        }
      } catch (e) {
        if (!alive) return;
        console.error('VideoCall join failed:', e);
        const msg = e?.message || String(e) || '';
        if (msg.includes('OPERATION_ABORTED') || msg.includes('cancel')) return;

        let display = `Call failed: ${msg || 'unknown error'}`;
        if (msg.toLowerCase().includes('permission') || msg.includes('NotAllowed')) {
          display = 'Camera and microphone access required. Allow access in your browser settings and retry.';
        } else if (msg.includes('Invalid Agora')) {
          display = msg;
        } else if (msg.includes('GATEWAY') || msg.includes('NETWORK')) {
          display = 'Could not reach the call service. Check your internet connection.';
        } else if (
          msg.includes('CAN_NOT_GET_PARAM') ||
          msg.includes('dynamic key') ||
          msg.includes('token') ||
          msg.includes('INVALID_TOKEN') ||
          msg.includes('TOKEN_EXPIRED')
        ) {
          display =
            'Agora rejected the token. Verify AGORA_APP_ID and AGORA_APP_CERTIFICATE in backend/.env match the same project, then restart the backend.';
        }
        setError(display);
        setPhase('error');
      }
    };

    join();

    return cleanup;
  }, []);

  // ── Controls ─────────────────────────────────────────────────────
  const toggleMute = () => {
    if (!localAudioTrackRef.current) return;
    localAudioTrackRef.current.setEnabled(muted);
    setMuted((m) => !m);
  };
  const toggleVideo = () => {
    if (!localVideoTrackRef.current) return;
    localVideoTrackRef.current.setEnabled(videoOff);
    setVideoOff((v) => !v);
  };
  const handleHangUp = () => {
    onCallEnded ? onCallEnded() : endCall();
  };

  // ── Error screen ─────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-gray-900 ring-1 ring-white/10 rounded-2xl p-6 text-center shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-500/15 text-red-400 flex items-center justify-center mb-4">
            <FaTimes className="w-7 h-7" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-1">Call failed</h3>
          <p className="text-gray-400 text-sm mb-5">{error}</p>
          <button
            onClick={handleHangUp}
            className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const showOverlay = phase === 'connecting' || phase === 'ringing';
  const stageHasRemote = phase === 'connected' && remoteUsers.length > 0;

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black flex flex-col select-none overflow-hidden"
      onMouseMove={wakeControls}
    >
      {/* === Stage === */}
      <div className="absolute inset-0">
        {/* Remote (when connected) */}
        {stageHasRemote &&
          remoteUsers.map((u) => (
            <div
              key={u.uid}
              ref={setRemoteContainer(u.uid)}
              className="absolute inset-0 bg-gray-900"
            />
          ))}

        {/* Local (always rendered until remote takes over) */}
        {!stageHasRemote && (
          <div ref={setLocalContainer} className="absolute inset-0 bg-gray-900" />
        )}

        {/* Top + bottom soft gradients for legibility */}
        <div
          className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/80 to-transparent pointer-events-none transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* === Top bar === */}
      <div
        className={`relative z-20 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between p-4 sm:p-5">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md ring-1 ring-white/10 rounded-full pl-1 pr-3 py-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
              {peerInitial}
            </div>
            <div className="leading-tight">
              <p className="text-white text-sm font-medium">{peerName}</p>
              <p className="text-[11px] text-gray-300">
                {phase === 'connecting' && 'Connecting…'}
                {phase === 'ringing' && 'Ringing…'}
                {phase === 'connected' &&
                  (remoteUsers.length > 0 ? formatDuration(duration) : 'Reconnecting…')}
              </p>
            </div>
          </div>

          <button
            onClick={handleHangUp}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <FaTimes size={18} />
          </button>
        </div>
      </div>

      {/* === Centered overlay (connecting / ringing) === */}
      {showOverlay && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden />
          <div className="relative text-center">
            <div className="relative mx-auto w-32 h-32 mb-6">
              <div className="absolute inset-0 rounded-full bg-emerald-400/25 animate-ping" />
              <div
                className="absolute inset-2 rounded-full bg-emerald-400/35 animate-ping"
                style={{ animationDelay: '0.4s' }}
              />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-3xl font-bold shadow-2xl ring-4 ring-white/10">
                {peerInitial}
              </div>
            </div>
            <h2 className="text-white text-xl sm:text-2xl font-semibold tracking-wide">
              {peerName}
            </h2>
            <p className="text-gray-300 mt-1.5 text-sm">
              {phase === 'connecting' ? 'Connecting…' : 'Ringing…'}
            </p>
          </div>
        </div>
      )}

      {/* === PiP local preview (only when remote is on stage) === */}
      {stageHasRemote && (
        <div className="absolute top-20 right-4 sm:top-24 sm:right-6 w-28 h-40 sm:w-36 sm:h-52 bg-gray-900 rounded-2xl overflow-hidden ring-2 ring-white/20 shadow-2xl z-30">
          <div ref={setLocalContainer} className="w-full h-full bg-gray-900" />
          {videoOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <FaVideoSlash className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-sm">
            You
          </div>
        </div>
      )}

      {/* === Local video-off placeholder on stage === */}
      {!stageHasRemote && videoOff && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-3xl font-bold shadow-2xl ring-4 ring-white/10">
            {currentUser?.fullName?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>
      )}

      {/* === Bottom controls === */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex justify-center pb-6 sm:pb-10">
          <div className="flex items-center gap-3 sm:gap-4 px-3 py-3 bg-black/55 backdrop-blur-xl ring-1 ring-white/10 rounded-full shadow-2xl">
            <button
              onClick={toggleMute}
              aria-label={muted ? 'Unmute' : 'Mute'}
              title={muted ? 'Unmute' : 'Mute'}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition active:scale-95 ${
                muted
                  ? 'bg-white text-gray-900 hover:bg-gray-100'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {muted ? <FaMicrophoneSlash className="w-5 h-5" /> : <FaMicrophone className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleVideo}
              aria-label={videoOff ? 'Turn camera on' : 'Turn camera off'}
              title={videoOff ? 'Turn camera on' : 'Turn camera off'}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition active:scale-95 ${
                videoOff
                  ? 'bg-white text-gray-900 hover:bg-gray-100'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {videoOff ? <FaVideoSlash className="w-5 h-5" /> : <FaVideo className="w-5 h-5" />}
            </button>

            <button
              onClick={handleHangUp}
              aria-label="End call"
              title="End call"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-900/40 transition"
            >
              <FaPhone className="w-5 h-5 rotate-[135deg]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
