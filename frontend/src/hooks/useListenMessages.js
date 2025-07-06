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
		if (!socket || !selectedConversation) return;

		const handleNewMessage = (newMessage) => {
			// Check if this message belongs to the current conversation
			const isCurrentConversation = 
				((newMessage.senderId === authUser._id && newMessage.receiverId === selectedConversation.participant?._id) ||
				(newMessage.senderId === selectedConversation.participant?._id && newMessage.receiverId === authUser._id));

			if (isCurrentConversation) {
				newMessage.shouldShake = true;
				
				// Check if user has enabled message sounds
				if (authUser?.soundSettings?.messageSound !== false) {
					const sound = new Audio(notificationSound);
					sound.play().catch(err => {});
				}
				
				// Use the addMessage helper to safely add the new message
				addMessage(newMessage);
			}
		};

		const handleMessageDeleted = (data) => {
			// Only show "This message was deleted" if someone else deleted it
			// Don't show it if the current user deleted their own message
			if (data.deleteForEveryone && data.deletedBy !== authUser._id) {
				updateMessage(data.messageId, {
					deletedForEveryone: true,
					message: "This message was deleted",
					fileUrl: "",
					fileName: "",
					fileSize: 0
				});
			} else if (data.deleteForEveryone && data.deletedBy === authUser._id) {
				// If current user deleted the message, just remove it from view
				removeMessage(data.messageId);
			} else {
				// Remove the message if it's deleted for me only
				removeMessage(data.messageId);
			}
		};

		const handleMessagesDeleted = (data) => {
			// Only show "This message was deleted" if someone else deleted the messages
			// Don't show it if the current user deleted their own messages
			if (data.deleteForEveryone && data.deletedBy !== authUser._id) {
				data.messageIds.forEach(messageId => {
					updateMessage(messageId, {
						deletedForEveryone: true,
						message: "This message was deleted",
						fileUrl: "",
						fileName: "",
						fileSize: 0
					});
				});
			} else if (data.deleteForEveryone && data.deletedBy === authUser._id) {
				// If current user deleted the messages, just remove them from view
				removeMessages(data.messageIds);
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
	}, [socket, selectedConversation, authUser._id, addMessage, removeMessage, removeMessages, updateMessage]);
};
export default useListenMessages;
