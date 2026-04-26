// SocketContext — connect/disconnect a single Socket.IO client to the backend
// for the logged-in user, expose `socket` + `onlineUsers`, and bridge a few
// server events into app state.
//
// Notification sounds live in `useListenMessages` (the per-conversation hook),
// not here, to avoid playing twice for the same message.

import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuthContext } from "./AuthContext";
import useConversation from "../zustand/useConversation";
import { getSocketUrl } from "../config/api";

const SocketContext = createContext(null);

export const useSocketContext = () => useContext(SocketContext);

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const { authUser } = useAuthContext();
	const updateMessageReaction = useConversation((s) => s.updateMessageReaction);
	const updateMessageStatus = useConversation((s) => s.updateMessageStatus);
	const updateMultipleMessageStatuses = useConversation((s) => s.updateMultipleMessageStatuses);

	useEffect(() => {
		if (!authUser) {
			// Logged out — no socket needed.
			setSocket((existing) => {
				existing?.disconnect();
				return null;
			});
			setOnlineUsers([]);
			return;
		}

		const newSocket = io(getSocketUrl(), {
			query: { userId: authUser._id },
			transports: ["websocket", "polling"],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		// Presence
		newSocket.on("getOnlineUsers", setOnlineUsers);

		// Inbound message — let conversation list refresh, but DON'T add to
		// `messages` here (the open-conversation hook handles that and avoids
		// duplicates).
		newSocket.on("newMessage", (msg) => {
			window.dispatchEvent(
				new CustomEvent("updateConversation", {
					detail: {
						senderId: msg.senderId,
						receiverId: msg.receiverId,
						message: msg,
					},
				}),
			);
		});

		// Reactions
		newSocket.on("messageReactionAdded", (d) =>
			updateMessageReaction(d.messageId, "add", d.reaction),
		);
		newSocket.on("messageReactionRemoved", (d) =>
			updateMessageReaction(d.messageId, "remove", d.reaction),
		);

		// Delivery / read receipts
		newSocket.on("messageDelivered", (d) =>
			updateMessageStatus(d.messageId, "delivered", d.deliveredAt),
		);
		newSocket.on("messageRead", (d) =>
			updateMessageStatus(d.messageId, "read", d.readAt),
		);
		newSocket.on("messagesRead", (d) =>
			updateMultipleMessageStatuses(d.messageIds, "read", d.readAt),
		);

		// System settings — bridge to a DOM event so any hook can subscribe
		// without needing the socket directly.
		newSocket.on("systemSettingsUpdated", (data) => {
			window.dispatchEvent(
				new CustomEvent("systemSettingsUpdated", { detail: data }),
			);
		});

		newSocket.on("connect_error", (err) => {
			console.error("Socket connect error:", err.message);
		});

		setSocket(newSocket);

		return () => {
			newSocket.disconnect();
		};
	}, [authUser?._id]);

	return (
		<SocketContext.Provider value={{ socket, onlineUsers }}>
			{children}
		</SocketContext.Provider>
	);
};
