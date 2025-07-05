import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		fullName: {
			type: String,
			required: true,
		},
		username: {
			type: String,
			required: false,
			unique: true,
			sparse: true, // Allows multiple null values
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
		},
		gender: {
			type: String,
			required: true,
			enum: ["male", "female"],
		},
		profilePic: {
			type: String,
			default: "",
		},
		bio: {
			type: String,
			maxlength: 150,
			default: "",
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		// Password reset fields
		resetPasswordToken: {
			type: String,
			default: null,
		},
		resetPasswordExpires: {
			type: Date,
			default: null,
		},
		// OTP fields
		otp: {
			type: String,
			default: null,
		},
		otpExpires: {
			type: Date,
			default: null,
		},
		// Temp new email for OTP verification
		tempNewEmail: {
			type: String,
			default: null,
		},
		// Email verification
		verified: {
			type: Boolean,
			default: false,
		},
		// Two-factor authentication
		twoFactorEnabled: {
			type: Boolean,
			default: false,
		},
		// Default chat background
		defaultChatBackground: {
			type: String,
			default: "",
		},
		// Delete account OTP fields
		deleteAccountOtp: {
			type: String,
			default: null,
		},
		deleteAccountOtpExpires: {
			type: Date,
			default: null,
		},
		// createdAt, updatedAt => Member since <createdAt>
	},
	{ timestamps: true }
);



const User = mongoose.model("User", userSchema);

export default User;
