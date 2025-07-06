import createTransporter from "../config/nodemailer.js";

class WelcomeEmailService {
	/**
	 * Send welcome email to new user
	 * @param {Object} user - User object with email, fullName, username
	 */
	async sendWelcomeEmail(user) {
		try {
			console.log("📧 Starting welcome email process...");
			console.log("User:", user.fullName, "Email:", user.email);

			const transporter = createTransporter();
			if (!transporter) {
				console.error("❌ Email transporter not configured");
				return false;
			}

			console.log("✅ Email transporter created successfully");

			const appUrl = process.env.CLIENT_URL || "https://engagesphere-mrjv.onrender.com";

			const mailOptions = {
				from: process.env.EMAIL_USER,
				to: user.email,
				subject: "Welcome to EngageSphere! 🎉",
				html: `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
						<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
							<h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to EngageSphere!</h1>
							<p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your journey begins here</p>
						</div>
						
						<div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
							<h2 style="color: #333; margin-bottom: 20px;">Hello ${user.fullName}! 👋</h2>
							
							<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
								Welcome to <strong>EngageSphere</strong>! I'm thrilled to have you join our community. 
								As a small developer, I've poured my heart into creating this platform to help people 
								connect, communicate, and build meaningful relationships.
							</p>
							
							<div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
								<h3 style="color: #1976d2; margin-top: 0;">What you can do with EngageSphere:</h3>
								<ul style="color: #424242; line-height: 1.8; margin: 10px 0;">
									<li>💬 Send real-time messages with friends</li>
									<li>📱 Enjoy a responsive design that works on all devices</li>
									<li>🎨 Customize your chat backgrounds</li>
									<li>🔔 Get notified when you're offline</li>
									<li>📞 Make video calls (when enabled)</li>
									<li>🎭 Express yourself with emojis and GIFs</li>
								</ul>
							</div>
							
							<div style="text-align: center; margin: 30px 0;">
								<a href="${appUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
									🚀 Start Chatting Now
								</a>
							</div>
							
							<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
								Your account is all set up and ready to go! You can start connecting with other users 
								right away. Feel free to explore all the features and let me know if you have any 
								questions or suggestions.
							</p>
							
							<div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
								<h4 style="color: #e65100; margin-top: 0;">💡 Pro Tips:</h4>
								<ul style="color: #424242; line-height: 1.6; margin: 10px 0;">
									<li>Update your profile picture to make your account more personal</li>
									<li>Enable two-factor authentication for extra security</li>
									<li>Customize your chat background to make conversations more fun</li>
									<li>Use the search feature to find friends quickly</li>
								</ul>
							</div>
							
							<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
								Thank you for choosing EngageSphere! I'm constantly working to improve the platform 
								and add new features based on user feedback. Your support means the world to me as 
								a small developer.
							</p>
							
							<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
								Happy chatting! 🎉
							</p>
							
							<p style="color: #999; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
								Best regards,<br>
								<strong>The EngageSphere Team</strong><br>
								<em>A small developer with big dreams</em>
							</p>
							
							<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
								<p style="color: #999; font-size: 12px; margin: 0;">
									If you have any questions or need support, feel free to reach out through the app's complaint system.
								</p>
							</div>
						</div>
					</div>
				`,
			};

			console.log("📤 Attempting to send welcome email...");
			await transporter.sendMail(mailOptions);
			console.log("✅ Welcome email sent successfully!");
			return true;
		} catch (error) {
			console.error("❌ Error sending welcome email:", error);
			console.error("Error details:", error.message);
			return false;
		}
	}
}

export default new WelcomeEmailService(); 