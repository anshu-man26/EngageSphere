import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocketContext } from './SocketContext';
import { useAuthContext } from './AuthContext';
import VideoCall from '../components/messages/VideoCall';
import IncomingCall from '../components/messages/IncomingCall';
import toast from 'react-hot-toast';
import ringtoneSound from '../assets/sounds/RINGTONE.mp3';

const VideoCallContext = createContext();

export const useVideoCall = () => {
  const ctx = useContext(VideoCallContext);
  if (!ctx) throw new Error('useVideoCall must be used within a VideoCallProvider');
  return ctx;
};

export const VideoCallProvider = ({ children }) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);

  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();

  const ringtoneRef = useRef(null);
  const incomingTimeoutRef = useRef(null);
  const userInteractedRef = useRef(false);

  // ── Defensive: stop every active media track in the DOM ────────────
  const forceStopAllMediaTracks = () => {
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

  // ── Ringtone control ──────────────────────────────────────────────
  const stopRingtone = () => {
    if (ringtoneRef.current) {
      try {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
        ringtoneRef.current.src = '';
        ringtoneRef.current.load();
      } catch {}
      ringtoneRef.current = null;
    }
    if (navigator.vibrate && userInteractedRef.current) {
      try { navigator.vibrate(0); } catch {}
    }
  };

  const playRingtone = () => {
    stopRingtone();
    if (authUser?.soundSettings?.ringtone === false) return;
    try {
      const a = new Audio(ringtoneSound);
      a.volume = 0.7;
      a.loop = true;
      a.play().catch(() => {});
      ringtoneRef.current = a;
    } catch {}
  };

  // Alias kept for callers that still expect the old name
  const forceStopAllAudio = stopRingtone;

  // ── Track first user interaction for vibration support ────────────
  useEffect(() => {
    const flag = () => { userInteractedRef.current = true; };
    document.addEventListener('click', flag, { once: true });
    document.addEventListener('touchstart', flag, { once: true });
    document.addEventListener('keydown', flag, { once: true });
    return () => {
      document.removeEventListener('click', flag);
      document.removeEventListener('touchstart', flag);
      document.removeEventListener('keydown', flag);
    };
  }, []);

  // ── Socket: incoming call + remote hangup ────────────────────────
  useEffect(() => {
    if (!socket || !authUser) return;

    const onIncoming = (data) => {
      if (data.recipientId !== authUser._id) return;

      setIncomingCall(data);
      playRingtone();

      if (navigator.vibrate && userInteractedRef.current) {
        try {
          navigator.vibrate([800, 200, 200, 200, 200, 200]);
        } catch {}
      }

      clearTimeout(incomingTimeoutRef.current);
      incomingTimeoutRef.current = setTimeout(() => {
        setIncomingCall((prev) => {
          if (!prev) return prev;
          stopRingtone();
          toast('Missed call', { icon: '📞' });
          return null;
        });
      }, 45000);
    };

    const onCallEnded = (data) => {
      if (data.recipientId !== authUser._id && data.callerId !== authUser._id) return;

      stopRingtone();
      clearTimeout(incomingTimeoutRef.current);

      setIncomingCall((prevIncoming) => {
        setActiveCall((prevActive) => {
          if (prevIncoming) toast('Call ended', { icon: '📞' });
          else if (prevActive) toast('Call ended', { icon: '📞' });
          return null;
        });
        setShowVideoCall(false);
        return null;
      });
    };

    socket.on('videoCallStarted', onIncoming);
    socket.on('videoCallEnded', onCallEnded);
    return () => {
      socket.off('videoCallStarted', onIncoming);
      socket.off('videoCallEnded', onCallEnded);
    };
  }, [socket, authUser]);

  // ── Page hide / unload safety net ────────────────────────────────
  useEffect(() => {
    const cleanup = () => {
      stopRingtone();
      forceStopAllMediaTracks();
    };
    const onVisibility = () => { if (document.hidden) cleanup(); };

    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('unload', cleanup);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('unload', cleanup);
      document.removeEventListener('visibilitychange', onVisibility);
      cleanup();
    };
  }, []);

  // ── Public actions ────────────────────────────────────────────────
  const handleIncomingCallResponse = (accept) => {
    stopRingtone();
    clearTimeout(incomingTimeoutRef.current);

    if (accept && incomingCall) {
      setActiveCall({
        recipientId: incomingCall.callerId,
        recipientName: incomingCall.callerName,
        callerId: authUser._id,
        callerName: authUser.fullName,
        channelName: incomingCall.channelName,
        isReceiver: true,
      });
      setShowVideoCall(true);
    } else if (!accept && incomingCall && socket) {
      socket.emit('videoCallEnded', {
        recipientId: incomingCall.callerId,
        callerId: authUser._id,
      });
    }
    setIncomingCall(null);
  };

  const startOutgoingCall = (recipientId, recipientName) => {
    if (!recipientId) return null;
    const channelName = `call-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const callData = {
      recipientId,
      recipientName,
      callerId: authUser._id,
      callerName: authUser.fullName,
      channelName,
      isReceiver: false,
    };
    setActiveCall(callData);
    setShowVideoCall(true);
    if (socket) socket.emit('videoCallStarted', callData);
    return callData;
  };

  const endCall = () => {
    stopRingtone();
    forceStopAllMediaTracks();

    if (socket && activeCall?.recipientId) {
      socket.emit('videoCallEnded', {
        recipientId: activeCall.recipientId,
        callerId: authUser._id,
      });
    }
    setActiveCall(null);
    setShowVideoCall(false);
    setIncomingCall(null);
  };

  const value = {
    incomingCall,
    activeCall,
    showVideoCall,
    handleIncomingCallResponse,
    startOutgoingCall,
    endCall,
    forceStopAllMediaTracks,
    forceStopAllAudio,
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}

      {incomingCall && !showVideoCall && (
        <IncomingCall
          callerName={incomingCall.callerName}
          onAccept={() => handleIncomingCallResponse(true)}
          onDecline={() => handleIncomingCallResponse(false)}
        />
      )}

      {showVideoCall && activeCall && (
        <VideoCall
          key={activeCall.channelName}
          recipientId={activeCall.recipientId}
          socket={socket}
          currentUser={authUser}
          isIncoming={!!activeCall.isReceiver}
          channelName={activeCall.channelName}
          onCallEnded={endCall}
        />
      )}
    </VideoCallContext.Provider>
  );
};
