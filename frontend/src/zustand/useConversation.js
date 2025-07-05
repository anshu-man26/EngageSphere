import { create } from "zustand";

const useConversation = create((set, get) => ({
	selectedConversation: null,
	setSelectedConversation: (selectedConversation) => {
		// Only clear messages if we're actually switching to a different conversation
		const currentConversation = get().selectedConversation;
		
		if (!currentConversation || currentConversation._id !== selectedConversation?._id) {
			set({ selectedConversation, messages: [], uploadingFiles: [] });
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
