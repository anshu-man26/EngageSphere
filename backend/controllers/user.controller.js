import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../config/cloudinary.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import createTransporter from "../config/nodemailer.js";

export const getUsersForSidebar = async (req, res) => {
	try {
		const loggedInUserId = req.user._id;

		// Get all users except the logged-in user
		const users = await User.find({ 
			_id: { $ne: loggedInUserId }
		}).select("-password");

		console.log(`Found ${users.length} users`);

		res.status(200).json(users);
	} catch (error) {
		console.error("Error in getUsersForSidebar: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getUserProfile = async (req, res) => {
	try {
		const { userId } = req.params;
		const loggedInUserId = req.user._id;

		// Get user profile (excluding password)
		const user = await User.findById(userId).select("-password");

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Don't allow viewing own profile through this endpoint (use regular profile for that)
		if (user._id.toString() === loggedInUserId.toString()) {
			return res.status(403).json({ error: "Use your own profile page to view your profile" });
		}

		res.status(200).json({
			user: {
				_id: user._id,
				fullName: user.fullName,
				username: user.username,
				profilePic: user.profilePic,
				bio: user.bio,
				createdAt: user.createdAt,
				defaultChatBackground: user.defaultChatBackground,
			}
		});
	} catch (error) {
		console.error("Error in getUserProfile: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getConversations = async (req, res) => {
	try {
		const loggedInUserId = req.user._id;
		console.log("Getting conversations for user:", loggedInUserId);

		// Get all conversations where the logged-in user is a participant
		const conversations = await Conversation.find({
			participants: loggedInUserId
		})
		.populate('participants', '-password')
		.populate('lastMessage')
		.populate({
			path: 'messages',
			match: { 
				receiverId: loggedInUserId,
				status: { $ne: 'read' },
				deletedFor: { $ne: loggedInUserId }
			}
		})
		.sort({ lastMessageTime: -1, createdAt: -1 }); // Sort by last message time, then creation time

		console.log("Found conversations:", conversations.length);
		conversations.forEach(conv => {
			console.log("Conversation participants:", conv.participants.map(p => ({ id: p._id, name: p.fullName })));
		});

		// Filter out conversations with less than 2 participants (invalid conversations)
		const validConversations = conversations.filter(conversation => {
			if (conversation.participants.length < 2) {
				console.log("Removing invalid conversation with less than 2 participants:", conversation._id);
				return false;
			}
			return true;
		});

		console.log("Valid conversations after filtering:", validConversations.length);

		// Format conversations to include unread counts and other user info
		const formattedConversations = validConversations
			.map(conversation => {
				console.log("Processing conversation:", conversation._id);
				console.log("All participants:", conversation.participants.map(p => ({ id: p._id, name: p.fullName })));
				
				// Get the other participant (not the logged-in user)
				const otherParticipant = conversation.participants.find(
					participant => participant._id.toString() !== loggedInUserId.toString()
				);

				console.log("Other participant found:", otherParticipant ? { id: otherParticipant._id, name: otherParticipant.fullName } : "None");

				// Skip conversations where we can't find another participant
				if (!otherParticipant) {
					console.log("Skipping conversation with no other participant:", conversation._id);
					return null;
				}

				// Calculate actual unread count based on messages that are not read
				// The messages array from the populate already filters for unread messages
				const actualUnreadCount = conversation.messages ? conversation.messages.length : 0;

				// Get last message info
				const lastMessage = conversation.lastMessage ? {
					message: conversation.lastMessage.message,
					createdAt: conversation.lastMessage.createdAt,
					senderId: conversation.lastMessage.senderId
				} : null;

				return {
					_id: conversation._id,
					participant: otherParticipant,
					unreadCount: actualUnreadCount,
					lastMessage,
					lastMessageTime: conversation.lastMessageTime,
					createdAt: conversation.createdAt,
					chatBackground: conversation.chatBackground || ""
				};
			})
			.filter(conversation => conversation !== null); // Remove null entries

		res.status(200).json(formattedConversations);
	} catch (error) {
		console.error("Error in getConversations: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const updateUserProfile = async (req, res) => {
	try {
		const { fullName, profilePic, bio } = req.body;
		const userId = req.user._id;

		// Validate input
		if (!fullName || fullName.trim().length < 2) {
			return res.status(400).json({ error: "Full name must be at least 2 characters long" });
		}

		// Validate bio length
		if (bio && bio.length > 150) {
			return res.status(400).json({ error: "Bio must be 150 characters or less" });
		}

		// Prepare update object
		const updateData = {
			fullName: fullName.trim(),
			profilePic: profilePic || "",
			bio: bio ? bio.trim() : "",
		};

		// Update user profile
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			updateData,
			{ new: true, runValidators: true }
		).select("-password");

		if (!updatedUser) {
			return res.status(404).json({ error: "User not found" });
		}

		res.status(200).json({
			message: "Profile updated successfully",
			user: {
				_id: updatedUser._id,
				fullName: updatedUser.fullName,
				email: updatedUser.email,
				username: updatedUser.username,
				profilePic: updatedUser.profilePic,
				bio: updatedUser.bio,
				defaultChatBackground: updatedUser.defaultChatBackground,
				soundSettings: updatedUser.soundSettings,
			},
		});
	} catch (error) {
		console.error("Error in updateUserProfile: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const uploadProfilePic = async (req, res) => {
	console.log("=== UPLOAD PROFILE PIC STARTED ===");
	console.log("Request user:", req.user ? req.user._id : "No user");
	console.log("Request file:", req.file ? "File present" : "No file");
	
	try {
		if (!req.file) {
			console.log("No file uploaded");
			return res.status(400).json({ error: "No file uploaded" });
		}

		const userId = req.user._id;
		console.log("User ID:", userId);

		// Check if Cloudinary credentials are configured
		console.log("Checking Cloudinary credentials...");
		console.log("CLOUDINARY_NAME:", process.env.CLOUDINARY_NAME ? `${process.env.CLOUDINARY_NAME.substring(0, 3)}...` : "Missing");
		console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? `${process.env.CLOUDINARY_API_KEY.substring(0, 5)}...` : "Missing");
		console.log("CLOUDINARY_SECRET_KEY:", process.env.CLOUDINARY_SECRET_KEY ? `${process.env.CLOUDINARY_SECRET_KEY.substring(0, 5)}...` : "Missing");
		
		if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_SECRET_KEY) {
			console.error("Cloudinary credentials not configured");
			return res.status(500).json({ error: "Cloudinary configuration missing. Please check your environment variables." });
		}

		console.log("File details:", {
			mimetype: req.file.mimetype,
			size: req.file.size,
			originalname: req.file.originalname
		});

		// Convert buffer to base64
		console.log("Converting file to base64...");
		const b64 = Buffer.from(req.file.buffer).toString('base64');
		const dataURI = `data:${req.file.mimetype};base64,${b64}`;
		console.log("Base64 conversion complete, length:", dataURI.length);

		console.log("Uploading to Cloudinary...");
		
		// Reconfigure Cloudinary to ensure credentials are loaded
		cloudinary.config({
			cloud_name: process.env.CLOUDINARY_NAME,
			api_key: process.env.CLOUDINARY_API_KEY,
			api_secret: process.env.CLOUDINARY_SECRET_KEY,
		});
		
		// Upload to Cloudinary
		const result = await cloudinary.uploader.upload(dataURI, {
			folder: 'chat-app-profiles',
			width: 400,
			height: 400,
			crop: 'fill',
			quality: 'auto',
			format: 'webp',
		});

		console.log("Cloudinary upload successful:", result.secure_url);

		// Update user's profile picture
		console.log("Updating user profile in database...");
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ profilePic: result.secure_url },
			{ new: true }
		).select("-password");

		if (!updatedUser) {
			console.log("User not found in database");
			return res.status(404).json({ error: "User not found" });
		}

		console.log("User profile updated successfully");
		res.status(200).json({
			message: "Profile picture uploaded successfully",
			profilePic: result.secure_url,
			user: {
				_id: updatedUser._id,
				fullName: updatedUser.fullName,
				email: updatedUser.email,
				username: updatedUser.username,
				profilePic: updatedUser.profilePic,
				defaultChatBackground: updatedUser.defaultChatBackground,
			},
		});
		console.log("=== UPLOAD PROFILE PIC COMPLETED SUCCESSFULLY ===");
	} catch (error) {
		console.error("=== UPLOAD PROFILE PIC ERROR ===");
		console.error("Error message:", error.message);
		console.error("Error stack:", error.stack);
		console.error("Error name:", error.name);
		
		// Provide more specific error messages
		if (error.message && error.message.includes('cloud_name')) {
			return res.status(500).json({ error: "Invalid Cloudinary cloud name" });
		}
		if (error.message && error.message.includes('api_key')) {
			return res.status(500).json({ error: "Invalid Cloudinary API key" });
		}
		if (error.message && error.message.includes('api_secret')) {
			return res.status(500).json({ error: "Invalid Cloudinary secret key" });
		}
		if (error.message && error.message.includes('Unauthorized')) {
			return res.status(500).json({ error: "Cloudinary authentication failed. Please check your credentials." });
		}
		if (error.message && error.message.includes('Network')) {
			return res.status(500).json({ error: "Network error connecting to Cloudinary" });
		}
		
		res.status(500).json({ error: "Internal server error during upload" });
	}
};

export const changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;
		const userId = req.user._id;

		if (!currentPassword || !newPassword) {
			return res.status(400).json({ error: "Current password and new password are required" });
		}

		// Validate new password
		if (newPassword.length < 6) {
			return res.status(400).json({ error: "New password must be at least 6 characters long" });
		}

		// Get user with password
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Verify current password
		const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
		if (!isPasswordValid) {
			return res.status(400).json({ error: "Current password is incorrect" });
		}

		// Hash new password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(newPassword, salt);

		// Update password
		user.password = hashedPassword;
		await user.save();

		res.status(200).json({ message: "Password changed successfully" });
	} catch (error) {
		console.error("Error in changePassword: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const changeEmail = async (req, res) => {
	try {
		const { newEmail, currentPassword } = req.body;
		const userId = req.user._id;

		if (!newEmail || !currentPassword) {
			return res.status(400).json({ error: "New email and current password are required" });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(newEmail)) {
			return res.status(400).json({ error: "Please enter a valid email address" });
		}

		// Check if email already exists
		const existingUser = await User.findOne({ email: newEmail });
		if (existingUser && existingUser._id.toString() !== userId.toString()) {
			return res.status(400).json({ error: "Email already in use" });
		}

		// Get user and check password
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
		if (!isPasswordValid) {
			return res.status(400).json({ error: "Current password is incorrect" });
		}

		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

		// Save OTP and newEmail to user
		user.otp = otp;
		user.otpExpires = otpExpires;
		user.tempNewEmail = newEmail;
		await user.save();

		// Send OTP to new email
		const transporter = createTransporter();
		if (!transporter) {
			return res.status(500).json({ error: "Email service not configured" });
		}

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: newEmail,
			subject: "EngageSphere Email Change OTP",
			html: `<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
				<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
					<h1 style='color: white; margin: 0; font-size: 28px;'>EngageSphere</h1>
					<p style='color: white; margin: 10px 0 0 0; opacity: 0.9;'>Email Change OTP</p>
				</div>
				<div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;'>
					<h2 style='color: #333; margin-bottom: 20px;'>Hello ${user.fullName},</h2>
					<p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
						You requested to change your EngageSphere account email. Use the following OTP to confirm your new email address:
					</p>
					<div style='text-align: center; margin: 30px 0;'>
						<div style='background: #667eea; color: white; padding: 20px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 5px; display: inline-block; min-width: 200px;'>
							${otp}
						</div>
					</div>
					<p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
						This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.
					</p>
					<p style='color: #999; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;'>
						For security reasons, never share this OTP with anyone.
					</p>
				</div>
			</div>`
		};
		
		try {
			await transporter.sendMail(mailOptions);
		} catch (emailError) {
			console.error("Email sending error:", emailError.message);
			
			// Clear the OTP and temp email on error
			user.otp = null;
			user.otpExpires = null;
			user.tempNewEmail = null;
			await user.save();
			
			// Provide specific error messages
			if (emailError.code === 'EAUTH') {
				return res.status(500).json({ 
					error: "Email authentication failed. Please check your email configuration." 
				});
			} else if (emailError.code === 'ECONNECTION') {
				return res.status(500).json({ 
					error: "Failed to connect to email service. Please try again." 
				});
			} else {
				return res.status(500).json({ 
					error: "Failed to send email. Please check your email configuration." 
				});
			}
		}

		res.status(200).json({ message: "OTP sent to new email. Please verify to complete the change." });
	} catch (error) {
		console.error("Error in changeEmail: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const verifyChangeEmailOtp = async (req, res) => {
	try {
		const { otp } = req.body;
		const userId = req.user._id;
		if (!otp) {
			return res.status(400).json({ error: "OTP is required" });
		}
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		if (!user.otp || !user.otpExpires || !user.tempNewEmail) {
			return res.status(400).json({ error: "No pending email change request" });
		}
		if (user.otp !== otp || user.otpExpires < Date.now()) {
			return res.status(400).json({ error: "Invalid or expired OTP" });
		}
		// Check if tempNewEmail is still unique
		const existingUser = await User.findOne({ email: user.tempNewEmail });
		if (existingUser && existingUser._id.toString() !== userId.toString()) {
			return res.status(400).json({ error: "Email already in use" });
		}
		user.email = user.tempNewEmail;
		user.tempNewEmail = null;
		user.otp = null;
		user.otpExpires = null;
		await user.save();
		res.status(200).json({ message: "Email changed successfully", email: user.email });
	} catch (error) {
		console.error("Error in verifyChangeEmailOtp: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const requestDeleteAccountOtp = async (req, res) => {
	try {
		const { password } = req.body;
		const userId = req.user._id;

		if (!password) {
			return res.status(400).json({ error: "Password is required" });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(400).json({ error: "Invalid password" });
		}

		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

		// Save OTP to user
		user.deleteAccountOtp = otp;
		user.deleteAccountOtpExpires = otpExpires;
		await user.save();

		// Send OTP email
		const transporter = createTransporter();
		if (transporter) {
			const mailOptions = {
				from: process.env.EMAIL_USER,
				to: user.email,
				subject: "Delete Account - EngageSphere",
				html: `<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
					<div style='background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
						<h1 style='color: white; margin: 0; font-size: 28px;'>EngageSphere</h1>
						<p style='color: white; margin: 10px 0 0 0; opacity: 0.9;'>Delete Account</p>
					</div>
					<div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;'>
						<h2 style='color: #333; margin-bottom: 20px;'>Hello ${user.fullName},</h2>
						<p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
							You have requested to delete your account. This action is irreversible and will permanently remove all your data.
						</p>
						<p style='color: #dc2626; font-weight: bold; margin-bottom: 20px;'>
							⚠️ WARNING: This action cannot be undone!
						</p>
						<p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
							Use the following OTP to confirm account deletion:
						</p>
						<div style='text-align: center; margin: 30px 0;'>
							<div style='background: #dc2626; color: white; padding: 20px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 5px; display: inline-block; min-width: 200px;'>
								${otp}
							</div>
						</div>
						<p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
							This OTP will expire in 10 minutes.
						</p>
						<p style='color: #999; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;'>
							If you did not request this action, please ignore this email and ensure your account is secure.
						</p>
					</div>
				</div>`
			};

			try {
				await transporter.sendMail(mailOptions);
			} catch (emailError) {
				console.error("Email sending error:", emailError.message);
				return res.status(500).json({ error: "Failed to send OTP email" });
			}
		}

		res.status(200).json({ message: "OTP sent to your email" });
	} catch (error) {
		console.error("Error in requestDeleteAccountOtp: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const uploadChatBackground = async (req, res) => {
	console.log("=== UPLOAD CHAT BACKGROUND STARTED ===");
	console.log("Request user:", req.user ? req.user._id : "No user");
	console.log("Request file:", req.file ? "File present" : "No file");
	
	try {
		if (!req.file) {
			console.log("No file uploaded");
			return res.status(400).json({ error: "No file uploaded" });
		}

		const userId = req.user._id;
		console.log("User ID:", userId);

		// Check if Cloudinary credentials are configured
		console.log("Checking Cloudinary credentials...");
		console.log("CLOUDINARY_NAME:", process.env.CLOUDINARY_NAME ? `${process.env.CLOUDINARY_NAME.substring(0, 3)}...` : "Missing");
		console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? `${process.env.CLOUDINARY_API_KEY.substring(0, 5)}...` : "Missing");
		console.log("CLOUDINARY_SECRET_KEY:", process.env.CLOUDINARY_SECRET_KEY ? `${process.env.CLOUDINARY_SECRET_KEY.substring(0, 5)}...` : "Missing");
		
		if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_SECRET_KEY) {
			console.error("Cloudinary credentials not configured");
			return res.status(500).json({ error: "Cloudinary configuration missing. Please check your environment variables." });
		}

		console.log("File details:", {
			mimetype: req.file.mimetype,
			size: req.file.size,
			originalname: req.file.originalname
		});

		// Convert buffer to base64
		console.log("Converting file to base64...");
		const b64 = Buffer.from(req.file.buffer).toString('base64');
		const dataURI = `data:${req.file.mimetype};base64,${b64}`;
		console.log("Base64 conversion complete, length:", dataURI.length);

		console.log("Uploading to Cloudinary...");
		
		// Reconfigure Cloudinary to ensure credentials are loaded
		cloudinary.config({
			cloud_name: process.env.CLOUDINARY_NAME,
			api_key: process.env.CLOUDINARY_API_KEY,
			api_secret: process.env.CLOUDINARY_SECRET_KEY,
		});
		
		// Upload to Cloudinary
		const result = await cloudinary.uploader.upload(dataURI, {
			folder: 'chat-app-backgrounds',
			width: 1920,
			height: 1080,
			crop: 'fill',
			quality: 'auto',
			format: 'webp',
		});

		console.log("Cloudinary upload successful:", result.secure_url);

		res.status(200).json({
			message: "Background image uploaded successfully",
			backgroundUrl: result.secure_url,
		});
		console.log("=== UPLOAD CHAT BACKGROUND COMPLETED SUCCESSFULLY ===");
	} catch (error) {
		console.error("=== UPLOAD CHAT BACKGROUND ERROR ===");
		console.error("Error message:", error.message);
		console.error("Error stack:", error.stack);
		console.error("Error name:", error.name);
		
		// Provide more specific error messages
		if (error.message && error.message.includes('cloud_name')) {
			return res.status(500).json({ error: "Invalid Cloudinary cloud name" });
		}
		if (error.message && error.message.includes('api_key')) {
			return res.status(500).json({ error: "Invalid Cloudinary API key" });
		}
		if (error.message && error.message.includes('api_secret')) {
			return res.status(500).json({ error: "Invalid Cloudinary secret key" });
		}
		if (error.message && error.message.includes('Unauthorized')) {
			return res.status(500).json({ error: "Cloudinary authentication failed. Please check your credentials." });
		}
		if (error.message && error.message.includes('Network')) {
			return res.status(500).json({ error: "Network error connecting to Cloudinary" });
		}
		
		res.status(500).json({ error: "Internal server error during upload" });
	}
};

export const updateChatBackground = async (req, res) => {
	try {
		const { conversationId, backgroundImage } = req.body;
		const userId = req.user._id;

		if (!conversationId) {
			return res.status(400).json({ error: "Conversation ID is required" });
		}

		// Use the already imported Conversation model

		// Find conversation and verify user is a participant
		const conversation = await Conversation.findById(conversationId);
		if (!conversation) {
			return res.status(404).json({ error: "Conversation not found" });
		}

		// Check if user is a participant in this conversation
		if (!conversation.participants.includes(userId)) {
			return res.status(403).json({ error: "You are not a participant in this conversation" });
		}

		// If conversation is changing from a Cloudinary image to something else, delete the old image
		if (conversation.chatBackground && 
			conversation.chatBackground.includes('cloudinary.com') && 
			backgroundImage !== conversation.chatBackground) {
			console.log("Deleting old conversation background image...");
			await deleteImageFromCloudinary(conversation.chatBackground);
		}

		// Update chat background
		conversation.chatBackground = backgroundImage || "";
		await conversation.save();

		res.status(200).json({
			message: "Chat background updated successfully",
			chatBackground: conversation.chatBackground,
		});
	} catch (error) {
		console.error("Error in updateChatBackground: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const deleteAccount = async (req, res) => {
	try {
		const { otp } = req.body;
		const userId = req.user._id;

		if (!otp) {
			return res.status(400).json({ error: "OTP is required" });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		if (!user.deleteAccountOtp || !user.deleteAccountOtpExpires) {
			return res.status(400).json({ error: "No delete account request found" });
		}

		if (user.deleteAccountOtp !== otp || user.deleteAccountOtpExpires < Date.now()) {
			return res.status(400).json({ error: "Invalid or expired OTP" });
		}

		// Clean up user's background images from Cloudinary before deleting account
		console.log("Cleaning up user background images...");
		await cleanupUserBackgroundImages(userId);

		// Delete user's conversations and messages
		// Delete conversations where user is a participant
		await Conversation.deleteMany({
			participants: userId
		});

		// Delete messages sent or received by user
		await Message.deleteMany({
			$or: [
				{ senderId: userId },
				{ receiverId: userId }
			]
		});

		// Delete the user
		await User.findByIdAndDelete(userId);

		// Also delete any temporary users with the same email (from email verification process)
		await User.deleteMany({ 
			email: user.email,
			verified: false 
		});

		// Clear the JWT cookie
		res.clearCookie("jwt", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 0
		});

		res.status(200).json({ 
			message: "Account deleted successfully"
		});
	} catch (error) {
		console.error("Error in deleteAccount: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const updateDefaultChatBackground = async (req, res) => {
	try {
		const userId = req.user._id;
		const { defaultChatBackground } = req.body;

		// Get current user to check if they have an old background image
		const currentUser = await User.findById(userId);
		if (!currentUser) {
			return res.status(404).json({ error: "User not found" });
		}

		// If user is changing from a Cloudinary image to something else, delete the old image
		if (currentUser.defaultChatBackground && 
			currentUser.defaultChatBackground.includes('cloudinary.com') && 
			defaultChatBackground !== currentUser.defaultChatBackground) {
			console.log("Deleting old default background image...");
			await deleteImageFromCloudinary(currentUser.defaultChatBackground);
		}

		const user = await User.findByIdAndUpdate(
			userId,
			{ defaultChatBackground: defaultChatBackground || "" },
			{ new: true }
		).select("-password");

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		res.status(200).json({
			message: "Default chat background updated successfully",
			defaultChatBackground: user.defaultChatBackground,
		});
	} catch (error) {
		console.error("Error in updateDefaultChatBackground: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const updateSoundSettings = async (req, res) => {
	try {
		const { soundSettings } = req.body;
		const userId = req.user._id;

		// Validate sound settings
		if (!soundSettings || typeof soundSettings !== 'object') {
			return res.status(400).json({ error: "Invalid sound settings" });
		}

		// Update only sound settings
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ soundSettings },
			{ new: true, runValidators: true }
		).select("-password");

		if (!updatedUser) {
			return res.status(404).json({ error: "User not found" });
		}

		res.status(200).json({
			message: "Sound settings updated successfully",
			user: {
				_id: updatedUser._id,
				fullName: updatedUser.fullName,
				email: updatedUser.email,
				username: updatedUser.username,
				profilePic: updatedUser.profilePic,
				bio: updatedUser.bio,
				defaultChatBackground: updatedUser.defaultChatBackground,
				soundSettings: updatedUser.soundSettings,
			},
		});
	} catch (error) {
		console.error("Error in updateSoundSettings: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// Helper function to delete image from Cloudinary
const deleteImageFromCloudinary = async (imageUrl) => {
	try {
		if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
			return false; // Not a Cloudinary URL
		}

		// Extract public ID from Cloudinary URL
		const urlParts = imageUrl.split('/');
		const uploadIndex = urlParts.findIndex(part => part === 'upload');
		if (uploadIndex === -1) return false;

		const publicIdParts = urlParts.slice(uploadIndex + 2); // Skip 'upload' and version
		const publicId = publicIdParts.join('/').split('.')[0]; // Remove file extension

		console.log('Deleting image from Cloudinary:', publicId);
		
		const result = await cloudinary.uploader.destroy(publicId);
		console.log('Cloudinary delete result:', result);
		
		return result.result === 'ok';
	} catch (error) {
		console.error('Error deleting image from Cloudinary:', error);
		return false;
	}
};

// Helper function to clean up user's background images
const cleanupUserBackgroundImages = async (userId) => {
	try {
		const user = await User.findById(userId);
		if (!user) return;

		// Delete default chat background if it exists
		if (user.defaultChatBackground && user.defaultChatBackground.includes('cloudinary.com')) {
			await deleteImageFromCloudinary(user.defaultChatBackground);
		}

		// Find all conversations where user is a participant and clean up their backgrounds
		const conversations = await Conversation.find({ participants: userId });
		
		for (const conversation of conversations) {
			if (conversation.chatBackground && conversation.chatBackground.includes('cloudinary.com')) {
				await deleteImageFromCloudinary(conversation.chatBackground);
			}
		}
	} catch (error) {
		console.error('Error cleaning up user background images:', error);
	}
};

export const getUserBackgroundImages = async (req, res) => {
	try {
		const userId = req.user._id;

		// Get user's default background
		const user = await User.findById(userId).select('defaultChatBackground');
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Get all conversations where user is a participant
		const conversations = await Conversation.find({ participants: userId })
			.select('chatBackground createdAt')
			.sort({ createdAt: -1 });

		// Collect all background images
		const backgroundImages = [];

		// Add default background if it's a Cloudinary image
		if (user.defaultChatBackground && user.defaultChatBackground.includes('cloudinary.com')) {
			backgroundImages.push({
				type: 'default',
				url: user.defaultChatBackground,
				conversationId: null,
				createdAt: null
			});
		}

		// Add conversation backgrounds
		conversations.forEach(conversation => {
			if (conversation.chatBackground && conversation.chatBackground.includes('cloudinary.com')) {
				backgroundImages.push({
					type: 'conversation',
					url: conversation.chatBackground,
					conversationId: conversation._id,
					createdAt: conversation.createdAt
				});
			}
		});

		res.status(200).json({
			backgroundImages,
			total: backgroundImages.length
		});
	} catch (error) {
		console.error("Error in getUserBackgroundImages: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const deleteBackgroundImage = async (req, res) => {
	try {
		const { imageUrl, conversationId } = req.body;
		const userId = req.user._id;

		if (!imageUrl) {
			return res.status(400).json({ error: "Image URL is required" });
		}

		// Verify the image belongs to the user
		if (conversationId) {
			// Delete conversation background
			const conversation = await Conversation.findOne({
				_id: conversationId,
				participants: userId,
				chatBackground: imageUrl
			});

			if (!conversation) {
				return res.status(404).json({ error: "Conversation background not found" });
			}

			// Delete from Cloudinary
			const deleted = await deleteImageFromCloudinary(imageUrl);
			if (deleted) {
				conversation.chatBackground = "";
				await conversation.save();
			}
		} else {
			// Delete default background
			const user = await User.findById(userId);
			if (!user || user.defaultChatBackground !== imageUrl) {
				return res.status(404).json({ error: "Default background not found" });
			}

			// Delete from Cloudinary
			const deleted = await deleteImageFromCloudinary(imageUrl);
			if (deleted) {
				user.defaultChatBackground = "";
				await user.save();
			}
		}

		res.status(200).json({
			message: "Background image deleted successfully"
		});
	} catch (error) {
		console.error("Error in deleteBackgroundImage: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const changeUsername = async (req, res) => {
	try {
		const { newUsername } = req.body;
		const userId = req.user._id;

		// Validate input
		if (!newUsername || newUsername.trim().length < 3) {
			return res.status(400).json({ error: "Username must be at least 3 characters long" });
		}

		if (newUsername.trim().length > 30) {
			return res.status(400).json({ error: "Username must be 30 characters or less" });
		}

		// Check if username contains only alphanumeric characters and underscores
		const usernameRegex = /^[a-zA-Z0-9_]+$/;
		if (!usernameRegex.test(newUsername.trim())) {
			return res.status(400).json({ error: "Username can only contain letters, numbers, and underscores" });
		}

		// Check if username already exists
		const existingUser = await User.findOne({ 
			username: newUsername.trim(),
			_id: { $ne: userId }
		});

		if (existingUser) {
			return res.status(400).json({ error: "Username already exists" });
		}

		// Update username
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ username: newUsername.trim() },
			{ new: true, runValidators: true }
		).select("-password");

		if (!updatedUser) {
			return res.status(404).json({ error: "User not found" });
		}

		res.status(200).json({
			message: "Username changed successfully",
			user: {
				_id: updatedUser._id,
				fullName: updatedUser.fullName,
				email: updatedUser.email,
				username: updatedUser.username,
				profilePic: updatedUser.profilePic,
				bio: updatedUser.bio,
				defaultChatBackground: updatedUser.defaultChatBackground,
				soundSettings: updatedUser.soundSettings,
			},
		});
	} catch (error) {
		console.error("Error in changeUsername: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
