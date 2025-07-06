import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { FaPhone, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useVideoCall } from '../../context/VideoCallContext';

// Use environment variable or fallback to the provided App ID
const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || 'a54ef74037d04dcb9e175550a7e05b0f';

// Log the App ID for debugging (remove in production)
// console.log('Agora App ID:', AGORA_APP_ID ? 'Set' : 'Not set');

// Validate App ID format
const isValidAppId = (appId) => {
  return appId && appId.length === 32 && /^[a-f0-9]+$/i.test(appId);
};

// Configure Agora to disable analytics to avoid ad blocker issues
AgoraRTC.setLogLevel(4); // Only show errors

// Helper to force stop all media tracks (browser-level)
function forceStopAllMediaTracks() {
  // Stop all tracks from all video elements
  document.querySelectorAll('video').forEach(video => {
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      video.srcObject = null;
    }
  });
  
  // Also stop any tracks from getUserMedia that may not be attached
  if (window.localStream && window.localStream.getTracks) {
    window.localStream.getTracks().forEach(track => {
      track.stop();
      track.enabled = false;
    });
    window.localStream = null;
  }
  
  // Force stop any remaining active media streams
  // This is a more direct approach that doesn't create new streams
  if (navigator.mediaDevices) {
    // Try to access the media devices to force release
    // This is a workaround for browsers that don't properly release camera/microphone
    try {
      // Force the browser to reconsider media device access
      navigator.mediaDevices.enumerateDevices()
        .then(() => {
          // This should trigger the browser to release any held devices
        })
        .catch(() => {
          // Ignore errors
        });
    } catch (error) {
      // Ignore any errors
    }
  }
}

const VideoCall = ({ recipientId, socket, currentUser, isIncoming = false, channelName, onCallEnded }) => {
  const { endCall } = useVideoCall();
  
  const [joined, setJoined] = useState(false);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isRinging, setIsRinging] = useState(false);
  const [error, setError] = useState(null);
  const [ringingAudio, setRingingAudio] = useState(null);
  const [incomingCallAudio, setIncomingCallAudio] = useState(null);
  
  const clientRef = useRef(null);
  const localVideoRef = useRef(null);
  const channelNameRef = useRef(channelName || `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const abortControllerRef = useRef(null);
  const isJoiningRef = useRef(false);
  const ringingAudioRef = useRef(null);
  const createdStreamsRef = useRef([]); // Track all created streams for proper cleanup
  const hasUserInteracted = useRef(false);

  // Initialize the AgoraRTC client
  const initializeClient = () => {
    const client = AgoraRTC.createClient({ 
      mode: "rtc", 
      codec: "vp8",
      // Disable analytics to avoid ad blocker issues
      enableLogUpload: false
    });
    clientRef.current = client;
    setupEventListeners(client);
    return client;
  };

  // Set up event listeners
  const setupEventListeners = (client) => {
    // Handle user-published event
    client.on("user-published", async (user, mediaType) => {
      // Stop ringing when someone publishes media
      setIsRinging(false);
      
      // Stop ringing sound
      if (ringingAudioRef.current) {
        ringingAudioRef.current.pause();
        ringingAudioRef.current.currentTime = 0;
        ringingAudioRef.current = null;
        setRingingAudio(null);
      }
      
      // Subscribe to the user
      await client.subscribe(user, mediaType);
      
      if (mediaType === "video") {
        // Add remote user to state
        setRemoteUsers(prev => {
          const existing = prev.find(u => u.uid === user.uid);
          if (existing) {
            return prev.map(u => u.uid === user.uid ? { ...u, videoTrack: user.videoTrack } : u);
          } else {
            return [...prev, { ...user, videoTrack: user.videoTrack }];
          }
        });
      }
      
      if (mediaType === "audio") {
        if (user.audioTrack) {
          user.audioTrack.play();
        }
      }
    });

    // Handle user-unpublished event
    client.on("user-unpublished", async (user) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    });

    // Handle user-joined event
    client.on("user-joined", (user) => {
      // Stop ringing when someone joins the channel
      setIsRinging(false);
      
      // Stop ringing sound
      if (ringingAudioRef.current) {
        ringingAudioRef.current.pause();
        ringingAudioRef.current.currentTime = 0;
        ringingAudioRef.current = null;
        setRingingAudio(null);
      }
    });

    // Handle user-left event
    client.on("user-left", (user) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    });
    
    // Handle connection state changes
    client.on("connection-state-change", (curState, prevState) => {
    });
    
    // Handle network quality
    client.on("network-quality", (stats) => {
    });
  };

  // Create local media tracks
  const createLocalMediaTracks = async () => {
    try {
      console.log('🎥 Creating local media tracks...');
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      
      const videoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: "720p_1", // Use 720p for better quality
        facingMode: "user" // Use front camera by default
      });
      
      console.log('✅ Local media tracks created successfully');
      
      // Track the streams for proper cleanup
      if (audioTrack.getMediaStreamTrack) {
        const audioStream = new MediaStream([audioTrack.getMediaStreamTrack()]);
        createdStreamsRef.current.push(audioStream);
        console.log('📝 Tracked audio stream for cleanup');
      }
      if (videoTrack.getMediaStreamTrack) {
        const videoStream = new MediaStream([videoTrack.getMediaStreamTrack()]);
        createdStreamsRef.current.push(videoStream);
        console.log('📝 Tracked video stream for cleanup');
      }
      
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);
      
      return { audioTrack, videoTrack };
    } catch (error) {
      console.error('❌ Error creating local media tracks:', error);
      throw error;
    }
  };

  // Display local video
  const displayLocalVideo = (videoTrack) => {
    if (localVideoRef.current && videoTrack) {
      try {
        videoTrack.play(localVideoRef.current);
        
        // Also set the srcObject as a backup
        if (videoTrack.getMediaStreamTrack) {
          const stream = new MediaStream([videoTrack.getMediaStreamTrack()]);
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
      }
    }
  };

  // Join channel function
  const joinChannel = async () => {
    // Prevent multiple join attempts
    if (isJoiningRef.current) {
      return;
    }

    isJoiningRef.current = true;
    
    try {
      setIsConnecting(true);
      setError(null);
      
      // Create abort controller for this join operation
      abortControllerRef.current = new AbortController();
      

      
      // Check if Agora App ID is valid
      if (!isValidAppId(AGORA_APP_ID)) {
        throw new Error('Invalid Agora App ID format. Please get a valid App ID from Agora Console.');
      }
      
      // Initialize client
      const client = initializeClient();
      
      // Join the channel
      await client.join(AGORA_APP_ID, channelNameRef.current, null, null);
      
      // Create local media tracks
      const { audioTrack, videoTrack } = await createLocalMediaTracks();
      
      // Display local video immediately
      displayLocalVideo(videoTrack);
      
      // Also try to display it after a short delay to ensure DOM is ready
      setTimeout(() => {
        displayLocalVideo(videoTrack);
      }, 200);
      
      // Publish local tracks
      await client.publish([audioTrack, videoTrack]);
      
      // Update state
      setJoined(true);
      setIsConnecting(false);
      
      // If this is an outgoing call, show ringing state
      if (!isIncoming) {
        setIsRinging(true);
        
        // Play ringing sound for outgoing call
        try {
          const ringingAudio = new Audio('/src/assets/sounds/RINGING.mp3');
          ringingAudio.volume = 0.6;
          ringingAudio.loop = true;
          ringingAudio.play().catch(e => {});
          
          // Store audio reference to stop it later
          setRingingAudio(ringingAudio);
          ringingAudioRef.current = ringingAudio;
        } catch (error) {
          // Audio not supported for ringing
        }
        
        // Set timeout for ringing (30 seconds) - shorter timeout
        setTimeout(() => {
          if (isRinging && !abortControllerRef.current?.signal.aborted) {
            // Stop ringing sound
            if (ringingAudio) {
              ringingAudio.pause();
              ringingAudio.currentTime = 0;
            }
            setIsRinging(false);
            toast.error('Call timed out. No one answered.');
            handleLeave();
          }
        }, 30000);
      } else {
        // Incoming call - not setting ringing state
      }
      
    } catch (error) {
      console.error('=== ERROR JOINING CHANNEL ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Don't show error if operation was aborted
      if (error.message.includes('OPERATION_ABORTED') || error.message.includes('cancel token canceled')) {
        return;
      }
      
      if (error.message.includes('Invalid Agora App ID format')) {
        setError(error.message + ' Please get a valid App ID from Agora Console.');
      } else if (error.message.includes('CAN_NOT_GET_GATEWAY_SERVER')) {
        setError('Unable to connect to Agora servers. This might be due to network issues, invalid App ID, or Agora service problems. Please check your internet connection and try again.');
      } else if (error.message.includes('permission')) {
        setError('Camera and microphone permissions are required. Please allow access and try again.');
      } else if (error.message.includes('Agora')) {
        setError('Failed to connect to video service. Please check your internet connection.');
      } else {
        setError('Failed to join video call. Please try again.');
      }
      
      setIsConnecting(false);
    } finally {
      isJoiningRef.current = false;
    }
  };

  // Helper function to stop ringing sound
  const stopRingingSound = () => {
    console.log('🔇 Stopping ringing sound...');
    
    // Stop the audio referenced by the ref
    if (ringingAudioRef.current) {
      try {
        ringingAudioRef.current.pause();
        ringingAudioRef.current.currentTime = 0;
        ringingAudioRef.current.src = ''; // Clear the source
        ringingAudioRef.current.load(); // Force reload to stop
        console.log('✅ Stopped ringing audio from ref');
      } catch (error) {
        console.error('❌ Error stopping ringing audio from ref:', error);
      }
      ringingAudioRef.current = null;
    }
    
    // Also stop the audio from state
    if (ringingAudio) {
      try {
        ringingAudio.pause();
        ringingAudio.currentTime = 0;
        ringingAudio.src = ''; // Clear the source
        ringingAudio.load(); // Force reload to stop
        console.log('✅ Stopped ringing audio from state');
      } catch (error) {
        console.error('❌ Error stopping ringing audio from state:', error);
      }
      setRingingAudio(null);
    }
    
    // Force stop any other audio elements that might be playing
    document.querySelectorAll('audio').forEach(audio => {
      if (audio.src && (audio.src.includes('RINGING.mp3') || audio.src.includes('RINGTONE.mp3'))) {
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.src = '';
          audio.load();
          console.log('✅ Stopped additional ringing audio element');
        } catch (error) {
          console.error('❌ Error stopping additional ringing audio:', error);
        }
      }
    });
    
    console.log('🎵 Ringing sound cleanup completed');
  };

  // Handle leave call
  const handleLeave = async () => {
    console.log('🔄 Starting video call cleanup...');
    
    // IMMEDIATELY stop camera and microphone - do this first!
    if (localVideoTrack) {
      try { 
        console.log('📹 Stopping local video track...');
        localVideoTrack.setEnabled(false);
        localVideoTrack.close(); 
        console.log('✅ Local video track stopped');
      } catch (error) {
        console.error('❌ Error stopping local video track:', error);
      }
    }
    if (localAudioTrack) {
      try { 
        console.log('🎤 Stopping local audio track...');
        localAudioTrack.setEnabled(false);
        localAudioTrack.close(); 
        console.log('✅ Local audio track stopped');
      } catch (error) {
        console.error('❌ Error stopping local audio track:', error);
      }
    }
    
    // Stop all tracked streams
    console.log(`🔄 Stopping ${createdStreamsRef.current.length} tracked streams...`);
    createdStreamsRef.current.forEach((stream, index) => {
      if (stream && stream.getTracks) {
        stream.getTracks().forEach(track => {
          console.log(`🛑 Stopping track: ${track.kind} (${track.id})`);
          track.stop();
          track.enabled = false;
        });
      }
    });
    createdStreamsRef.current = []; // Clear the array
    console.log('✅ All tracked streams stopped');
    
    // Force stop all media tracks immediately
    console.log('🔄 Force stopping all media tracks...');
    forceStopAllMediaTracks();
    console.log('✅ Force stop completed');
    
    // Stop ringing sound
    stopRingingSound();
    
    // Stop incoming call sound if playing
    if (incomingCallAudio) {
      incomingCallAudio.pause();
      incomingCallAudio.currentTime = 0;
      setIncomingCallAudio(null);
    }
    
    // Stop vibration (only if user has interacted with the page)
    if (navigator.vibrate && hasUserInteracted.current) {
      try {
        navigator.vibrate(0);
      } catch (error) {
        // Ignore vibration errors
      }
    }
    
    // Update state immediately
    setIsConnecting(false);
    setIsRinging(false);
    setError(null);
    setRemoteUsers([]);
    setLocalAudioTrack(null);
    setLocalVideoTrack(null);
    
    // Clean up client
    if (clientRef.current) {
      try {
        console.log('🔄 Leaving Agora channel...');
        await clientRef.current.leave();
        clientRef.current = null;
        console.log('✅ Agora channel left');
      } catch (error) {
        console.error('❌ Error leaving Agora channel:', error);
      }
    }
    
    // Reset abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset joining flag
    isJoiningRef.current = false;
    
    // Force another cleanup after a short delay to ensure everything is stopped
    setTimeout(() => {
      console.log('🔄 Final cleanup check...');
      forceStopAllMediaTracks();
      // Also clear any remaining streams
      createdStreamsRef.current.forEach(stream => {
        if (stream && stream.getTracks) {
          stream.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
        }
      });
      createdStreamsRef.current = [];
      console.log('✅ Final cleanup completed');
    }, 100);
    
    console.log('🎉 Video call cleanup completed');
    
    // Notify parent component
    endCall();
    if (onCallEnded) {
      onCallEnded();
    }
  };

  const toggleMute = () => {
    if (localAudioTrack) {
      if (isMuted) {
        localAudioTrack.setEnabled(true);
      } else {
        localAudioTrack.setEnabled(false);
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrack) {
      if (isVideoOff) {
        localVideoTrack.setEnabled(true);
      } else {
        localVideoTrack.setEnabled(false);
      }
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsConnecting(true);
    joinChannel();
  };

  // Track user interaction for vibration permission
  useEffect(() => {
    const handleUserInteraction = () => {
      hasUserInteracted.current = true;
    };

    // Listen for any user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  // Initialize when component mounts
  useEffect(() => {
    // Update channel name ref if prop changed
    if (channelName && channelName !== channelNameRef.current) {
      channelNameRef.current = channelName;
    }
    
    // Small delay to ensure component is properly mounted
    const timer = setTimeout(() => {
      // Only join if we haven't already started joining
      if (!isJoiningRef.current) {
        joinChannel();
      }
    }, 100);

    return () => {
      console.log('🔄 VideoCall component unmounting...');
      clearTimeout(timer);
      
      // Stop ringing sounds immediately
      stopRingingSound();
      
      // Stop incoming call sound if playing
      if (incomingCallAudio) {
        try {
          incomingCallAudio.pause();
          incomingCallAudio.currentTime = 0;
          incomingCallAudio.src = '';
          incomingCallAudio.load();
        } catch (error) {
          console.error('❌ Error stopping incoming call audio on unmount:', error);
        }
        setIncomingCallAudio(null);
      }
      
      // IMMEDIATELY stop camera and microphone on unmount
      if (localVideoTrack) {
        try {
          console.log('📹 Stopping local video track on unmount...');
          localVideoTrack.setEnabled(false);
          localVideoTrack.close();
          console.log('✅ Local video track stopped on unmount');
        } catch (error) {
          console.error('❌ Error stopping local video track on unmount:', error);
        }
      }
      
      if (localAudioTrack) {
        try {
          console.log('🎤 Stopping local audio track on unmount...');
          localAudioTrack.setEnabled(false);
          localAudioTrack.close();
          console.log('✅ Local audio track stopped on unmount');
        } catch (error) {
          console.error('❌ Error stopping local audio track on unmount:', error);
        }
      }
      
      // Stop all tracked streams
      console.log(`🔄 Stopping ${createdStreamsRef.current.length} tracked streams on unmount...`);
      createdStreamsRef.current.forEach(stream => {
        if (stream && stream.getTracks) {
          stream.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
        }
      });
      createdStreamsRef.current = [];
      
      // Force stop all media tracks
      forceStopAllMediaTracks();
      
      // Abort any ongoing operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Leave the channel
      if (clientRef.current) {
        try {
          clientRef.current.leave().catch(error => {
            // Error leaving channel on unmount
          });
        } catch (error) {
        }
      }
      
      // Check for any remaining active streams
      setTimeout(() => {
        const videoElements = document.querySelectorAll('video');
        const activeStreams = [];
        videoElements.forEach(video => {
          if (video.srcObject) {
            activeStreams.push(video.srcObject);
          }
        });
        if (activeStreams.length > 0) {
          console.warn('⚠️ Found remaining active streams after cleanup:', activeStreams.length);
        } else {
          console.log('✅ No remaining active streams found');
        }
      }, 200);
      
      console.log('🎉 VideoCall component unmount cleanup completed');
    };
  }, []); // Keep empty dependencies for initial mount only

  // Handle prop changes (channel name, incoming call status)
  useEffect(() => {
    if (channelName && channelName !== channelNameRef.current) {
      channelNameRef.current = channelName;
      
      // If we're already joined, leave and rejoin with new channel
      if (joined && clientRef.current) {
        handleLeave().then(() => {
          // Small delay to ensure cleanup is complete
          setTimeout(() => {
            if (!isJoiningRef.current) {
              joinChannel();
            }
          }, 100);
        });
      }
    }
  }, [channelName]);

  // Handle incoming call status changes
  useEffect(() => {
    if (isIncoming && !joined && !isConnecting && !isJoiningRef.current) {
      joinChannel();
    }
  }, [isIncoming, joined, isConnecting]);

  // Render remote videos when they join
  useEffect(() => {
    if (remoteUsers.length > 0 && isRinging) {
      setIsRinging(false);
    }
    
    remoteUsers.forEach(user => {
      if (user.videoTrack) {
        const remoteVideoElement = document.getElementById(`remote-video-${user.uid}`);
        
        if (remoteVideoElement) {
          user.videoTrack.play(remoteVideoElement);
        }
      }
    });
  }, [remoteUsers, isRinging]);

  // Display local video when local video track is available
  useEffect(() => {
    const displayVideo = () => {
      if (localVideoTrack && localVideoRef.current) {
        try {
          // Stop any existing video first
          if (localVideoRef.current.srcObject) {
            localVideoRef.current.srcObject = null;
          }
          
          // Method 1: Use the video track's play method
          localVideoTrack.play(localVideoRef.current);
          
          // Method 2: Also set the srcObject as a backup
          if (localVideoTrack.getMediaStreamTrack) {
            const stream = new MediaStream([localVideoTrack.getMediaStreamTrack()]);
            localVideoRef.current.srcObject = stream;
          }
          
          // Method 3: Try using getUserMedia as a fallback
          setTimeout(() => {
            if (localVideoRef.current && localVideoRef.current.videoWidth === 0) {
              navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                  if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                  }
                })
                .catch(error => {
                });
            }
          }, 2000);
          
        } catch (error) {
        }
      }
    };
    
    if (localVideoTrack && localVideoRef.current) {
      displayVideo();
      
      // Verify the video is actually playing
      setTimeout(() => {
        if (localVideoRef.current) {
          if (localVideoRef.current.videoWidth === 0) {
            displayVideo();
          }
        }
      }, 1000);
    } else if (localVideoTrack) {
      // If we have the track but not the ref, try again after a short delay
      const timer = setTimeout(() => {
        if (localVideoRef.current && localVideoTrack) {
          displayVideo();
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [localVideoTrack, joined]);

  // Defensive cleanup: always close local tracks on unmount or when call is ended remotely
  useEffect(() => {
    return () => {
      if (localVideoTrack) {
        try { 
          localVideoTrack.setEnabled(false);
          localVideoTrack.close(); 
        } catch {}
      }
      if (localAudioTrack) {
        try { 
          localAudioTrack.setEnabled(false);
          localAudioTrack.close(); 
        } catch {}
      }
      
      // Stop all tracked streams
      createdStreamsRef.current.forEach(stream => {
        if (stream && stream.getTracks) {
          stream.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
        }
      });
      createdStreamsRef.current = [];
      
      forceStopAllMediaTracks();
    };
  }, []);

  // Also close tracks if joined becomes false (call ended remotely)
  useEffect(() => {
    if (!joined) {
      // Stop ringing sound when call ends
      if (isRinging) {
        console.log('🎵 Call ended, stopping ringing sound...');
        stopRingingSound();
        setIsRinging(false);
      }
      
      if (localVideoTrack) {
        try { 
          localVideoTrack.setEnabled(false);
          localVideoTrack.close(); 
        } catch {}
        setLocalVideoTrack(null);
      }
      if (localAudioTrack) {
        try { 
          localAudioTrack.setEnabled(false);
          localAudioTrack.close(); 
        } catch {}
        setLocalAudioTrack(null);
      }
      
      // Stop all tracked streams
      createdStreamsRef.current.forEach(stream => {
        if (stream && stream.getTracks) {
          stream.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
        }
      });
      createdStreamsRef.current = [];
      
      forceStopAllMediaTracks();
    }
  }, [joined]);

  // Note: Socket event handling is done in VideoCallContext to avoid duplicate toasts

  // Stop ringing sound when call is connected (when remote users join)
  useEffect(() => {
    if (remoteUsers.length > 0 && isRinging) {
      stopRingingSound();
      setIsRinging(false);
    }
  }, [remoteUsers.length, isRinging]);

  // Stop ringing sound when call is joined (for outgoing calls)
  useEffect(() => {
    if (joined && isRinging) {
      console.log('🎵 Call joined, stopping ringing sound...');
      stopRingingSound();
      setIsRinging(false);
    }
  }, [joined, isRinging]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/95 z-[10000] flex items-center justify-center">
        <div className="bg-gray-800/95 backdrop-blur-lg border border-gray-600/50 rounded-xl p-8 shadow-2xl max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTimes className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">Call Failed</h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={handleLeave}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all"
            >
              Close
            </button>
            {error.includes('permission') && (
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 z-[10000] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {currentUser?.fullName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-white font-semibold">Video Call</h3>
            <p className="text-gray-300 text-sm">
              {isConnecting ? 'Connecting...' : remoteUsers.length > 0 ? 'Connected' : 'Waiting for others...'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLeave}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
        >
          <FaTimes size={20} />
        </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative overflow-hidden">
        {isConnecting ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">Connecting to call...</p>
            </div>
          </div>
        ) : isRinging && remoteUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              {/* Ringing Animation */}
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto relative">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                    <FaPhone className="w-12 h-12 text-blue-500" />
                  </div>
                </div>
                {/* Ringing circles */}
                <div className="absolute inset-0 w-32 h-32 mx-auto">
                  <div className="w-full h-full border-2 border-blue-400 rounded-full animate-ping opacity-75"></div>
                </div>
                <div className="absolute inset-0 w-32 h-32 mx-auto">
                  <div className="w-full h-full border-2 border-purple-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
                </div>
                <div className="absolute inset-0 w-32 h-32 mx-auto">
                  <div className="w-full h-full border-2 border-blue-300 rounded-full animate-ping opacity-25" style={{ animationDelay: '1s' }}></div>
                </div>
              </div>
              <h3 className="text-white text-2xl font-semibold mb-2">Calling...</h3>
              <p className="text-gray-300 text-lg mb-6">Waiting for the other person to answer</p>
              
              {/* Cancel Call Button */}
              <button
                onClick={handleLeave}
                className="px-8 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-all flex items-center gap-2 mx-auto"
              >
                <FaPhone size={16} className="rotate-90" />
                Cancel Call
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            {/* Remote Video - Full Screen */}
            {remoteUsers.length > 0 ? (
              <div className="w-full h-full">
                {remoteUsers.map(user => (
                  <div key={user.uid} className="w-full h-full">
                    <div 
                      id={`remote-video-${user.uid}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              // Show local video as main video when no remote users
              <div className="w-full h-full">
                {localVideoTrack ? (
                  <div className="w-full h-full relative">
                    <video 
                      ref={localVideoRef} 
                      className={`w-full h-full object-cover ${isVideoOff ? 'bg-gray-800' : ''}`}
                      autoPlay
                      playsInline
                      muted
                    />
                    {isVideoOff && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <FaVideoSlash className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    {/* Indicator that this is your own video */}
                    <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                      You
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaPhone className="w-12 h-12 text-gray-400" />
                      </div>
                      <p className="text-white text-lg">Waiting for others to join...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Local Video - Picture in Picture - Show when we have remote users or when joined */}
            {(joined || localVideoTrack) && remoteUsers.length > 0 && (
              <div className="absolute top-4 right-4 w-32 h-24 bg-gray-900 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg z-10">
                <video 
                  ref={localVideoRef} 
                  className={`w-full h-full object-cover ${isVideoOff ? 'bg-gray-800' : ''}`}
                  autoPlay
                  playsInline
                  muted
                />
                {isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <FaVideoSlash className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {!localVideoTrack && !isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                        <FaVideo className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-gray-400 text-xs">Loading...</p>
                    </div>
                  </div>
                )}
                {/* Debug button - only show in development */}
                {process.env.NODE_ENV === 'development' && localVideoTrack && (
                  <button
                    onClick={() => {
                      if (localVideoTrack && localVideoRef.current) {
                        try {
                          localVideoTrack.play(localVideoRef.current);
                        } catch (error) {
                        }
                      }
                    }}
                    className="absolute bottom-1 right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded"
                  >
                    Test
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {!isRinging && (
        <div className="flex items-center justify-center gap-4 p-6 bg-black/50 backdrop-blur-lg border-t border-white/10">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${
              isMuted 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
          </button>
          
          <button
            onClick={handleLeave}
            className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
          >
            <FaPhone size={20} className="rotate-90" />
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all ${
              isVideoOff 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {isVideoOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoCall;