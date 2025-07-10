import mongoose from "mongoose";

const broadcastSchema = new mongoose.Schema({
	subject: {
		type: String,
		required: true,
		trim: true,
		maxlength: 100
	},
	message: {
		type: String,
		required: true,
		trim: true,
		maxlength: 2000
	},
	messageStyle: {
		type: String,
		enum: ["normal", "serious", "friendly", "urgent", "informative"],
		default: "normal"
	},
	recipients: {
		type: String,
		enum: ["all", "verified", "unverified", "selected"],
		required: true
	},
	selectedUserIds: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	}],
	sentBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Admin",
		required: true
	},
	sentCount: {
		type: Number,
		default: 0
	},
	totalUsers: {
		type: Number,
		default: 0
	},
	failedEmails: [{
		type: String
	}],
	status: {
		type: String,
		enum: ["pending", "sent", "failed", "partial"],
		default: "pending"
	}
}, { timestamps: true });

// Index for efficient queries
broadcastSchema.index({ createdAt: -1 });
broadcastSchema.index({ sentBy: 1, createdAt: -1 });

const Broadcast = mongoose.model("Broadcast", broadcastSchema);

export default Broadcast; 