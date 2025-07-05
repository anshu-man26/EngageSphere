import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
	try {
		const { message } = req.body;
		const { id: receiverId } = req.params;
		const senderId = req.user._id;

		if (!message || !message.trim()) {
			return res.status(400).json({ error: "Message cannot be empty" });
		}

		if (!receiverId) {
			return res.status(400).json({ error: "Receiver ID is required" });
		}

		if (senderId.toString() === receiverId) {
			return res.status(400).json({ error: "Cannot send message to yourself" });
		}

		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, receiverId] },
		});

		if (!conversation) {
			conversation = await Conversation.create({
				participants: [senderId, receiverId],
			});
		}

		const newMessage = new Message({
			senderId,
			receiverId,
			message: message.trim(),
		});

		if (newMessage) {
			conversation.messages.push(newMessage._id);
		}

		// Update conversation with last message info
		conversation.lastMessage = newMessage._id;
		conversation.lastMessageTime = new Date();

		// this will run in parallel
		await Promise.all([conversation.save(), newMessage.save()]);

		// SOCKET IO FUNCTIONALITY WILL GO HERE
		const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			// io.to(<socket_id>).emit() used to send events to specific client
			io.to(receiverSocketId).emit("newMessage", newMessage);
		}

		res.status(201).json(newMessage);
	} catch (error) {
		console.log("Error in sendMessage controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const deleteMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		const { deleteForEveryone } = req.body;
		const userId = req.user._id;

		const message = await Message.findById(messageId);
		if (!message) {
			return res.status(404).json({ error: "Message not found" });
		}

		// Check if user is the sender (for delete for everyone) or participant
		if (deleteForEveryone && message.senderId.toString() !== userId.toString()) {
			return res.status(403).json({ error: "You can only delete your own messages for everyone" });
		}

		if (message.senderId.toString() !== userId.toString() && message.receiverId.toString() !== userId.toString()) {
			return res.status(403).json({ error: "You can only delete messages from your conversations" });
		}

		if (deleteForEveryone) {
			// Delete for everyone
			message.deletedForEveryone = true;
			message.message = "This message was deleted";
			message.fileUrl = "";
			message.fileName = "";
			message.fileSize = 0;
		} else {
			// Delete for me only
			if (!message.deletedFor.includes(userId)) {
				message.deletedFor.push(userId);
			}
		}

		await message.save();

		// Only emit socket event for "delete for everyone" - not for "delete for me"
		if (deleteForEveryone) {
			const otherUserId = message.senderId.toString() === userId.toString() ? message.receiverId : message.senderId;
			const receiverSocketId = getReceiverSocketId(otherUserId);
			if (receiverSocketId) {
				io.to(receiverSocketId).emit("messageDeleted", {
					messageId: message._id,
					deleteForEveryone: deleteForEveryone
				});
			}
		}

		res.status(200).json({ 
			message: "Message deleted successfully",
			deleteForEveryone: deleteForEveryone
		});
	} catch (error) {
		console.log("Error in deleteMessage controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const deleteMultipleMessages = async (req, res) => {
	try {
		const { messageIds, deleteForEveryone } = req.body;
		const userId = req.user._id;

		if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
			return res.status(400).json({ error: "Message IDs are required" });
		}

		const messages = await Message.find({ _id: { $in: messageIds } });
		
		// Check permissions for all messages
		for (const message of messages) {
			if (deleteForEveryone && message.senderId.toString() !== userId.toString()) {
				return res.status(403).json({ error: "You can only delete your own messages for everyone" });
			}

			if (message.senderId.toString() !== userId.toString() && message.receiverId.toString() !== userId.toString()) {
				return res.status(403).json({ error: "You can only delete messages from your conversations" });
			}
		}

		const updatePromises = messages.map(async (message) => {
			if (deleteForEveryone) {
				message.deletedForEveryone = true;
				message.message = "This message was deleted";
				message.fileUrl = "";
				message.fileName = "";
				message.fileSize = 0;
			} else {
				if (!message.deletedFor.includes(userId)) {
					message.deletedFor.push(userId);
				}
			}
			return message.save();
		});

		await Promise.all(updatePromises);

		// Only emit socket events for "delete for everyone" - not for "delete for me"
		if (deleteForEveryone) {
			const affectedUsers = new Set();
			messages.forEach(message => {
				const otherUserId = message.senderId.toString() === userId.toString() ? message.receiverId : message.senderId;
				affectedUsers.add(otherUserId.toString());
			});

			affectedUsers.forEach(userId => {
				const receiverSocketId = getReceiverSocketId(userId);
				if (receiverSocketId) {
					io.to(receiverSocketId).emit("messagesDeleted", {
						messageIds: messageIds,
						deleteForEveryone: deleteForEveryone
					});
				}
			});
		}

		res.status(200).json({ 
			message: "Messages deleted successfully",
			deleteForEveryone: deleteForEveryone,
			deletedCount: messages.length
		});
	} catch (error) {
		console.log("Error in deleteMultipleMessages controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { id: userToChatId } = req.params;
		const senderId = req.user._id;

		if (!userToChatId) {
			return res.status(400).json({ error: "User ID is required" });
		}

		const conversation = await Conversation.findOne({
			participants: { $all: [senderId, userToChatId] },
		}).populate("messages"); // NOT REFERENCE BUT ACTUAL MESSAGES

		if (!conversation) {
			return res.status(200).json([]);
		}

		const messages = conversation.messages || [];

		// Filter out messages deleted for the current user
		const filteredMessages = messages.filter(message => {
			// Don't show messages deleted for the current user (but keep messages deleted for everyone)
			if (message.deletedFor && message.deletedFor.includes(senderId)) return false;
			
			return true;
		});

		// Ensure we always return an array
		const messagesArray = Array.isArray(filteredMessages) ? filteredMessages : [];
		res.status(200).json(messagesArray);
	} catch (error) {
		console.log("Error in getMessages controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const addReaction = async (req, res) => {
	try {
		const { messageId } = req.params;
		const { emoji } = req.body;
		const userId = req.user._id;

		if (!emoji) {
			return res.status(400).json({ error: "Emoji is required" });
		}

		const message = await Message.findById(messageId);
		if (!message) {
			return res.status(404).json({ error: "Message not found" });
		}

		// Check if user is participant in the conversation
		if (message.senderId.toString() !== userId.toString() && message.receiverId.toString() !== userId.toString()) {
			return res.status(403).json({ error: "You can only react to messages from your conversations" });
		}

		// Check if user already reacted with this emoji
		const existingReaction = message.reactions.find(
			reaction => reaction.userId.toString() === userId.toString() && reaction.emoji === emoji
		);

		if (existingReaction) {
			return res.status(400).json({ error: "You have already reacted with this emoji" });
		}

		// Add the reaction
		const newReaction = {
			userId: userId,
			emoji: emoji,
			createdAt: new Date()
		};

		message.reactions.push(newReaction);
		await message.save();

		// Emit socket event to other participant
		const otherUserId = message.senderId.toString() === userId.toString() ? message.receiverId : message.senderId;
		const receiverSocketId = getReceiverSocketId(otherUserId);
		if (receiverSocketId) {
			io.to(receiverSocketId).emit("messageReactionAdded", {
				messageId: message._id,
				reaction: newReaction
			});
		}

		res.status(200).json({ 
			message: "Reaction added successfully",
			reaction: newReaction
		});
	} catch (error) {
		console.log("Error in addReaction controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const removeReaction = async (req, res) => {
	try {
		const { messageId } = req.params;
		const { emoji } = req.body;
		const userId = req.user._id;

		if (!emoji) {
			return res.status(400).json({ error: "Emoji is required" });
		}

		const message = await Message.findById(messageId);
		if (!message) {
			return res.status(404).json({ error: "Message not found" });
		}

		// Check if user is participant in the conversation
		if (message.senderId.toString() !== userId.toString() && message.receiverId.toString() !== userId.toString()) {
			return res.status(403).json({ error: "You can only remove reactions from messages in your conversations" });
		}

		// Find and remove the reaction
		const reactionIndex = message.reactions.findIndex(
			reaction => reaction.userId.toString() === userId.toString() && reaction.emoji === emoji
		);

		if (reactionIndex === -1) {
			return res.status(404).json({ error: "Reaction not found" });
		}

		const removedReaction = message.reactions[reactionIndex];
		message.reactions.splice(reactionIndex, 1);
		await message.save();

		// Emit socket event to other participant
		const otherUserId = message.senderId.toString() === userId.toString() ? message.receiverId : message.senderId;
		const receiverSocketId = getReceiverSocketId(otherUserId);
		if (receiverSocketId) {
			io.to(receiverSocketId).emit("messageReactionRemoved", {
				messageId: message._id,
				reaction: removedReaction
			});
		}

		res.status(200).json({ 
			message: "Reaction removed successfully",
			reaction: removedReaction
		});
	} catch (error) {
		console.log("Error in removeReaction controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// Mark message as delivered
export const markMessageAsDelivered = async (req, res) => {
	try {
		const { messageId } = req.params;
		const userId = req.user._id;

		const message = await Message.findById(messageId);
		if (!message) {
			return res.status(404).json({ error: "Message not found" });
		}

		// Check if user is the receiver of this message
		if (message.receiverId.toString() !== userId.toString()) {
			return res.status(403).json({ error: "You can only mark messages sent to you as delivered" });
		}

		// Update message status to delivered
		if (message.status === "sent") {
			message.status = "delivered";
			message.deliveredAt = new Date();
			await message.save();

			// Emit socket event to sender
			const senderSocketId = getReceiverSocketId(message.senderId);
			if (senderSocketId) {
				io.to(senderSocketId).emit("messageDelivered", {
					messageId: message._id,
					deliveredAt: message.deliveredAt
				});
			}
		}

		res.status(200).json({ 
			message: "Message marked as delivered",
			status: message.status,
			deliveredAt: message.deliveredAt
		});
	} catch (error) {
		console.log("Error in markMessageAsDelivered controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
	try {
		const { messageId } = req.params;
		const userId = req.user._id;

		const message = await Message.findById(messageId);
		if (!message) {
			return res.status(404).json({ error: "Message not found" });
		}

		// Check if user is the receiver of this message
		if (message.receiverId.toString() !== userId.toString()) {
			return res.status(403).json({ error: "You can only mark messages sent to you as read" });
		}

		// Update message status to read
		if (message.status !== "read") {
			message.status = "read";
			message.readAt = new Date();
			await message.save();

			// Emit socket event to sender
			const senderSocketId = getReceiverSocketId(message.senderId);
			if (senderSocketId) {
				io.to(senderSocketId).emit("messageRead", {
					messageId: message._id,
					readAt: message.readAt
				});
			}
		}

		res.status(200).json({ 
			message: "Message marked as read",
			status: message.status,
			readAt: message.readAt
		});
	} catch (error) {
		console.log("Error in markMessageAsRead controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// Mark multiple messages as read
export const markMessagesAsRead = async (req, res) => {
	try {
		const { messageIds } = req.body;
		const userId = req.user._id;

		if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
			return res.status(400).json({ error: "Message IDs are required" });
		}

		const messages = await Message.find({ 
			_id: { $in: messageIds },
			receiverId: userId,
			status: { $ne: "read" }
		});

		const updatedMessages = [];
		const affectedSenders = new Set();

		for (const message of messages) {
			message.status = "read";
			message.readAt = new Date();
			await message.save();
			
			updatedMessages.push(message);
			affectedSenders.add(message.senderId.toString());
		}

		// Emit socket events to all affected senders
		affectedSenders.forEach(senderId => {
			const senderSocketId = getReceiverSocketId(senderId);
			if (senderSocketId) {
				io.to(senderSocketId).emit("messagesRead", {
					messageIds: messages.map(m => m._id),
					readAt: new Date()
				});
			}
		});

		res.status(200).json({ 
			message: `${updatedMessages.length} messages marked as read`,
			updatedCount: updatedMessages.length
		});
	} catch (error) {
		console.log("Error in markMessagesAsRead controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
}; 