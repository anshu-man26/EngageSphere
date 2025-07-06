import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

const useGetConversations = () => {
	const [loading, setLoading] = useState(false);
	const [conversations, setConversations] = useState([]);
	const { authUser } = useAuthContext();

	const getConversations = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/users/conversations", {
				credentials: "include"
			});
			const data = await res.json();
			
			if (data.error) {
				throw new Error(data.error);
			}
			setConversations(data);
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	}, []);

	// Function to update a specific conversation
	const updateConversation = useCallback((senderId, receiverId, newMessage) => {
		setConversations(prevConversations => {
			// Find the conversation that should be updated
			const conversationIndex = prevConversations.findIndex(conv => {
				const participantId = conv.participant._id;
				return (participantId === senderId || participantId === receiverId);
			});

			if (conversationIndex === -1) {
				// If conversation doesn't exist, don't refresh the list
				// This prevents unnecessary refreshes when clicking on users
				return prevConversations;
			}

			// Create updated conversation
			const updatedConversations = [...prevConversations];
			const conversation = { ...updatedConversations[conversationIndex] };

			// Update last message
			conversation.lastMessage = {
				message: newMessage.message,
				createdAt: newMessage.createdAt,
				senderId: newMessage.senderId
			};
			conversation.lastMessageTime = newMessage.createdAt;

			// Increment unread count if the message is for the current user and not from themselves
			if (newMessage.receiverId === authUser?._id && 
				newMessage.senderId !== authUser?._id && 
				newMessage.status !== 'read') {
				conversation.unreadCount = (conversation.unreadCount || 0) + 1;
			}

			// Move this conversation to the top
			updatedConversations.splice(conversationIndex, 1);
			updatedConversations.unshift(conversation);

			return updatedConversations;
		});
	}, [authUser?._id]);

	// Function to handle message read status updates
	const handleMessageRead = useCallback((senderId, receiverId) => {
		setConversations(prevConversations => {
			// Find the conversation that should be updated
			const conversationIndex = prevConversations.findIndex(conv => {
				const participantId = conv.participant._id;
				return (participantId === senderId || participantId === receiverId);
			});

			if (conversationIndex === -1) return prevConversations;

			// Create updated conversation
			const updatedConversations = [...prevConversations];
			const conversation = { ...updatedConversations[conversationIndex] };

			// Decrement unread count if this is the current user's conversation
			// and the message was sent to the current user
			if (conversation.unreadCount > 0 && receiverId === authUser?._id) {
				conversation.unreadCount = Math.max(0, conversation.unreadCount - 1);
			}

			updatedConversations[conversationIndex] = conversation;
			return updatedConversations;
		});
	}, [authUser?._id]);

	// Function to handle bulk message read status updates
	const handleMessagesRead = useCallback((messageIds, senderId, receiverId) => {
		setConversations(prevConversations => {
			// Find the conversation that should be updated
			const conversationIndex = prevConversations.findIndex(conv => {
				const participantId = conv.participant._id;
				return (participantId === senderId || participantId === receiverId);
			});

			if (conversationIndex === -1) return prevConversations;

			// Create updated conversation
			const updatedConversations = [...prevConversations];
			const conversation = { ...updatedConversations[conversationIndex] };

			// Decrement unread count by the number of messages that were read
			// if this is the current user's conversation and messages were sent to the current user
			if (conversation.unreadCount > 0 && receiverId === authUser?._id) {
				const messagesReadCount = messageIds.length;
				conversation.unreadCount = Math.max(0, conversation.unreadCount - messagesReadCount);
			}

			updatedConversations[conversationIndex] = conversation;
			return updatedConversations;
		});
	}, [authUser?._id]);

	// Function to reset unread count for a specific conversation (when selected)
	const resetConversationUnreadCount = useCallback((conversationId) => {
		setConversations(prevConversations => {
			const conversationIndex = prevConversations.findIndex(conv => conv._id === conversationId);
			if (conversationIndex === -1) return prevConversations;

			const updatedConversations = [...prevConversations];
			const conversation = { ...updatedConversations[conversationIndex] };
			conversation.unreadCount = 0;
			updatedConversations[conversationIndex] = conversation;
			return updatedConversations;
		});
	}, []);

	useEffect(() => {
		getConversations();

		// Listen for refresh events (for full refresh)
		const handleRefresh = () => {
			getConversations();
		};

		// Listen for targeted conversation updates
		const handleUpdateConversation = (event) => {
			const { senderId, receiverId, message } = event.detail;
			updateConversation(senderId, receiverId, message);
		};

		// Listen for message read updates
		const handleMessageReadUpdate = (event) => {
			const { senderId, receiverId } = event.detail;
			handleMessageRead(senderId, receiverId);
		};

		// Listen for bulk message read updates
		const handleMessagesReadUpdate = (event) => {
			const { messageIds, senderId, receiverId } = event.detail;
			handleMessagesRead(messageIds, senderId, receiverId);
		};

		// Listen for reset unread count events
		const handleResetUnreadCount = (event) => {
			const { conversationId } = event.detail;
			resetConversationUnreadCount(conversationId);
		};

		window.addEventListener('refreshConversations', handleRefresh);
		window.addEventListener('updateConversation', handleUpdateConversation);
		window.addEventListener('messageRead', handleMessageReadUpdate);
		window.addEventListener('messagesRead', handleMessagesReadUpdate);
		window.addEventListener('resetConversationUnreadCount', handleResetUnreadCount);

		return () => {
			window.removeEventListener('refreshConversations', handleRefresh);
			window.removeEventListener('updateConversation', handleUpdateConversation);
			window.removeEventListener('messageRead', handleMessageReadUpdate);
			window.removeEventListener('messagesRead', handleMessagesReadUpdate);
			window.removeEventListener('resetConversationUnreadCount', handleResetUnreadCount);
		};
	}, [getConversations, updateConversation, handleMessageRead, handleMessagesRead, resetConversationUnreadCount]);

	return { loading, conversations, setConversations, getConversations, resetConversationUnreadCount };
};
export default useGetConversations;
