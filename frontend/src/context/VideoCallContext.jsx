import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocketContext } from './SocketContext';
import { useAuthContext } from './AuthContext';
import VideoCall from '../components/messages/VideoCall';
import toast from 'react-hot-toast';

const VideoCallContext = createContext();

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
};

export const VideoCallProvider = ({ children }) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();
  
  // Ref to track current ringtone audio
  const currentRingtoneRef = useRef(null);

  // Helper function to stop current ringtone
  const stopCurrentRingtone = () => {
    console.log('🔇 Stopping current ringtone...');
    
    if (currentRingtoneRef.current) {
      try {
        currentRingtoneRef.current.pause();
        currentRingtoneRef.current.currentTime = 0;
        currentRingtoneRef.current.src = ''; // Clear the source
        currentRingtoneRef.current.load(); // Force reload to stop
        console.log('✅ Stopped current ringtone from ref');
      } catch (error) {
        console.error('❌ Error stopping current ringtone from ref:', error);
      }
      currentRingtoneRef.current = null;
    }
    
    // Also stop any ringtone audio from incoming call data
    if (incomingCall?.ringtoneAudio) {
      try {
        incomingCall.ringtoneAudio.pause();
        incomingCall.ringtoneAudio.currentTime = 0;
        incomingCall.ringtoneAudio.src = '';
        incomingCall.ringtoneAudio.load();
        console.log('✅ Stopped ringtone from incoming call data');
      } catch (error) {
        console.error('❌ Error stopping ringtone from incoming call data:', error);
      }
    }
    
    // Force stop any other audio elements that might be playing ringtone
    document.querySelectorAll('audio').forEach(audio => {
      if (audio.src && (audio.src.includes('RINGING.mp3') || audio.src.includes('RINGTONE.mp3'))) {
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.src = '';
          audio.load();
          console.log('✅ Stopped additional ringtone audio element');
        } catch (error) {
          console.error('❌ Error stopping additional ringtone audio:', error);
        }
      }
    });
    
    console.log('🎵 Current ringtone cleanup completed');
  };

  // Global cleanup function to stop all media tracks
  const forceStopAllMediaTracks = () => {
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
    if (navigator.mediaDevices) {
      try {
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
  };

  // Comprehensive audio cleanup function
  const forceStopAllAudio = () => {
    console.log('🔇 Force stopping all audio...');
    
    // Stop current ringtone
    stopCurrentRingtone();
    
    // Stop any audio elements that might be playing call-related sounds
    document.querySelectorAll('audio').forEach(audio => {
      try {
        if (audio.src && (
          audio.src.includes('RINGING.mp3') || 
          audio.src.includes('RINGTONE.mp3') ||
          audio.src.includes('notification.mp3')
        )) {
          audio.pause();
          audio.currentTime = 0;
          audio.src = '';
          audio.load();
          console.log('✅ Stopped call-related audio element');
        }
      } catch (error) {
        console.error('❌ Error stopping audio element:', error);
      }
    });
    
    // Stop vibration
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
    
    console.log('🎵 All audio cleanup completed');
  };

  // Listen for incoming video calls globally
  useEffect(() => {
    if (!socket || !authUser) return;

    const handleIncomingCall = (data) => {
      if (data.recipientId === authUser._id) {
        // Stop any existing ringtone first
        stopCurrentRingtone();
        
        setIncomingCall(data);
        
        // iOS-style vibration pattern (if supported)
        if (navigator.vibrate) {
          // Vibration pattern: wait 1s, vibrate 200ms, wait 100ms, vibrate 200ms, wait 100ms, vibrate 200ms
          navigator.vibrate([1000, 200, 100, 200, 100, 200]);
        }
        
        // Play notification sound (if supported)
        try {
          // Check if user has enabled ringtone
          if (authUser?.soundSettings?.ringtone !== false) {
            const audio = new Audio('/src/assets/sounds/RINGTONE.mp3'); // Use custom ringtone for incoming call
            audio.volume = 0.7;
            audio.loop = true; // Loop the ringtone
            audio.play().catch(e => {});
            
            // Store audio reference to stop it later
            currentRingtoneRef.current = audio;
            data.ringtoneAudio = audio;
          }
        } catch (error) {
          // Audio not supported
        }
        
        // Auto-dismiss incoming call after 60 seconds
        setTimeout(() => {
          setIncomingCall(prev => {
            if (prev && prev.recipientId === authUser._id) {
              // Stop the ringtone and all audio
              forceStopAllAudio();
              toast.error('Call timed out');
              return null;
            }
            return prev;
          });
        }, 60000);
      }
    };

    const handleCallEnded = (data) => {
      console.log('Received videoCallEnded event:', data, 'Current user:', authUser._id);
      if (data.recipientId === authUser._id || data.callerId === authUser._id) {
        console.log('Processing videoCallEnded for current user');
        // Stop any playing ringtone and all audio
        forceStopAllAudio();
        
        // Show appropriate message based on the call state
        if (incomingCall) {
          // If there's an incoming call, it means the call was rejected before being accepted
          if (data.callerId === authUser._id) {
            // This shouldn't happen, but just in case
            toast('Call ended', { icon: '📞' });
          } else {
            toast('Call was rejected', { icon: '❌' });
          }
        } else if (activeCall) {
          // If there's an active call, it means the call was ended after being accepted
          toast('Call ended', { icon: '📞' });
        }
        
        setIncomingCall(null);
        setActiveCall(null);
        setShowVideoCall(false);
      }
    };

    socket.on('videoCallStarted', handleIncomingCall);
    socket.on('videoCallEnded', handleCallEnded);

    return () => {
      socket.off('videoCallStarted', handleIncomingCall);
      socket.off('videoCallEnded', handleCallEnded);
    };
  }, [socket, authUser]);

  // Cleanup effect to stop ringtone on unmount
  useEffect(() => {
    return () => {
      forceStopAllAudio();
    };
  }, []);

  // Global cleanup when page is unloaded or becomes hidden
  useEffect(() => {
    const handlePageUnload = () => {
      forceStopAllMediaTracks();
      forceStopAllAudio();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, ensure media tracks are stopped
        forceStopAllMediaTracks();
        forceStopAllAudio();
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handlePageUnload);
    window.addEventListener('unload', handlePageUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handlePageUnload);
      window.removeEventListener('unload', handlePageUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle incoming call response
  const handleIncomingCallResponse = (accept) => {
    // Stop the ringtone and all audio
    forceStopAllAudio();
    
    if (accept && incomingCall) {
      // Use the incoming call data which contains the correct channel name
      const activeCallData = {
        recipientId: incomingCall.callerId, // The recipient becomes the caller for the video call
        callerId: authUser._id,
        callerName: authUser.fullName,
        channelName: incomingCall.channelName // Use the channel name from the incoming call
      };
      
      setActiveCall(activeCallData);
      setShowVideoCall(true);
    } else if (!accept && incomingCall) {
      // Emit call ended event to notify the caller that their call was rejected
      if (socket) {
        console.log('Emitting videoCallEnded for rejected call:', {
          recipientId: incomingCall.callerId,
          callerId: authUser._id
        });
        socket.emit('videoCallEnded', {
          recipientId: incomingCall.callerId,
          callerId: authUser._id
        });
      }
    }
    setIncomingCall(null);
  };

  // Start outgoing call
  const startOutgoingCall = (recipientId, recipientName) => {
    const channelName = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const callData = {
      recipientId,
      callerId: authUser._id,
      callerName: authUser.fullName,
      channelName
    };
    
    setActiveCall(callData);
    setShowVideoCall(true);
    
    // Emit socket event to notify recipient
    if (socket && recipientId) {
      socket.emit('videoCallStarted', callData);
    }
    
    return callData;
  };

  // End active call
  const endCall = () => {
    console.log('endCall called, activeCall:', activeCall);
    // Stop any playing ringtone and all audio
    forceStopAllAudio();
    
    // Force stop all media tracks
    forceStopAllMediaTracks();
    
    // Emit socket event to notify recipient that call ended
    if (socket && activeCall?.recipientId) {
      console.log('Emitting videoCallEnded from endCall:', {
        recipientId: activeCall.recipientId,
        callerId: authUser._id
      });
      socket.emit('videoCallEnded', {
        recipientId: activeCall.recipientId,
        callerId: authUser._id
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
    forceStopAllAudio
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
      
      {/* Global Video Call Popup */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          {/* iOS-style incoming call UI */}
          <div className="w-full max-w-sm bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-slideUp">
            {/* Animated background rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Outer ring */}
                <div className="w-80 h-80 border-2 border-green-400/20 rounded-full animate-ping"></div>
                {/* Middle ring */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-green-400/30 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
                {/* Inner ring */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-green-400/40 rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
              </div>
            </div>
            
            <div className="relative z-10 text-center">
              {/* Caller Avatar with iOS-style design */}
              <div className="relative mb-8 animate-bounce" style={{ animationDuration: '2s', animationIterationCount: 'infinite' }}>
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-white/20">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <span className="text-3xl font-bold text-gray-800">
                      {incomingCall.callerName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                
                {/* Live indicator */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                
                {/* Video call icon */}
                <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </div>
              </div>
              
              {/* Caller Name */}
              <h3 className="text-white text-2xl font-bold mb-2 tracking-wide animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                {incomingCall.callerName}
              </h3>
              
              {/* Call Type */}
              <p className="text-green-400 text-lg font-medium mb-2 animate-fadeIn" style={{ animationDelay: '0.4s' }}>Video Call</p>
              
              {/* Status */}
              <p className="text-gray-400 text-sm mb-8 animate-fadeIn" style={{ animationDelay: '0.6s' }}>Incoming call...</p>
              
              {/* Action Buttons - iOS Style */}
              <div className="space-y-4 animate-fadeIn" style={{ animationDelay: '0.8s' }}>
                {/* Accept Button */}
                <button
                  onClick={() => handleIncomingCallResponse(true)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full py-4 px-6 font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 active:scale-95"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Accept
                </button>
                
                {/* Decline Button */}
                <button
                  onClick={() => handleIncomingCallResponse(false)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white rounded-full py-4 px-6 font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 active:scale-95"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Decline
                </button>
              </div>
              
              {/* Call duration hint */}
              <p className="text-gray-500 text-xs mt-6 animate-fadeIn" style={{ animationDelay: '1s' }}>
                Tap to answer or decline
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Global Video Call Interface */}
      {showVideoCall && activeCall && (
        <VideoCall 
          key="global-video-call"
          recipientId={activeCall.recipientId}
          socket={socket}
          currentUser={authUser}
          isIncoming={!!incomingCall}
          channelName={activeCall.channelName}
          onCallEnded={endCall}
        />
      )}
    </VideoCallContext.Provider>
  );
}; 