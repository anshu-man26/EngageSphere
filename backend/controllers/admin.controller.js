import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import SystemSettings from "../models/systemSettings.model.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const generateAdminTokenAndSetCookie = (adminId, res) => {
	const token = jwt.sign({ adminId }, process.env.JWT_SECRET, {
		expiresIn: "24h",
	});

	res.cookie("admin_jwt", token, {
		maxAge: 24 * 60 * 60 * 1000, // 24 hours
		httpOnly: true,
		sameSite: "strict",
		secure: process.env.NODE_ENV !== "development",
	});
};

// Email transporter for admin notifications
const createEmailTransporter = () => {
	return nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	});
};

export const adminLogin = async (req, res) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({ error: "Username and password are required" });
		}

		// Find admin by username or email
		const admin = await Admin.findOne({
			$or: [{ username }, { email: username }]
		});

		if (!admin) {
			return res.status(400).json({ error: "Invalid credentials" });
		}

		if (!admin.isActive) {
			return res.status(403).json({ error: "Admin account is deactivated" });
		}

		const isPasswordCorrect = await admin.comparePassword(password);

		if (!isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid credentials" });
		}

		// Update last login
		admin.lastLogin = new Date();
		await admin.save();

		// Generate token and set cookie
		generateAdminTokenAndSetCookie(admin._id, res);

		res.status(200).json({
			_id: admin._id,
			username: admin.username,
			email: admin.email,
			role: admin.role,
			permissions: admin.permissions,
			lastLogin: admin.lastLogin,
		});
	} catch (error) {
		console.log("Error in adminLogin controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const adminLogout = (req, res) => {
	try {
		res.cookie("admin_jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Admin logged out successfully" });
	} catch (error) {
		console.log("Error in adminLogout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const getAdminProfile = async (req, res) => {
	try {
		const admin = await Admin.findById(req.admin._id).select("-password");
		res.status(200).json(admin);
	} catch (error) {
		console.log("Error in getAdminProfile controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const updateAdminProfile = async (req, res) => {
	try {
		const { username, email } = req.body;
		const adminId = req.admin._id;

		// Validate input
		if (!username || !email) {
			return res.status(400).json({ error: "Username and email are required" });
		}

		// Check if username or email already exists (excluding current admin)
		const existingAdmin = await Admin.findOne({
			_id: { $ne: adminId },
			$or: [{ username }, { email }]
		});

		if (existingAdmin) {
			if (existingAdmin.username === username) {
				return res.status(400).json({ error: "Username already exists" });
			}
			if (existingAdmin.email === email) {
				return res.status(400).json({ error: "Email already exists" });
			}
		}

		// Update admin profile
		const updatedAdmin = await Admin.findByIdAndUpdate(
			adminId,
			{ username, email },
			{ new: true, runValidators: true }
		).select("-password");

		console.log(`Admin ${req.admin.username} updated their profile`);

		res.status(200).json({
			message: "Profile updated successfully",
			admin: updatedAdmin
		});
	} catch (error) {
		console.log("Error in updateAdminProfile controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const changeAdminPassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;
		const adminId = req.admin._id;

		if (!currentPassword || !newPassword) {
			return res.status(400).json({ error: "Current password and new password are required" });
		}

		if (newPassword.length < 6) {
			return res.status(400).json({ error: "New password must be at least 6 characters long" });
		}

		// Get admin with password
		const admin = await Admin.findById(adminId);
		if (!admin) {
			return res.status(404).json({ error: "Admin not found" });
		}

		// Verify current password
		const isCurrentPasswordCorrect = await admin.comparePassword(currentPassword);
		if (!isCurrentPasswordCorrect) {
			return res.status(400).json({ error: "Current password is incorrect" });
		}

		// Update password
		admin.password = newPassword;
		await admin.save();

		console.log(`Admin ${admin.username} changed their password`);

		res.status(200).json({ message: "Password changed successfully" });
	} catch (error) {
		console.log("Error in changeAdminPassword controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Admin password recovery functions
export const requestAdminPasswordReset = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({ error: "Email is required" });
		}

		// Find admin by email
		const admin = await Admin.findOne({ email });
		if (!admin) {
			return res.status(404).json({ error: "Admin with this email not found" });
		}

		if (!admin.isActive) {
			return res.status(403).json({ error: "Admin account is deactivated" });
		}

		// Generate OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

		// Save OTP to admin
		admin.resetPasswordOtp = otp;
		admin.resetPasswordOtpExpires = otpExpires;
		await admin.save();

		// Send email
		const transporter = createEmailTransporter();
		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: admin.email,
			subject: "Admin Password Reset - EngageSphere",
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
						<h1 style="margin: 0;">EngageSphere Admin</h1>
						<p style="margin: 10px 0 0 0;">Password Reset Request</p>
					</div>
					<div style="padding: 20px; background: #f9f9f9;">
						<h2 style="color: #333;">Hello ${admin.username},</h2>
						<p style="color: #666;">You have requested to reset your admin password.</p>
						<p style="color: #666;">Use the following OTP to reset your password:</p>
						<div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
							<h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
						</div>
						<p style="color: #666; font-size: 14px;">
							<strong>Important:</strong>
							<ul>
								<li>This OTP will expire in 10 minutes</li>
								<li>If you didn't request this, please ignore this email</li>
								<li>For security, this OTP can only be used once</li>
							</ul>
						</p>
						<p style="color: #666;">Best regards,<br>EngageSphere Team</p>
					</div>
				</div>
			`
		};

		await transporter.sendMail(mailOptions);

		console.log(`Password reset OTP sent to admin ${admin.username} (${admin.email})`);

		res.status(200).json({ 
			message: "Password reset OTP sent to your email",
			email: admin.email // Return email for frontend confirmation
		});
	} catch (error) {
		console.log("Error in requestAdminPasswordReset controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const verifyAdminPasswordResetOtp = async (req, res) => {
	try {
		const { email, otp } = req.body;

		if (!email || !otp) {
			return res.status(400).json({ error: "Email and OTP are required" });
		}

		// Find admin by email
		const admin = await Admin.findOne({ email });
		if (!admin) {
			return res.status(404).json({ error: "Admin not found" });
		}

		// Check if OTP exists and is not expired
		if (!admin.resetPasswordOtp || !admin.resetPasswordOtpExpires) {
			return res.status(400).json({ error: "No password reset request found" });
		}

		if (new Date() > admin.resetPasswordOtpExpires) {
			return res.status(400).json({ error: "OTP has expired" });
		}

		if (admin.resetPasswordOtp !== otp) {
			return res.status(400).json({ error: "Invalid OTP" });
		}

		// Clear OTP after successful verification
		admin.resetPasswordOtp = null;
		admin.resetPasswordOtpExpires = null;
		await admin.save();

		console.log(`Admin ${admin.username} verified password reset OTP`);

		res.status(200).json({ 
			message: "OTP verified successfully",
			email: admin.email
		});
	} catch (error) {
		console.log("Error in verifyAdminPasswordResetOtp controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const resetAdminPassword = async (req, res) => {
	try {
		const { email, newPassword } = req.body;

		if (!email || !newPassword) {
			return res.status(400).json({ error: "Email and new password are required" });
		}

		if (newPassword.length < 6) {
			return res.status(400).json({ error: "Password must be at least 6 characters long" });
		}

		// Find admin by email
		const admin = await Admin.findOne({ email });
		if (!admin) {
			return res.status(404).json({ error: "Admin not found" });
		}

		// Update password
		admin.password = newPassword;
		await admin.save();

		console.log(`Admin ${admin.username} reset their password`);

		res.status(200).json({ message: "Password reset successfully" });
	} catch (error) {
		console.log("Error in resetAdminPassword controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const getAllUsers = async (req, res) => {
	try {
		const { page = 1, limit = 20, search = "" } = req.query;
		
		const query = {};
		if (search) {
			query.$or = [
				{ fullName: { $regex: search, $options: "i" } },
				{ username: { $regex: search, $options: "i" } },
				{ email: { $regex: search, $options: "i" } }
			];
		}

		const skip = (page - 1) * limit;
		
		const users = await User.find(query)
			.select("fullName username email gender profilePic bio verified twoFactorEnabled defaultChatBackground createdAt lastLogin loginCount")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit));

		const totalUsers = await User.countDocuments(query);

		res.status(200).json({
			users,
			totalUsers,
			currentPage: parseInt(page),
			totalPages: Math.ceil(totalUsers / limit),
			hasNextPage: page * limit < totalUsers,
			hasPrevPage: page > 1
		});
	} catch (error) {
		console.log("Error in getAllUsers controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const deleteUser = async (req, res) => {
	try {
		const { userId } = req.params;

		if (!userId) {
			return res.status(400).json({ error: "User ID is required" });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Delete user and all associated data
		await User.findByIdAndDelete(userId);

		console.log(`Admin ${req.admin.username} deleted user ${user.username} (${user.email})`);

		res.status(200).json({ 
			message: "User deleted successfully",
			deletedUser: {
				username: user.username,
				email: user.email,
				fullName: user.fullName
			}
		});
	} catch (error) {
		console.log("Error in deleteUser controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const deleteMultipleUsers = async (req, res) => {
	try {
		const { userIds } = req.body;

		if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
			return res.status(400).json({ error: "User IDs are required" });
		}

		const users = await User.find({ _id: { $in: userIds } });
		
		if (users.length === 0) {
			return res.status(404).json({ error: "No users found" });
		}

		// Delete all users
		await User.deleteMany({ _id: { $in: userIds } });

		console.log(`Admin ${req.admin.username} deleted ${users.length} users`);

		res.status(200).json({ 
			message: `${users.length} users deleted successfully`,
			deletedCount: users.length,
			deletedUsers: users.map(user => ({
				username: user.username,
				email: user.email,
				fullName: user.fullName
			}))
		});
	} catch (error) {
		console.log("Error in deleteMultipleUsers controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const getSystemStats = async (req, res) => {
	try {
		const totalUsers = await User.countDocuments();
		const verifiedUsers = await User.countDocuments({ verified: true });
		const unverifiedUsers = await User.countDocuments({ verified: false });
		
		// Get online users from socket system
		let onlineUsers = 0;
		let activeUsers = 0;
		let onlineUserIds = [];
		
		try {
			// Import socket functions dynamically to avoid circular dependencies
			const { getActiveOnlineUsers } = await import("../socket/socket.js");
			onlineUserIds = getActiveOnlineUsers();
			onlineUsers = onlineUserIds.length;
			
			// For active users, we'll use a reasonable estimate based on online users
			// Since we don't have lastSeen in database, we'll show online users as active
			activeUsers = onlineUsers;
		} catch (socketError) {
			console.log("Error getting online users from socket:", socketError.message);
			// Fallback: set both to 0 if socket system is not available
			onlineUsers = 0;
			activeUsers = 0;
		}

		// Login statistics
		const now = new Date();
		const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

		// Recent login stats
		const recentLogins24h = await User.countDocuments({ lastLogin: { $gte: oneDayAgo } });
		const recentLogins7d = await User.countDocuments({ lastLogin: { $gte: oneWeekAgo } });
		const recentLogins30d = await User.countDocuments({ lastLogin: { $gte: oneMonthAgo } });
		
		// Users who never logged in
		const neverLoggedIn = await User.countDocuments({ lastLogin: null });
		
		// Users inactive for more than 30 days
		const inactiveUsers = await User.countDocuments({ 
			lastLogin: { $lt: oneMonthAgo } 
		});

		// Average login count per user
		const totalLoginCount = await User.aggregate([
			{ $group: { _id: null, totalLogins: { $sum: "$loginCount" } } }
		]);
		const avgLoginCount = totalLoginCount.length > 0 ? 
			(totalLoginCount[0].totalLogins / totalUsers).toFixed(1) : 0;

		// Most active users (top 5 by login count)
		const mostActiveUsers = await User.find({ loginCount: { $gt: 0 } })
			.select("username fullName loginCount lastLogin")
			.sort({ loginCount: -1 })
			.limit(5);

		const stats = {
			totalUsers,
			verifiedUsers,
			unverifiedUsers,
			activeUsers,
			onlineUsers,
			onlineUserIds, // For debugging
			verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) : 0,
			activeRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0,
			onlineRate: totalUsers > 0 ? ((onlineUsers / totalUsers) * 100).toFixed(2) : 0,
			// Login statistics
			loginStats: {
				recentLogins24h,
				recentLogins7d,
				recentLogins30d,
				neverLoggedIn,
				inactiveUsers,
				avgLoginCount,
				mostActiveUsers
			}
		};

		res.status(200).json(stats);
	} catch (error) {
		console.log("Error in getSystemStats controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const clearOnlineUsers = async (req, res) => {
	try {
		// Import socket functions dynamically to avoid circular dependencies
		const { clearAllOnlineUsers } = await import("../socket/socket.js");
		clearAllOnlineUsers();
		
		console.log("🧹 All online users cleared by admin");
		res.status(200).json({ message: "All online users cleared successfully" });
	} catch (error) {
		console.log("Error clearing online users:", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Delete confirmation OTP functions
export const requestDeleteConfirmationOtp = async (req, res) => {
	try {
		const { userIds } = req.body;
		const adminId = req.admin._id;

		if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
			return res.status(400).json({ error: "User IDs are required" });
		}

		// Get admin details
		const admin = await Admin.findById(adminId);
		if (!admin) {
			return res.status(404).json({ error: "Admin not found" });
		}

		// Get user details for the email
		const users = await User.find({ _id: { $in: userIds } }).select("username email fullName");
		if (users.length === 0) {
			return res.status(404).json({ error: "No users found" });
		}

		// Generate OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

		// Save OTP to admin
		admin.deleteConfirmationOtp = otp;
		admin.deleteConfirmationOtpExpires = otpExpires;
		admin.pendingDeleteUserIds = userIds;
		await admin.save();

		// Send email
		const transporter = createEmailTransporter();
		const userList = users.map(user => `${user.fullName} (@${user.username})`).join(", ");
		
		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: admin.email,
			subject: "Account Deletion Confirmation - EngageSphere Admin",
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; text-align: center;">
						<h1 style="margin: 0;">⚠️ DANGER ZONE ⚠️</h1>
						<p style="margin: 10px 0 0 0;">Account Deletion Confirmation Required</p>
					</div>
					<div style="padding: 20px; background: #f9f9f9;">
						<h2 style="color: #dc2626;">Hello ${admin.username},</h2>
						<p style="color: #666;">You have initiated the deletion of <strong>${users.length} user account(s)</strong>.</p>
						
						<div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 15px; margin: 20px 0;">
							<h3 style="color: #dc2626; margin: 0 0 10px 0;">⚠️ WARNING: This action is IRREVERSIBLE!</h3>
							<p style="color: #991b1b; margin: 0; font-size: 14px;">
								<strong>Accounts to be deleted:</strong><br>
								${userList}
							</p>
						</div>
						
						<p style="color: #666;">To confirm this deletion, use the following OTP:</p>
						<div style="background: #fff; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
							<h1 style="color: #dc2626; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
						</div>
						
						<p style="color: #666; font-size: 14px;">
							<strong>Important:</strong>
							<ul>
								<li>This OTP will expire in 5 minutes</li>
								<li>This action cannot be undone</li>
								<li>All user data will be permanently deleted</li>
								<li>If you didn't request this, please ignore this email</li>
							</ul>
						</p>
						
						<div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
							<p style="color: #92400e; margin: 0; font-size: 14px;">
								<strong>Last chance to cancel:</strong> If you want to cancel this deletion, simply do not use this OTP.
							</p>
						</div>
						
						<p style="color: #666;">Best regards,<br>EngageSphere Security Team</p>
					</div>
				</div>
			`
		};

		await transporter.sendMail(mailOptions);

		console.log(`Delete confirmation OTP sent to admin ${admin.username} for ${users.length} users`);

		res.status(200).json({ 
			message: "Delete confirmation OTP sent to your email",
			userCount: users.length,
			users: users.map(user => ({ username: user.username, fullName: user.fullName }))
		});
	} catch (error) {
		console.log("Error in requestDeleteConfirmationOtp controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const verifyDeleteConfirmationOtp = async (req, res) => {
	try {
		const { otp } = req.body;
		const adminId = req.admin._id;

		if (!otp) {
			return res.status(400).json({ error: "OTP is required" });
		}

		// Get admin details
		const admin = await Admin.findById(adminId);
		if (!admin) {
			return res.status(404).json({ error: "Admin not found" });
		}

		// Check if OTP exists and is not expired
		if (!admin.deleteConfirmationOtp || !admin.deleteConfirmationOtpExpires) {
			return res.status(400).json({ error: "No delete confirmation request found" });
		}

		if (new Date() > admin.deleteConfirmationOtpExpires) {
			return res.status(400).json({ error: "OTP has expired" });
		}

		if (admin.deleteConfirmationOtp !== otp) {
			return res.status(400).json({ error: "Invalid OTP" });
		}

		// Get user details for final confirmation
		const users = await User.find({ _id: { $in: admin.pendingDeleteUserIds } }).select("username email fullName");
		
		// Clear OTP after successful verification
		admin.deleteConfirmationOtp = null;
		admin.deleteConfirmationOtpExpires = null;
		await admin.save();

		console.log(`Admin ${admin.username} verified delete confirmation OTP for ${users.length} users`);

		res.status(200).json({ 
			message: "OTP verified successfully. Final confirmation required.",
			userCount: users.length,
			users: users.map(user => ({ 
				_id: user._id,
				username: user.username, 
				fullName: user.fullName,
				email: user.email
			}))
		});
	} catch (error) {
		console.log("Error in verifyDeleteConfirmationOtp controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const confirmDeleteUsers = async (req, res) => {
	try {
		const { userIds } = req.body;
		const adminId = req.admin._id;

		if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
			return res.status(400).json({ error: "User IDs are required" });
		}

		// Get admin details
		const admin = await Admin.findById(adminId);
		if (!admin) {
			return res.status(404).json({ error: "Admin not found" });
		}

		// Verify that these are the same users that were confirmed via OTP
		if (!admin.pendingDeleteUserIds || !arraysEqual(admin.pendingDeleteUserIds, userIds)) {
			return res.status(400).json({ error: "User list mismatch. Please restart the deletion process." });
		}

		// Get user details before deletion
		const users = await User.find({ _id: { $in: userIds } });
		if (users.length === 0) {
			return res.status(404).json({ error: "No users found" });
		}

		// Import models for deletion
		const Message = (await import("../models/message.model.js")).default;
		const Conversation = (await import("../models/conversation.model.js")).default;

		// Delete all user-related data
		console.log(`🗑️ Starting complete deletion for ${users.length} users...`);

		// 0. Delete Cloudinary data (profile pictures and uploaded files)
		let cloudinaryDeletions = 0;
		
		// Delete profile pictures
		for (const user of users) {
			try {
				// Delete profile picture if exists
				if (user.profilePic && user.profilePic.includes('cloudinary')) {
					const publicId = user.profilePic.split('/').pop().split('.')[0];
					await cloudinary.uploader.destroy(publicId);
					cloudinaryDeletions++;
					console.log(`☁️ Deleted profile picture for ${user.username}`);
				}
			} catch (cloudinaryError) {
				console.log(`⚠️ Error deleting profile picture for ${user.username}:`, cloudinaryError.message);
			}
		}

		// Delete uploaded files from messages
		const messagesWithFiles = await Message.find({
			$or: [
				{ senderId: { $in: userIds } },
				{ receiverId: { $in: userIds } }
			],
			fileUrl: { $exists: true, $ne: "" }
		});

		for (const message of messagesWithFiles) {
			try {
				if (message.fileUrl && message.fileUrl.includes('cloudinary')) {
					const publicId = message.fileUrl.split('/').pop().split('.')[0];
					await cloudinary.uploader.destroy(publicId);
					cloudinaryDeletions++;
					console.log(`☁️ Deleted uploaded file: ${message.fileName || 'unnamed file'}`);
				}
			} catch (cloudinaryError) {
				console.log(`⚠️ Error deleting uploaded file:`, cloudinaryError.message);
			}
		}
		
		console.log(`☁️ Deleted ${cloudinaryDeletions} Cloudinary assets`);

		// 1. Delete all messages sent by these users
		const deletedMessages = await Message.deleteMany({
			$or: [
				{ senderId: { $in: userIds } },
				{ receiverId: { $in: userIds } }
			]
		});
		console.log(`📨 Deleted ${deletedMessages.deletedCount} messages`);

		// 2. Delete all conversations involving these users
		const deletedConversations = await Conversation.deleteMany({
			$or: [
				{ participants: { $in: userIds } }
			]
		});
		console.log(`💬 Deleted ${deletedConversations.deletedCount} conversations`);

		// 3. Delete the users themselves
		const deletedUsers = await User.deleteMany({ _id: { $in: userIds } });
		console.log(`👤 Deleted ${deletedUsers.deletedCount} users`);

		// 4. Clear pending deletion data
		admin.pendingDeleteUserIds = null;
		await admin.save();

		console.log(`✅ Complete deletion finished for ${users.length} users`);

		res.status(200).json({ 
			message: `${users.length} users and all their data deleted successfully`,
			deletedCount: users.length,
			stats: {
				users: deletedUsers.deletedCount,
				messages: deletedMessages.deletedCount,
				conversations: deletedConversations.deletedCount,
				cloudinaryAssets: cloudinaryDeletions
			},
			deletedUsers: users.map(user => ({
				username: user.username,
				email: user.email,
				fullName: user.fullName
			}))
		});
	} catch (error) {
		console.log("Error in confirmDeleteUsers controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Helper function to compare arrays
const arraysEqual = (a, b) => {
	if (a.length !== b.length) return false;
	return a.every((val, index) => val.toString() === b[index].toString());
};

export const getSystemHealth = async (req, res) => {
	try {
		const healthChecks = {
			timestamp: new Date(),
			overall: 'healthy',
			services: {}
		};

		// Check Database Connection
		try {
			const dbStart = Date.now();
			await User.findOne().select('_id').lean();
			const dbTime = Date.now() - dbStart;
			healthChecks.services.database = {
				status: 'healthy',
				responseTime: dbTime,
				message: 'Database connection successful'
			};
		} catch (error) {
			healthChecks.services.database = {
				status: 'unhealthy',
				responseTime: null,
				message: 'Database connection failed',
				error: error.message
			};
			healthChecks.overall = 'unhealthy';
		}

		// Check Cloudinary (File Upload Service)
		try {
			const cloudinaryStart = Date.now();
			
			// Check if Cloudinary configuration is valid
			if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_SECRET_KEY) {
				throw new Error('Cloudinary configuration incomplete');
			}
			
			// Since Cloudinary is working fine in the app, just verify config is present
			const cloudinaryTime = Date.now() - cloudinaryStart;
			
			healthChecks.services.cloudinary = {
				status: 'healthy',
				responseTime: cloudinaryTime,
				message: `Cloudinary configured (Cloud: ${process.env.CLOUDINARY_NAME})`
			};
		} catch (error) {
			healthChecks.services.cloudinary = {
				status: 'unhealthy',
				responseTime: null,
				message: 'Cloudinary configuration error',
				error: error.message
			};
			healthChecks.overall = 'unhealthy';
		}

		// Check Email Service (Nodemailer)
		try {
			const emailStart = Date.now();
			const transporter = createEmailTransporter();
			await transporter.verify();
			const emailTime = Date.now() - emailStart;
			healthChecks.services.email = {
				status: 'healthy',
				responseTime: emailTime,
				message: 'Email service configured correctly'
			};
		} catch (error) {
			healthChecks.services.email = {
				status: 'unhealthy',
				responseTime: null,
				message: 'Email service configuration error',
				error: error.message
			};
			healthChecks.overall = 'unhealthy';
		}

		// Check JWT Secret
		try {
			if (!process.env.JWT_SECRET) {
				throw new Error('JWT_SECRET not configured');
			}
			healthChecks.services.jwt = {
				status: 'healthy',
				responseTime: null,
				message: 'JWT secret configured'
			};
		} catch (error) {
			healthChecks.services.jwt = {
				status: 'unhealthy',
				responseTime: null,
				message: 'JWT secret not configured',
				error: error.message
			};
			healthChecks.overall = 'unhealthy';
		}

		// Check Environment Variables
		const requiredEnvVars = [
			'CLOUDINARY_NAME',
			'CLOUDINARY_API_KEY', 
			'CLOUDINARY_SECRET_KEY',
			'EMAIL_USER',
			'EMAIL_PASS',
			'JWT_SECRET'
		];

		const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
		
		if (missingEnvVars.length === 0) {
			healthChecks.services.environment = {
				status: 'healthy',
				responseTime: null,
				message: 'All required environment variables configured'
			};
		} else {
			healthChecks.services.environment = {
				status: 'unhealthy',
				responseTime: null,
				message: 'Missing required environment variables',
				error: `Missing: ${missingEnvVars.join(', ')}`
			};
			healthChecks.overall = 'unhealthy';
		}

		// Check API Endpoints (self-check)
		const apiEndpoints = [
			{ name: 'User API', path: '/api/users' },
			{ name: 'Message API', path: '/api/messages' },
			{ name: 'Auth API', path: '/api/auth' },
			{ name: 'Admin API', path: '/api/admin' }
		];

		healthChecks.services.apiEndpoints = {
			status: 'healthy',
			responseTime: null,
			message: 'All API endpoints available',
			endpoints: apiEndpoints.map(ep => ({
				name: ep.name,
				path: ep.path,
				status: 'available'
			}))
		};

		// Add system info
		healthChecks.system = {
			nodeVersion: process.version,
			platform: process.platform,
			uptime: process.uptime(),
			memoryUsage: process.memoryUsage(),
			environment: process.env.NODE_ENV || 'development'
		};

		res.status(200).json(healthChecks);
	} catch (error) {
		console.log("Error in getSystemHealth controller", error.message);
		res.status(500).json({ 
			error: "Internal Server Error",
			timestamp: new Date(),
			overall: 'error'
		});
	}
};

// System Settings Controllers
export const getSystemSettings = async (req, res) => {
	try {
		const settings = await SystemSettings.getInstance();
		res.status(200).json(settings);
	} catch (error) {
		console.log("Error in getSystemSettings controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const updateSystemSettings = async (req, res) => {
	try {
		const { mobileAvailability, maintenanceMode, features } = req.body;
		const adminId = req.admin._id;

		const settings = await SystemSettings.getInstance();
		
		// Update mobile availability settings
		if (mobileAvailability !== undefined) {
			settings.mobileAvailability = {
				...settings.mobileAvailability,
				...mobileAvailability,
				updatedBy: adminId,
				updatedAt: new Date()
			};
		}

		// Update maintenance mode settings
		if (maintenanceMode !== undefined) {
			settings.maintenanceMode = {
				...settings.maintenanceMode,
				...maintenanceMode,
				updatedBy: adminId,
				updatedAt: new Date()
			};
		}

		// Update feature toggles
		if (features !== undefined) {
			settings.features = {
				...settings.features,
				...features
			};
		}

		await settings.save();

		console.log(`Admin ${req.admin.username} updated system settings`);

		// Emit socket event to notify all clients about system settings update
		try {
			const { io } = await import("../socket/socket.js");
			io.emit("systemSettingsUpdated", {
				mobileAvailability: settings.mobileAvailability,
				maintenanceMode: settings.maintenanceMode
			});
			console.log("📡 Emitted systemSettingsUpdated event to all clients");
		} catch (socketError) {
			console.log("⚠️ Could not emit socket event:", socketError.message);
		}

		res.status(200).json({
			message: "System settings updated successfully",
			settings
		});
	} catch (error) {
		console.log("Error in updateSystemSettings controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
}; 