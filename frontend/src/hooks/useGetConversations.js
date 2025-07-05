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
				// If conversation doesn't exist, we might need to refresh the list
				// This could happen for new conversations
				setTimeout(() => getConversations(), 100);
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

			// Increment unread count if the message is for the current user
			if (newMessage.receiverId === authUser?._id && newMessage.status !== 'read') {
				conversation.unreadCount = (conversation.unreadCount || 0) + 1;
			}

			// Move this conversation to the top
			updatedConversations.splice(conversationIndex, 1);
			updatedConversations.unshift(conversation);

			return updatedConversations;
		});
	}, [authUser?._id, getConversations]);

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
			if (conversation.unreadCount > 0) {
				conversation.unreadCount = Math.max(0, conversation.unreadCount - 1);
			}

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

		window.addEventListener('refreshConversations', handleRefresh);
		window.addEventListener('updateConversation', handleUpdateConversation);
		window.addEventListener('messageRead', handleMessageReadUpdate);

		return () => {
			window.removeEventListener('refreshConversations', handleRefresh);
			window.removeEventListener('updateConversation', handleUpdateConversation);
			window.removeEventListener('messageRead', handleMessageReadUpdate);
		};
	}, [getConversations, updateConversation, handleMessageRead]);

	return { loading, conversations, setConversations, getConversations };
};
export default useGetConversations;
