import { Server } from "socket.io";
import http from "http";
import express from "express";
import notificationService from "../services/notificationService.js";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: [
			"http://localhost:3000",
			"http://localhost:5173",
			"https://engagesphere-mrjv.onrender.com",
			"https://engagesphere.vercel.app",
			"https://*.vercel.app"
		],
		methods: ["GET", "POST"],
		credentials: true,
	},
});

export const getReceiverSocketId = (receiverId) => {
	return userSocketMap[receiverId]?.socketId;
};

// Function to check if user is online
export const isUserOnline = (userId) => {
	const userData = userSocketMap[userId];
	
	// User is considered online only if they have an active socket connection
	// "Last seen recently" users are considered offline for notification purposes
	const isOnline = userData?.isActive && 
		   (Date.now() - userData?.lastActivity) < INACTIVITY_TIMEOUT;
	
	console.log(`🔍 User ${userId} online status:`, isOnline ? "ONLINE" : "OFFLINE (including last seen recently)");
	console.log(`📊 User data:`, userData);
	console.log(`⏰ Last activity:`, userData?.lastActivity ? new Date(userData.lastActivity).toLocaleString() : "Never");
	console.log(`🕐 Time since last activity:`, userData?.lastActivity ? Math.floor((Date.now() - userData.lastActivity) / 1000) + " seconds" : "N/A");
	
	return isOnline;
};

// Function to check if user should receive email notification
export const shouldSendEmailNotification = (userId) => {
	const userData = userSocketMap[userId];
	
	// Send email notification if:
	// 1. User has no socket data (completely offline)
	// 2. User is not active
	// 3. User's last activity is older than 5 minutes (considered "last seen recently")
	const EMAIL_NOTIFICATION_THRESHOLD = 5 * 60 * 1000; // 5 minutes
	
	const shouldSend = !userData || 
					   !userData.isActive || 
					   (Date.now() - userData.lastActivity) > EMAIL_NOTIFICATION_THRESHOLD;
	
	console.log(`📧 Email notification check for user ${userId}:`);
	console.log(`  - Has socket data:`, !!userData);
	console.log(`  - Is active:`, userData?.isActive || false);
	console.log(`  - Time since last activity:`, userData?.lastActivity ? Math.floor((Date.now() - userData.lastActivity) / 1000) + " seconds" : "N/A");
	console.log(`  - Threshold:`, Math.floor(EMAIL_NOTIFICATION_THRESHOLD / 1000) + " seconds");
	console.log(`  - Should send email:`, shouldSend ? "YES" : "NO");
	
	return shouldSend;
};

// Function to send offline notification
export const sendOfflineNotification = async (recipientId, senderId, conversationId, messagePreview) => {
	try {
		console.log("📧 sendOfflineNotification called");
		console.log("📋 Parameters:", { recipientId, senderId, conversationId, messagePreview });
		
		// Check if user should receive email notification
		const shouldSendEmail = shouldSendEmailNotification(recipientId);
		console.log("🔍 Email notification check result:", shouldSendEmail);
		
		if (shouldSendEmail) {
			console.log("📤 Calling notification service...");
			const result = await notificationService.sendOfflineNotification(
				recipientId, 
				senderId, 
				conversationId, 
				messagePreview
			);
			console.log("📊 Notification service returned:", result);
			return result;
		} else {
			console.log("⏭️ User is actively online, skipping email notification");
			return false;
		}
	} catch (error) {
		console.error("❌ Error sending offline notification:", error);
		return false;
	}
};

// Enhanced user tracking with timestamps and activity
const userSocketMap = {}; // {userId: {socketId, lastActivity, isActive}}
const socketUserMap = {}; // {socketId: userId} for reverse lookup

// Cleanup inactive users (2 minutes of inactivity for faster detection)
const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

// Function to get active online users
export const getActiveOnlineUsers = () => {
	const now = Date.now();
	const activeUsers = [];
	
	for (const [userId, userData] of Object.entries(userSocketMap)) {
		if (userData.isActive && (now - userData.lastActivity) < INACTIVITY_TIMEOUT) {
			activeUsers.push(userId);
		}
	}
	
	console.log(`📊 Current online users: ${activeUsers.length}`, activeUsers);
	return activeUsers;
};

// Debug function to log current user map state
export const debugUserMap = () => {
	console.log("🔍 Current userSocketMap state:");
	for (const [userId, userData] of Object.entries(userSocketMap)) {
		const timeSinceActivity = Date.now() - userData.lastActivity;
		console.log(`  User ${userId}: active=${userData.isActive}, lastActivity=${Math.floor(timeSinceActivity/1000)}s ago`);
	}
};

// Function to broadcast online users to all clients
const broadcastOnlineUsers = () => {
	const onlineUsers = getActiveOnlineUsers();
	io.emit("getOnlineUsers", onlineUsers);
	
	// Also broadcast admin stats update when online users change
	broadcastAdminStats();
};

// Function to broadcast admin stats to all clients
const broadcastAdminStats = async () => {
	try {
		// Import admin controller functions dynamically
		const { getSystemStats } = await import("../controllers/admin.controller.js");
		
		// Create a mock request/response for the admin stats
		const mockReq = { admin: { _id: "system" } };
		const mockRes = {
			status: (code) => ({
				json: (data) => {
					if (code === 200) {
						// Emit stats update to all admin clients
						io.emit("adminStatsUpdate", data);
					}
				}
			})
		};
		
		await getSystemStats(mockReq, mockRes);
	} catch (error) {
		console.error("Error broadcasting admin stats:", error);
	}
};

// Function to mark user as active
const markUserActive = (userId) => {
	if (userSocketMap[userId]) {
		userSocketMap[userId].lastActivity = Date.now();
		userSocketMap[userId].isActive = true;
	}
};

// Function to remove user from online list
const removeUser = (userId) => {
	if (userSocketMap[userId]) {
		delete userSocketMap[userId];
		// Remove from reverse lookup
		for (const [socketId, mappedUserId] of Object.entries(socketUserMap)) {
			if (mappedUserId === userId) {
				delete socketUserMap[socketId];
				break;
			}
		}
	}
};

// Function to clear all online users (for debugging)
export const clearAllOnlineUsers = () => {
	console.log(`🧹 Clearing all online users. Current count: ${Object.keys(userSocketMap).length}`);
	
	// Clear all entries from the objects instead of reassigning
	Object.keys(userSocketMap).forEach(key => delete userSocketMap[key]);
	Object.keys(socketUserMap).forEach(key => delete socketUserMap[key]);
	
	broadcastOnlineUsers();
	console.log("✅ All online users cleared");
};

// Periodic cleanup of inactive users (more frequent for faster detection)
setInterval(() => {
	const now = Date.now();
	let hasChanges = false;
	
	for (const [userId, userData] of Object.entries(userSocketMap)) {
		if ((now - userData.lastActivity) >= INACTIVITY_TIMEOUT) {
			console.log(`🔄 Removing inactive user ${userId} (inactive for ${Math.floor((now - userData.lastActivity) / 1000)}s)`);
			removeUser(userId);
			hasChanges = true;
		}
	}
	
	if (hasChanges) {
		console.log(`📡 Broadcasting updated online users after cleanup`);
		broadcastOnlineUsers();
	}
}, 15000); // Check every 15 seconds for faster cleanup

io.on("connection", (socket) => {
	console.log("🔌 New socket connection:", socket.id);

	const userId = socket.handshake.query.userId;
	console.log("👤 User ID from query:", userId);
	
	if (userId && userId !== "undefined") {
		// Store user data with timestamp
		userSocketMap[userId] = {
			socketId: socket.id,
			lastActivity: Date.now(),
			isActive: true
		};
		socketUserMap[socket.id] = userId;
		
		console.log(`✅ User ${userId} connected with socket ${socket.id}`);
		console.log(`📊 Current online users:`, getActiveOnlineUsers());
		
		// Broadcast updated online users
		broadcastOnlineUsers();
	} else {
		console.log("❌ No valid user ID provided for socket connection");
	}

	// Handle heartbeat/ping from client
	socket.on("heartbeat", () => {
		if (userId && userSocketMap[userId]) {
			markUserActive(userId);
		}
	});

	// Handle user activity (typing, etc.)
	socket.on("userActivity", () => {
		if (userId && userSocketMap[userId]) {
			markUserActive(userId);
		}
	});

	// Handle test events
	socket.on("test", (data) => {
		console.log(`Test event received from user ${userId}:`, data);
		socket.emit("testResponse", { message: "Test response received", userId });
	});

	// Handle admin stats requests
	socket.on("requestAdminStats", async () => {
		try {
			// Import admin controller functions dynamically
			const { getSystemStats } = await import("../controllers/admin.controller.js");
			
			// Create a mock request/response for the admin stats
			const mockReq = { admin: { _id: userId } };
			const mockRes = {
				status: (code) => ({
					json: (data) => {
						if (code === 200) {
							// Emit stats update to all admin clients
							io.emit("adminStatsUpdate", data);
						}
					}
				})
			};
			
			await getSystemStats(mockReq, mockRes);
		} catch (error) {
			console.error("Error handling admin stats request:", error);
		}
	});

	// Handle online users requests
	socket.on("requestOnlineUsers", () => {
		console.log(`📡 Admin ${userId} requested online users list`);
		const onlineUsers = getActiveOnlineUsers();
		socket.emit("getOnlineUsers", onlineUsers);
		console.log(`📤 Sent ${onlineUsers.length} online users to admin`);
	});

	// Handle debug requests
	socket.on("requestDebugInfo", () => {
		console.log(`🔍 Admin ${userId} requested debug info`);
		debugUserMap();
		const onlineUsers = getActiveOnlineUsers();
		socket.emit("debugInfo", {
			onlineUsers,
			totalUsers: Object.keys(userSocketMap).length,
			timestamp: Date.now()
		});
	});
	socket.on("requestDebugInfo", () => {
		console.log(`🔍 Admin ${userId} requested debug info`);
		debugUserMap();
		const onlineUsers = getActiveOnlineUsers();
		socket.emit("debugInfo", {
			onlineUsers,
			totalUsers: Object.keys(userSocketMap).length,
			timestamp: Date.now()
		});
	});

	// Handle video call events
	socket.on("videoCallStarted", (data) => {
		const { recipientId, callerId, callerName, channelName } = data;
		const recipientSocketId = getReceiverSocketId(recipientId);
		
		if (recipientSocketId) {
			io.to(recipientSocketId).emit("videoCallStarted", {
				recipientId,
				callerId,
				callerName,
				channelName
			});
			console.log(`Video call notification sent from ${callerName} to ${recipientId}`);
		} else {
			console.log(`Recipient ${recipientId} is not online`);
		}
	});

	socket.on("videoCallEnded", (data) => {
		const { recipientId, callerId } = data;
		const recipientSocketId = getReceiverSocketId(recipientId);
		
		if (recipientSocketId) {
			io.to(recipientSocketId).emit("videoCallEnded", {
				recipientId,
				callerId
			});
			console.log(`Video call ended notification sent to ${recipientId}`);
		}
	});

	// Handle new message notifications
	socket.on("newMessage", (data) => {
		const { recipientId, message } = data;
		const recipientSocketId = getReceiverSocketId(recipientId);
		
		if (recipientSocketId) {
			io.to(recipientSocketId).emit("newMessage", message);
			console.log(`New message notification sent to ${recipientId}`);
		} else {
			console.log(`Recipient ${recipientId} is not online for message notification`);
		}
	});

	// Handle disconnect
	socket.on("disconnect", (reason) => {
		console.log(`🔌 User disconnected - Socket: ${socket.id}, User: ${userId}, Reason: ${reason}`);
		
		if (userId && userId !== "undefined") {
			removeUser(userId);
			console.log(`✅ User ${userId} removed from online list`);
			
			// Broadcast updated online users immediately
			broadcastOnlineUsers();
		}
	});

	// Handle connection close (additional safety)
	socket.on("close", (reason) => {
		console.log(`🔒 Socket closed - Socket: ${socket.id}, User: ${userId}, Reason: ${reason}`);
		
		if (userId && userId !== "undefined") {
			removeUser(userId);
			console.log(`✅ User ${userId} removed from online list (close event)`);
			broadcastOnlineUsers();
		}
	});

	// Handle errors
	socket.on("error", (error) => {
		console.error("Socket error:", error);
		if (userId && userId !== "undefined") {
			removeUser(userId);
			broadcastOnlineUsers();
		}
	});
});

export { app, io, server };
