import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		minlength: 3,
		maxlength: 30
	},
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true
	},
	password: {
		type: String,
		required: true,
		minlength: 6
	},
	role: {
		type: String,
		enum: ["super_admin", "admin", "moderator"],
		default: "admin"
	},
	isActive: {
		type: Boolean,
		default: true
	},
	lastLogin: {
		type: Date,
		default: Date.now
	},
	// Password reset OTP fields
	resetPasswordOtp: {
		type: String,
		default: null
	},
	resetPasswordOtpExpires: {
		type: Date,
		default: null
	},
	// Login OTP fields
	loginOtp: {
		type: String,
		default: null
	},
	loginOtpExpires: {
		type: Date,
		default: null
	},
	// Delete confirmation OTP fields
	deleteConfirmationOtp: {
		type: String,
		default: null
	},
	deleteConfirmationOtpExpires: {
		type: Date,
		default: null
	},
	pendingDeleteUserIds: {
		type: [String],
		default: null
	},
	permissions: {
		deleteAccounts: {
			type: Boolean,
			default: true
		},
		viewAllUsers: {
			type: Boolean,
			default: true
		},
		editAccounts: {
			type: Boolean,
			default: true
		},
		manageAdmins: {
			type: Boolean,
			default: false
		},
		viewAnalytics: {
			type: Boolean,
			default: true
		},
		sendNotifications: {
			type: Boolean,
			default: true
		}
	}
}, { timestamps: true });

// Hash password before saving
adminSchema.pre("save", async function(next) {
	if (!this.isModified("password")) return next();
	
	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
	return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if admin has permission
adminSchema.methods.hasPermission = function(permission) {
	return this.permissions[permission] === true;
};

const Admin = mongoose.model("Admin", adminSchema);

export default Admin; 