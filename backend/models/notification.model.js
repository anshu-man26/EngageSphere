import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
	recipientId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	senderId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	lastNotificationSent: {
		type: Date,
		default: Date.now,
	},
	messageCount: {
		type: Number,
		default: 1,
	},
	conversationId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Conversation",
		required: true,
	},
}, { timestamps: true });

// Compound index to ensure one notification per recipient-sender pair
notificationSchema.index({ recipientId: 1, senderId: 1 }, { unique: true });

// Method to check if notification can be sent (1-hour cooldown)
notificationSchema.methods.canSendNotification = function() {
	const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
	return this.lastNotificationSent < oneHourAgo;
};

// Method to update notification
notificationSchema.methods.updateNotification = function() {
	this.lastNotificationSent = new Date();
	this.messageCount += 1;
	return this.save();
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification; 