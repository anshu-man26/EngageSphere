import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import createTransporter from "../config/nodemailer.js";

const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "15d",
	});

	res.cookie("jwt", token, {
		maxAge: 15 * 24 * 60 * 60 * 1000, // MS
		httpOnly: true, // prevent XSS attacks cross-site scripting attacks
		sameSite: "strict", // CSRF attacks cross-site request forgery attacks
		secure: process.env.NODE_ENV !== "development",
	});
};

export const signup = async (req, res) => {
	try {
		const { fullName, email, password, confirmPassword, gender } = req.body;

		if (password !== confirmPassword) {
			return res.status(400).json({ error: "Passwords don't match" });
		}

		// Check if email already exists (only verified users)
		const existingUser = await User.findOne({ email, verified: true });
		if (existingUser) {
			return res.status(400).json({ error: "Email already exists" });
		}

		// Check if email is verified (look for temporary user without OTP - meaning it was verified)
		const tempUser = await User.findOne({ 
			email, 
			verified: false,
			otp: null,
			otpExpires: null
		});

		if (!tempUser) {
			return res.status(400).json({ error: "Please verify your email address first" });
		}

		// HASH PASSWORD HERE
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Generate username from email (optional)
		const username = email.split('@')[0];

		// https://avatar-placeholder.iran.liara.run/
		const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
		const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

		// Update the temporary user with real data
		tempUser.fullName = fullName;
		tempUser.password = hashedPassword;
		tempUser.gender = gender;
		tempUser.username = username;
		tempUser.profilePic = gender === "male" ? boyProfilePic : girlProfilePic;
		tempUser.verified = true;
		tempUser.twoFactorEnabled = false;
		tempUser.otp = null;
		tempUser.otpExpires = null;

		await tempUser.save();

		// Generate JWT token and set cookie
		generateTokenAndSetCookie(tempUser._id, res);

		res.status(201).json({
			_id: tempUser._id,
			fullName: tempUser.fullName,
			email: tempUser.email,
			username: tempUser.username,
			gender: tempUser.gender,
			profilePic: tempUser.profilePic,
			verified: tempUser.verified,
			twoFactorEnabled: tempUser.twoFactorEnabled,
			defaultChatBackground: tempUser.defaultChatBackground || "",
		});
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const login = async (req, res) => {
	try {
		const { email, password, otp } = req.body;
		const user = await User.findOne({ email });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid email or password" });
		}

		// Check if user is verified
		if (!user.verified) {
			return res.status(400).json({ 
				error: "Please verify your email before logging in",
				needsVerification: true,
				email: user.email
			});
		}

		// Check if 2FA is enabled
		if (user.twoFactorEnabled) {
			// If OTP is not provided, send OTP and ask for it
			if (!otp) {
				// Generate 6-digit OTP
				const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
				const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

				// Save OTP to user
				user.otp = otpCode;
				user.otpExpires = otpExpires;
				await user.save();

				// Send OTP email
				const transporter = createTransporter();
				if (transporter) {
					const mailOptions = {
						from: process.env.EMAIL_USER,
						to: email,
						subject: "Login OTP - EngageSphere",
						html: `<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
							<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
								<h1 style='color: white; margin: 0; font-size: 28px;'>EngageSphere</h1>
								<p style='color: white; margin: 10px 0 0 0; opacity: 0.9;'>Login OTP</p>
							</div>
							<div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;'>
								<h2 style='color: #333; margin-bottom: 20px;'>Hello ${user.fullName},</h2>
								<p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
									You have 2FA enabled. Use the following OTP to complete your login:
								</p>
								<div style='text-align: center; margin: 30px 0;'>
									<div style='background: #667eea; color: white; padding: 20px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 5px; display: inline-block; min-width: 200px;'>
										${otpCode}
									</div>
								</div>
								<p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
									This OTP will expire in 10 minutes.
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
					}
				}

				return res.status(200).json({ 
					message: "OTP sent to your email",
					needsOTP: true,
					email: user.email
				});
			}

			// Verify OTP
			if (!user.otp || !user.otpExpires || user.otp !== otp || user.otpExpires < Date.now()) {
				return res.status(400).json({ error: "Invalid or expired OTP" });
			}

			// Clear OTP after successful verification
			user.otp = null;
			user.otpExpires = null;
			await user.save();
		}

		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			email: user.email,
			username: user.username,
			gender: user.gender,
			profilePic: user.profilePic,
			verified: user.verified,
			twoFactorEnabled: user.twoFactorEnabled,
			defaultChatBackground: user.defaultChatBackground || "",
		});
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const logout = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const sendSignupOtp = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({ error: "Email is required" });
		}

		// Check if email already exists (only verified users)
		const existingUser = await User.findOne({ email, verified: true });
		if (existingUser) {
			return res.status(400).json({ error: "Email already exists" });
		}

		// Clean up any existing temporary users with this email
		await User.deleteMany({ email, verified: false });

		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

		// Create transporter
		const transporter = createTransporter();
		if (!transporter) {
			return res.status(500).json({ error: "Email service not configured" });
		}

		// Email content
		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: email,
			subject: "Email Verification - EngageSphere",
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
						<h1 style="color: white; margin: 0; font-size: 28px;">EngageSphere</h1>
						<p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Email Verification</p>
					</div>
					<div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
						<h2 style="color: #333; margin-bottom: 20px;">Hello there!</h2>
						<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
							You're signing up for EngageSphere. Use the following OTP to verify your email address:
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<div style="background: #667eea; color: white; padding: 20px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 5px; display: inline-block; min-width: 200px;">
								${otp}
							</div>
						</div>
						<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
							This OTP will expire in 10 minutes. If you didn't request this verification, please ignore this email.
						</p>
						<p style="color: #999; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
							For security reasons, never share this OTP with anyone.
						</p>
					</div>
				</div>
			`,
		};

		// Send email
		await transporter.sendMail(mailOptions);

		// Store OTP in session or temporary storage (for demo, we'll store it in a temporary user)
		// In production, you might want to use Redis or a similar solution
		const tempUser = new User({
			email,
			otp,
			otpExpires,
			verified: false,
			// Set temporary values for required fields
			fullName: "Temporary",
			password: "temporary",
			gender: "male"
		});
		await tempUser.save();

		res.status(200).json({ 
			message: "OTP sent successfully",
			email: email
		});
	} catch (error) {
		console.error("Error in sendSignupOtp: ", error.message);
		res.status(500).json({ error: "Failed to send OTP. Please try again." });
	}
};

export const sendOTP = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({ error: "Email is required" });
		}

		const user = await User.findOne({ email });

		if (!user) {
			return res.status(404).json({ error: "User with this email not found" });
		}

		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		
		// Set OTP expiry (10 minutes)
		const otpExpires = Date.now() + 600000; // 10 minutes

		// Save OTP to user
		user.otp = otp;
		user.otpExpires = otpExpires;
		await user.save();

		// Create transporter
		const transporter = createTransporter();
		if (!transporter) {
			return res.status(500).json({ error: "Email service not configured" });
		}

		// Email content
		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: email,
			subject: "Password Reset OTP - EngageSphere",
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
						<h1 style="color: white; margin: 0; font-size: 28px;">EngageSphere</h1>
						<p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset OTP</p>
					</div>
					<div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
						<h2 style="color: #333; margin-bottom: 20px;">Hello ${user.fullName},</h2>
						<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
							You requested a password reset for your EngageSphere account. Use the following OTP to reset your password:
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<div style="background: #667eea; color: white; padding: 20px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 5px; display: inline-block; min-width: 200px;">
								${otp}
							</div>
						</div>
						<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
							This OTP will expire in 10 minutes. If you didn't request this password reset, please ignore this email.
						</p>
						<p style="color: #999; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
							For security reasons, never share this OTP with anyone.
						</p>
					</div>
				</div>
			`,
		};

		// Send email
		await transporter.sendMail(mailOptions);

		res.status(200).json({ 
			message: "OTP sent successfully",
			email: email // For testing purposes, remove in production
		});
	} catch (error) {
		console.error("Error in sendOTP: ", error.message);
		
		// Clear OTP on error
		if (error.code !== "EAUTH") {
			const user = await User.findOne({ email: req.body.email });
			if (user) {
				user.otp = null;
				user.otpExpires = null;
				await user.save();
			}
		}
		
		res.status(500).json({ error: "Failed to send OTP. Please try again." });
	}
};

export const verifySignupOTP = async (req, res) => {
	try {
		const { email, otp } = req.body;

		if (!email || !otp) {
			return res.status(400).json({ error: "Email and OTP are required" });
		}

		// Find temporary user (unverified user with OTP)
		const tempUser = await User.findOne({ 
			email, 
			verified: false,
			otp: { $exists: true, $ne: null }
		});

		if (!tempUser) {
			return res.status(404).json({ error: "No verification request found for this email" });
		}

		if (!tempUser.otp || !tempUser.otpExpires) {
			return res.status(400).json({ error: "No OTP found for this email" });
		}

		if (tempUser.otp !== otp) {
			return res.status(400).json({ error: "Invalid OTP" });
		}

		if (tempUser.otpExpires < Date.now()) {
			return res.status(400).json({ error: "OTP has expired" });
		}

		// Mark email as verified (but keep user as temporary until signup is completed)
		tempUser.otp = null;
		tempUser.otpExpires = null;
		await tempUser.save();

		res.status(200).json({
			message: "Email verified successfully"
		});
	} catch (error) {
		console.error("Error in verifySignupOTP: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const enable2FA = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

		// Save OTP to user
		user.otp = otp;
		user.otpExpires = otpExpires;
		await user.save();

		// Send OTP email
		const transporter = createTransporter();
		if (transporter) {
			const mailOptions = {
				from: process.env.EMAIL_USER,
				to: user.email,
				subject: "Enable 2FA - EngageSphere",
				html: `<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
					<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
						<h1 style='color: white; margin: 0; font-size: 28px;'>EngageSphere</h1>
						<p style='color: white; margin: 10px 0 0 0; opacity: 0.9;'>Enable 2FA</p>
					</div>
					<div style='background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;'>
						<h2 style='color: #333; margin-bottom: 20px;'>Hello ${user.fullName},</h2>
						<p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
							You're enabling 2FA for your account. Use the following OTP to confirm:
						</p>
						<div style='text-align: center; margin: 30px 0;'>
							<div style='background: #667eea; color: white; padding: 20px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 5px; display: inline-block; min-width: 200px;'>
								${otp}
							</div>
						</div>
						<p style='color: #666; line-height: 1.6; margin-bottom: 20px;'>
							This OTP will expire in 10 minutes.
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
				return res.status(500).json({ error: "Failed to send OTP email" });
			}
		}

		res.status(200).json({ message: "OTP sent to your email" });
	} catch (error) {
		console.error("Error in enable2FA: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const verifyEnable2FA = async (req, res) => {
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

		if (!user.otp || !user.otpExpires) {
			return res.status(400).json({ error: "No OTP found" });
		}

		if (user.otp !== otp || user.otpExpires < Date.now()) {
			return res.status(400).json({ error: "Invalid or expired OTP" });
		}

		// Enable 2FA
		user.twoFactorEnabled = true;
		user.otp = null;
		user.otpExpires = null;
		await user.save();

		res.status(200).json({ 
			message: "2FA enabled successfully",
			twoFactorEnabled: true
		});
	} catch (error) {
		console.error("Error in verifyEnable2FA: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const disable2FA = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Disable 2FA
		user.twoFactorEnabled = false;
		await user.save();

		res.status(200).json({ 
			message: "2FA disabled successfully",
			twoFactorEnabled: false
		});
	} catch (error) {
		console.error("Error in disable2FA: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const verifyOTP = async (req, res) => {
	try {
		const { email, otp } = req.body;

		if (!email || !otp) {
			return res.status(400).json({ error: "Email and OTP are required" });
		}

		// Find user with valid OTP
		const user = await User.findOne({
			email,
			otp,
			otpExpires: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({ error: "Invalid or expired OTP" });
		}

		// Clear OTP after successful verification
		user.otp = null;
		user.otpExpires = null;
		await user.save();

		res.status(200).json({ 
			message: "OTP verified successfully",
			email: email
		});
	} catch (error) {
		console.error("Error in verifyOTP: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const resetPassword = async (req, res) => {
	try {
		const { email, newPassword } = req.body;

		if (!email || !newPassword) {
			return res.status(400).json({ error: "Email and new password are required" });
		}

		// Find user
		const user = await User.findOne({ email });

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Validate new password
		if (newPassword.length < 6) {
			return res.status(400).json({ error: "Password must be at least 6 characters long" });
		}

		// Hash new password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(newPassword, salt);

		// Update password
		user.password = hashedPassword;
		await user.save();

		res.status(200).json({ message: "Password reset successfully" });
	} catch (error) {
		console.error("Error in resetPassword: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
