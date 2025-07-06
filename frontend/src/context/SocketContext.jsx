import { createContext, useState, useEffect, useContext } from "react";
import { useAuthContext } from "./AuthContext";
import useConversation from "../zustand/useConversation";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => {
	return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const { authUser } = useAuthContext();
	const { updateMessageReaction, updateMessageStatus, updateMultipleMessageStatuses } = useConversation();

	// Play notification sound
	const playNotificationSound = () => {
		// Check if user has enabled message sounds
		if (!authUser?.soundSettings?.messageSound) {
			return;
		}
		
		try {
			const audio = new Audio('/sounds/notification.mp3');
			audio.volume = 0.5;
			audio.play().catch(error => {
				console.log("Could not play notification sound:", error);
			});
		} catch (error) {
			console.log("Error playing notification sound:", error);
		}
	};

	useEffect(() => {
		if (authUser) {
			// Prevent duplicate socket connections
			if (socket && socket.connected) {
				console.log("Socket already connected, skipping new connection");
				return;
			}

			const newSocket = io("/", {
				query: {
					userId: authUser._id,
				},
				transports: ['websocket', 'polling'],
				reconnection: true,
				reconnectionAttempts: 5,
				reconnectionDelay: 1000,
			});

			newSocket.on("connect", () => {
				setOnlineUsers(prev => [...prev, authUser._id]);
			});

			newSocket.on("connect_error", (error) => {
				console.error("Socket connection error:", error);
			});

			newSocket.on("disconnect", (reason) => {
				setOnlineUsers(prev => prev.filter(id => id !== authUser._id));
			});

			// socket.on() is used to listen to the events. can be used both on client and server side
			newSocket.on("getOnlineUsers", (users) => {
				setOnlineUsers(users);
			});

			// Listen for new message events
			newSocket.on("newMessage", (newMessage) => {
				// Only handle notification and conversation refresh, not message adding
				// Message adding is handled by useListenMessages hook
				if (newMessage.senderId && newMessage.receiverId) {
					// This is a new message
					if (newMessage.senderId !== authUser._id) {
						// Play notification sound
						playNotificationSound();
					}
				}
				
				// Update specific conversation instead of refreshing entire list
				window.dispatchEvent(new CustomEvent('updateConversation', {
					detail: {
						senderId: newMessage.senderId,
						receiverId: newMessage.receiverId,
						message: newMessage
					}
				}));
			});

			// Listen for conversation updates
			newSocket.on("conversationUpdated", (data) => {
				console.log("Conversation updated via socket:", data);
				// This will be handled by the conversation store
			});

			// Listen for reaction events
			newSocket.on("messageReactionAdded", (data) => {
				updateMessageReaction(data.messageId, 'add', data.reaction);
			});

			newSocket.on("messageReactionRemoved", (data) => {
				updateMessageReaction(data.messageId, 'remove', data.reaction);
			});

			// Listen for message status events
			newSocket.on("messageDelivered", (data) => {
				// Update message status to delivered
				updateMessageStatus(data.messageId, 'delivered', data.deliveredAt);
			});

			newSocket.on("messageRead", (data) => {
				// Update message status to read
				updateMessageStatus(data.messageId, 'read', data.readAt);
			});

			newSocket.on("messagesRead", (data) => {
				// Update multiple messages status to read
				updateMultipleMessageStatuses(data.messageIds, 'read', data.readAt);
			});

			// Listen for system settings updates
			newSocket.on("systemSettingsUpdated", (data) => {
				console.log("🔄 System settings updated via socket:", data);
				// Dispatch a custom event to notify all components using system settings
				window.dispatchEvent(new CustomEvent('systemSettingsUpdated', {
					detail: data
				}));
			});

			setSocket(newSocket);

			// Set up heartbeat interval
			const heartbeatInterval = setInterval(() => {
				if (newSocket.connected) {
					newSocket.emit("heartbeat");
				}
			}, 30000); // Send heartbeat every 30 seconds

			// Set up user activity tracking
			const handleUserActivity = () => {
				if (newSocket.connected) {
					newSocket.emit("userActivity");
				}
			};

			// Track user activity events
			const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
			activityEvents.forEach(event => {
				document.addEventListener(event, handleUserActivity, { passive: true });
			});

			return () => {
				clearInterval(heartbeatInterval);
				activityEvents.forEach(event => {
					document.removeEventListener(event, handleUserActivity);
				});
				newSocket.disconnect();
			};
		} else {
			if (socket) {
				socket.disconnect();
				setSocket(null);
			}
			setOnlineUsers([]);
		}
	}, [authUser]);

	return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>;
};
