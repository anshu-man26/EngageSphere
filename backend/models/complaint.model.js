import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
	// User information (if logged in)
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		default: null
	},
	
	// Anonymous user information
	anonymousUser: {
		name: {
			type: String,
			trim: true,
			maxlength: 100
		},
		email: {
			type: String,
			trim: true,
			lowercase: true
		}
	},
	
	// Complaint details
	subject: {
		type: String,
		required: true,
		trim: true,
		maxlength: 200
	},
	
	message: {
		type: String,
		required: true,
		trim: true,
		maxlength: 2000
	},
	
	// Complaint metadata
	category: {
		type: String,
		enum: ["bug", "feature_request", "account_issue", "technical_support", "general", "other"],
		default: "general"
	},
	
	priority: {
		type: String,
		enum: ["low", "medium", "high", "urgent"],
		default: "medium"
	},
	
	status: {
		type: String,
		enum: ["pending", "in_progress", "resolved", "closed"],
		default: "pending"
	},
	
	// Admin response
	adminResponse: {
		message: {
			type: String,
			trim: true,
			maxlength: 2000
		},
		respondedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Admin"
		},
		respondedAt: {
			type: Date
		}
	},
	
	// System information
	userAgent: {
		type: String,
		trim: true
	},
	
	ipAddress: {
		type: String,
		trim: true
	},
	
	pageSubmitted: {
		type: String,
		trim: true
	}
	
}, { timestamps: true });

// Index for efficient queries
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ userId: 1, createdAt: -1 });
complaintSchema.index({ category: 1, status: 1 });

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint; 