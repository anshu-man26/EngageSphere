import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import notificationService from "../services/notificationService.js";

const router = express.Router();

console.log("🔧 Notification routes file loaded");

// Simple test endpoint without authentication
router.get("/ping", (req, res) => {
	console.log("Ping endpoint called");
	res.status(200).json({ 
		message: "Notification routes are accessible",
		time: new Date().toISOString()
	});
});

// Health check endpoint
router.get("/health", (req, res) => {
	console.log("Health endpoint called");
	res.status(200).json({ 
		status: "OK", 
		message: "Notification routes are working",
		timestamp: new Date().toISOString()
	});
});

// Email configuration test endpoint
router.get("/email-test", async (req, res) => {
	try {
		console.log("🔧 Testing email configuration...");
		
		const transporter = createTransporter();
		if (!transporter) {
			return res.status(500).json({ 
				error: "Email transporter not configured",
				emailUser: process.env.EMAIL_USER ? "Set" : "Missing",
				emailPass: process.env.EMAIL_PASS ? "Set" : "Missing"
			});
		}

		// Test email configuration
		transporter.verify(function(error, success) {
			if (error) {
				console.error("❌ Email configuration error:", error);
				res.status(500).json({ 
					error: "Email configuration failed",
					details: error.message
				});
			} else {
				console.log("✅ Email configuration verified successfully");
				res.status(200).json({ 
					message: "Email configuration is working",
					emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}...` : "Missing"
				});
			}
		});
	} catch (error) {
		console.error("❌ Email test error:", error);
		res.status(500).json({ error: "Email test failed", details: error.message });
	}
});

// Debug endpoint to check user online status
router.get("/user-status/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		
		// Import the functions from socket.js
		const { isUserOnline, shouldSendEmailNotification } = await import("../socket/socket.js");
		
		const onlineStatus = isUserOnline(userId);
		const shouldSendEmail = shouldSendEmailNotification(userId);
		
		res.status(200).json({
			userId,
			onlineStatus,
			shouldSendEmail,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error("Error checking user status:", error);
		res.status(500).json({ error: "Failed to check user status" });
	}
});

// Test endpoint to manually trigger a notification
router.post("/test", protectRoute, async (req, res) => {
	try {
		console.log("🔧 Test notification endpoint called");
		console.log("📝 Request body:", req.body);
		console.log("👤 User:", req.user);

		const { recipientId, messagePreview } = req.body;
		const senderId = req.user._id;

		if (!recipientId) {
			console.log("❌ Missing recipientId");
			return res.status(400).json({ error: "Recipient ID is required" });
		}

		// Create a dummy conversation ID for testing
		const testConversationId = "507f1f77bcf86cd799439011";

		console.log("📞 Calling notification service with:", {
			recipientId,
			senderId,
			testConversationId,
			messagePreview
		});

		const result = await notificationService.sendOfflineNotification(
			recipientId,
			senderId,
			testConversationId,
			messagePreview || "This is a test message"
		);

		console.log("📊 Notification service result:", result);

		if (result) {
			res.status(200).json({ message: "Test notification sent successfully via email!" });
		} else {
			res.status(200).json({ message: "Notification not sent (service returned false)" });
		}
	} catch (error) {
		console.error("❌ Error in test notification:", error);
		res.status(500).json({ error: "Internal server error", details: error.message });
	}
});

export default router; 