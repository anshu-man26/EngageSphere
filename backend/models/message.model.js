import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
	{
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		receiverId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		message: {
			type: String,
			default: "",
		},
		messageType: {
			type: String,
			enum: ["text", "image", "document"],
			default: "text",
		},
		fileUrl: {
			type: String,
			default: "",
		},
		fileName: {
			type: String,
			default: "",
		},
		fileSize: {
			type: Number,
			default: 0,
		},
		deletedFor: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		}],
		deletedForEveryone: {
			type: Boolean,
			default: false,
		},
		reactions: [{
			userId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				required: true,
			},
			emoji: {
				type: String,
				required: true,
			},
			createdAt: {
				type: Date,
				default: Date.now,
			}
		}],
		// Message status (WhatsApp-like)
		status: {
			type: String,
			enum: ["sent", "delivered", "read"],
			default: "sent",
		},
		deliveredAt: {
			type: Date,
			default: null,
		},
		readAt: {
			type: Date,
			default: null,
		},
		// Profanity filter fields
		isFiltered: {
			type: Boolean,
			default: false,
		},
		filterReason: {
			type: String,
			default: null,
		},
		// createdAt, updatedAt
	},
	{ timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
