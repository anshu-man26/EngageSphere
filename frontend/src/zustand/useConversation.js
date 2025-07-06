import { create } from "zustand";

const useConversation = create((set, get) => ({
	selectedConversation: null,
	setSelectedConversation: (selectedConversation) => {
		// Always clear messages when switching conversations to ensure clean state
		const currentConversation = get().selectedConversation;
		
		if (!currentConversation || currentConversation._id !== selectedConversation?._id) {
			// Clear messages and uploading files when switching to a different conversation
			set({ 
				selectedConversation, 
				messages: [], 
				uploadingFiles: [],
				activeEmojiPicker: null // Close any open emoji picker
			});
			
			// Reset unread count for the selected conversation
			if (selectedConversation && selectedConversation._id) {
				// Dispatch event to reset unread count
				window.dispatchEvent(new CustomEvent('resetConversationUnreadCount', {
					detail: { conversationId: selectedConversation._id }
				}));
			}
			
			// Only refresh conversations if we're switching to an existing conversation
			// Don't refresh when creating a new conversation from user list
			if (selectedConversation && selectedConversation._id && selectedConversation.participant) {
				// This is an existing conversation, refresh to get latest data
				setTimeout(() => {
					window.dispatchEvent(new Event('refreshConversations'));
				}, 100);
			}
		} else {
			// If it's the same conversation, just update the conversation object
			set({ selectedConversation });
		}
	},
	messages: [],
	setMessages: (messages) => {
		// Ensure messages is always an array
		const messagesArray = Array.isArray(messages) ? messages : [];
		set({ messages: messagesArray });
	},
	// Global emoji picker state - only one can be open at a time
	activeEmojiPicker: null, // messageId of the message with open emoji picker
	setActiveEmojiPicker: (messageId) => {
		set({ activeEmojiPicker: messageId });
	},
	clearActiveEmojiPicker: () => {
		set({ activeEmojiPicker: null });
	},

	// Helper function to add a single message
	addMessage: (newMessage) => {
		const { messages } = get();
		const messagesArray = Array.isArray(messages) ? messages : [];
		
		// Check if message already exists to prevent duplicates
		const messageExists = messagesArray.some(msg => msg._id === newMessage._id);
		if (messageExists) {
			console.log("Message already exists, skipping duplicate:", newMessage._id);
			return;
		}
		
		set({ messages: [...messagesArray, newMessage] });
	},
	// Helper function to remove a single message
	removeMessage: (messageId) => {
		const { messages } = get();
		const messagesArray = Array.isArray(messages) ? messages : [];
		const filteredMessages = messagesArray.filter(msg => msg._id !== messageId);
		set({ messages: filteredMessages });
	},
	// Helper function to remove multiple messages
	removeMessages: (messageIds) => {
		const { messages } = get();
		const messagesArray = Array.isArray(messages) ? messages : [];
		const filteredMessages = messagesArray.filter(msg => !messageIds.includes(msg._id));
		set({ messages: filteredMessages });
	},
	// Helper function to update a message (for marking as deleted)
	updateMessage: (messageId, updates) => {
		const { messages } = get();
		const messagesArray = Array.isArray(messages) ? messages : [];
		const updatedMessages = messagesArray.map(msg => 
			msg._id === messageId ? { ...msg, ...updates } : msg
		);
		set({ messages: updatedMessages });
	},
	// Helper function to update message reactions
	updateMessageReaction: (messageId, action, reaction) => {
		const { messages } = get();
		const messagesArray = Array.isArray(messages) ? messages : [];
		const updatedMessages = messagesArray.map(msg => {
			if (msg._id === messageId) {
				const updatedMessage = { ...msg };
				
				if (!updatedMessage.reactions) {
					updatedMessage.reactions = [];
				}
				
				if (action === 'add') {
					// Check if user already reacted with this emoji
					const existingIndex = updatedMessage.reactions.findIndex(
						r => r.userId === reaction.userId && r.emoji === reaction.emoji
					);
					if (existingIndex === -1) {
						updatedMessage.reactions.push(reaction);
					}
				} else if (action === 'remove') {
					updatedMessage.reactions = updatedMessage.reactions.filter(
						r => !(r.userId === reaction.userId && r.emoji === reaction.emoji)
					);
				}
				
				return updatedMessage;
			}
			return msg;
		});
		set({ messages: updatedMessages });
	},
	// Helper function to update message status
	updateMessageStatus: (messageId, status, timestamp) => {
		const { messages } = get();
		const messagesArray = Array.isArray(messages) ? messages : [];
		const updatedMessages = messagesArray.map(msg => {
			if (msg._id === messageId) {
				const updatedMessage = { ...msg, status };
				if (status === 'delivered' && timestamp) {
					updatedMessage.deliveredAt = timestamp;
				} else if (status === 'read' && timestamp) {
					updatedMessage.readAt = timestamp;
				}
				return updatedMessage;
			}
			return msg;
		});
		set({ messages: updatedMessages });
	},
	// Helper function to update multiple message statuses
	updateMultipleMessageStatuses: (messageIds, status, timestamp) => {
		const { messages } = get();
		const messagesArray = Array.isArray(messages) ? messages : [];
		const updatedMessages = messagesArray.map(msg => {
			if (messageIds.includes(msg._id)) {
				const updatedMessage = { ...msg, status };
				if (status === 'delivered' && timestamp) {
					updatedMessage.deliveredAt = timestamp;
				} else if (status === 'read' && timestamp) {
					updatedMessage.readAt = timestamp;
				}
				return updatedMessage;
			}
			return msg;
		});
		set({ messages: updatedMessages });
	},
	// Helper function to refresh conversations
	refreshConversations: () => {
		// Trigger conversation refresh
		window.dispatchEvent(new Event('refreshConversations'));
	},
	// Helper function to clear messages
	clearMessages: () => {
		set({ messages: [] });
	},
	// Uploading files state
	uploadingFiles: [],
	addUploadingFile: (file) => {
		const { uploadingFiles } = get();
		const uploadingFile = {
			id: Date.now() + Math.random(), // Unique ID
			fileName: file.name,
			fileSize: file.size,
			fileType: file.type.startsWith('image/') ? 'image' : 'document',
			message: "",
			senderId: null, // Will be set when we have the user context
			receiverId: null, // Will be set when we have the conversation context
			createdAt: new Date().toISOString(),
		};
		set({ uploadingFiles: [...uploadingFiles, uploadingFile] });
		return uploadingFile.id;
	},
	removeUploadingFile: (fileId) => {
		const { uploadingFiles } = get();
		set({ uploadingFiles: uploadingFiles.filter(file => file.id !== fileId) });
	},
	// Search functionality
	searchTerm: "",
	setSearchTerm: (searchTerm) => {
		set({ searchTerm });
	},
	clearSearch: () => {
		set({ searchTerm: "" });
	},
	// Update conversation background
	updateConversationBackground: (conversationId, background) => {
		const { selectedConversation } = get();
		if (selectedConversation && selectedConversation._id === conversationId) {
			set({ 
				selectedConversation: { 
					...selectedConversation, 
					chatBackground: background 
				} 
			});
		}
	},
	// Reset function to clear all state
	reset: () => {
		set({ selectedConversation: null, messages: [], searchTerm: "", uploadingFiles: [] });
	},
}));

export default useConversation;
