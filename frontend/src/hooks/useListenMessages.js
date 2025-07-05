import { useEffect } from "react";

import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";
import { useAuthContext } from "../context/AuthContext";

import notificationSound from "../assets/sounds/notification.mp3";

const useListenMessages = () => {
	const { socket } = useSocketContext();
	const { addMessage, removeMessage, removeMessages, updateMessage, selectedConversation } = useConversation();
	const { authUser } = useAuthContext();

	useEffect(() => {
		if (!socket) return;

		const handleNewMessage = (newMessage) => {
			// Only add message if it belongs to the current conversation
			// Check if the current user is involved in this message and if we have a selected conversation
			if (selectedConversation && authUser && 
				((newMessage.senderId === authUser._id && newMessage.receiverId === selectedConversation._id) ||
				 (newMessage.senderId === selectedConversation._id && newMessage.receiverId === authUser._id))) {
				newMessage.shouldShake = true;
				const sound = new Audio(notificationSound);
				sound.play().catch(err => {});
				
				// Use the addMessage helper to safely add the new message
				addMessage(newMessage);
			}
		};

		const handleMessageDeleted = (data) => {
			// Update the message to show "This message was deleted" for everyone
			if (data.deleteForEveryone) {
				updateMessage(data.messageId, {
					deletedForEveryone: true,
					message: "This message was deleted",
					fileUrl: "",
					fileName: "",
					fileSize: 0
				});
			} else {
				// Remove the message if it's deleted for me only
				removeMessage(data.messageId);
			}
		};

		const handleMessagesDeleted = (data) => {
			// Update multiple messages to show "This message was deleted" for everyone
			if (data.deleteForEveryone) {
				data.messageIds.forEach(messageId => {
					updateMessage(messageId, {
						deletedForEveryone: true,
						message: "This message was deleted",
						fileUrl: "",
						fileName: "",
						fileSize: 0
					});
				});
			} else {
				// Remove the messages if they're deleted for me only
				removeMessages(data.messageIds);
			}
		};

		socket.on("newMessage", handleNewMessage);
		socket.on("messageDeleted", handleMessageDeleted);
		socket.on("messagesDeleted", handleMessagesDeleted);

		return () => {
			socket.off("newMessage", handleNewMessage);
			socket.off("messageDeleted", handleMessageDeleted);
			socket.off("messagesDeleted", handleMessagesDeleted);
		};
	}, [socket, addMessage, removeMessage, removeMessages, updateMessage, selectedConversation, authUser]);
};
export default useListenMessages;
