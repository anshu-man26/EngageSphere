import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import createTransporter from "../config/nodemailer.js";

class NotificationService {
	/**
	 * Send email notification to offline user
	 * @param {string} recipientId - ID of the offline user
	 * @param {string} senderId - ID of the user sending the message
	 * @param {string} conversationId - ID of the conversation
	 * @param {string} messagePreview - Preview of the message (first 50 chars)
	 */
	async sendOfflineNotification(recipientId, senderId, conversationId, messagePreview = "") {
		try {
			console.log("🔧 Starting notification process...");
			console.log("Recipient ID:", recipientId);
			console.log("Sender ID:", senderId);
			console.log("Conversation ID:", conversationId);
			console.log("Message Preview:", messagePreview);

			// Check if we can send notification (1-hour cooldown)
			const existingNotification = await Notification.findOne({
				recipientId,
				senderId,
				conversationId
			});

			if (existingNotification && !existingNotification.canSendNotification()) {
				// Update message count but don't send email
				await existingNotification.updateNotification();
				console.log(`⏰ Notification cooldown active for ${recipientId} from ${senderId} (1-hour cooldown)`);
				return false;
			}

			// Get recipient and sender details
			const [recipient, sender] = await Promise.all([
				User.findById(recipientId).select("email fullName"),
				User.findById(senderId).select("fullName username")
			]);

			console.log("Recipient found:", recipient ? "Yes" : "No");
			console.log("Sender found:", sender ? "Yes" : "No");

			if (!recipient || !sender) {
				console.log("❌ Recipient or sender not found for notification");
				console.log("Recipient:", recipient);
				console.log("Sender:", sender);
				return false;
			}

			console.log("📧 Recipient email:", recipient.email);
			console.log("👤 Sender name:", sender.fullName || sender.username);

			// Create or update notification record
			const notificationData = {
				recipientId,
				senderId,
				conversationId,
				lastNotificationSent: new Date(),
				messageCount: existingNotification ? existingNotification.messageCount + 1 : 1
			};

			await Notification.findOneAndUpdate(
				{ recipientId, senderId, conversationId },
				notificationData,
				{ upsert: true, new: true }
			);

			console.log("💾 Notification record saved to database");

			// Send email notification
			const emailResult = await this.sendEmailNotification(recipient, sender, messagePreview);

			if (emailResult) {
				console.log(`✅ Email notification sent to ${recipient.email} from ${sender.fullName} (1-hour cooldown active)`);
				return true;
			} else {
				console.log("❌ Email notification failed to send");
				return false;
			}

		} catch (error) {
			console.error("❌ Error sending offline notification:", error);
			return false;
		}
	}

	/**
	 * Send email notification
	 * @param {Object} recipient - Recipient user object
	 * @param {Object} sender - Sender user object
	 * @param {string} messagePreview - Message preview
	 */
	async sendEmailNotification(recipient, sender, messagePreview) {
		console.log("📧 Starting email notification...");
		
		const transporter = createTransporter();
		if (!transporter) {
			console.error("❌ Email transporter not configured");
			return false;
		}

		console.log("✅ Email transporter created successfully");

		const appUrl = process.env.CLIENT_URL || "https://engagesphere-mrjv.onrender.com";
		const senderName = sender.fullName || sender.username || "Someone";

		console.log("📧 Email details:");
		console.log("  From:", process.env.EMAIL_USER);
		console.log("  To:", recipient.email);
		console.log("  Sender Name:", senderName);
		console.log("  App URL:", appUrl);
		console.log("  Subject: New message from ${senderName} - EngageSphere");

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: recipient.email,
			subject: `New message from ${senderName} - EngageSphere`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
						<h1 style="color: white; margin: 0; font-size: 28px;">EngageSphere</h1>
						<p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">You have a new message!</p>
					</div>
					<div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
						<h2 style="color: #333; margin-bottom: 20px;">Hello ${recipient.fullName}!</h2>
						<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
							You have received a new message from <strong>${senderName}</strong> while you were offline.
						</p>
						
						${messagePreview ? `
						<div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0;">
							<p style="color: #495057; margin: 0; font-style: italic;">
								"${messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview}"
							</p>
						</div>
						` : ''}
						
						<div style="text-align: center; margin: 30px 0;">
							<a href="${appUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
								Open EngageSphere
							</a>
						</div>
						
						<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
							Click the button above to read your messages and stay connected with your friends!
						</p>
						
						<p style="color: #999; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
							This notification was sent because you were offline when the message was received. 
							You won't receive another notification from the same person for the next hour.
						</p>
					</div>
				</div>
			`,
		};

		try {
			console.log("📤 Attempting to send email...");
			await transporter.sendMail(mailOptions);
			console.log("✅ Email sent successfully!");
			return true;
		} catch (error) {
			console.error("❌ Error sending email notification:", error);
			console.error("Error details:", error.message);
			return false;
		}
	}

	/**
	 * Clean up old notification records (older than 24 hours)
	 */
	async cleanupOldNotifications() {
		try {
			const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
			await Notification.deleteMany({
				lastNotificationSent: { $lt: twentyFourHoursAgo }
			});
			console.log("Old notification records cleaned up");
		} catch (error) {
			console.error("Error cleaning up old notifications:", error);
		}
	}
}

export default new NotificationService(); 