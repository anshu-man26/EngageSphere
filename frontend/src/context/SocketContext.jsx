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
	const { updateMessageReaction } = useConversation();

	useEffect(() => {
		if (authUser) {
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

			// Listen for reaction events
			newSocket.on("messageReactionAdded", (data) => {
				updateMessageReaction(data.messageId, 'add', data.reaction);
			});

			newSocket.on("messageReactionRemoved", (data) => {
				updateMessageReaction(data.messageId, 'remove', data.reaction);
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
