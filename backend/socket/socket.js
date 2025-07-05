import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: ["http://localhost:3000"],
		methods: ["GET", "POST"],
		credentials: true,
	},
});

export const getReceiverSocketId = (receiverId) => {
	return userSocketMap[receiverId]?.socketId;
};

// Enhanced user tracking with timestamps and activity
const userSocketMap = {}; // {userId: {socketId, lastActivity, isActive}}
const socketUserMap = {}; // {socketId: userId} for reverse lookup

// Cleanup inactive users (5 minutes of inactivity)
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

// Function to get active online users
const getActiveOnlineUsers = () => {
	const now = Date.now();
	const activeUsers = [];
	
	for (const [userId, userData] of Object.entries(userSocketMap)) {
		if (userData.isActive && (now - userData.lastActivity) < INACTIVITY_TIMEOUT) {
			activeUsers.push(userId);
		}
	}
	
	return activeUsers;
};

// Function to broadcast online users to all clients
const broadcastOnlineUsers = () => {
	const onlineUsers = getActiveOnlineUsers();
	io.emit("getOnlineUsers", onlineUsers);
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

// Periodic cleanup of inactive users
setInterval(() => {
	const now = Date.now();
	let hasChanges = false;
	
	for (const [userId, userData] of Object.entries(userSocketMap)) {
		if ((now - userData.lastActivity) >= INACTIVITY_TIMEOUT) {
			removeUser(userId);
			hasChanges = true;
		}
	}
	
	if (hasChanges) {
		broadcastOnlineUsers();
	}
}, 60000); // Check every minute

io.on("connection", (socket) => {
	console.log("a user connected", socket.id);

	const userId = socket.handshake.query.userId;
	if (userId && userId !== "undefined") {
		// Store user data with timestamp
		userSocketMap[userId] = {
			socketId: socket.id,
			lastActivity: Date.now(),
			isActive: true
		};
		socketUserMap[socket.id] = userId;
		
		console.log(`User ${userId} connected with socket ${socket.id}`);
		
		// Broadcast updated online users
		broadcastOnlineUsers();
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

	// Handle disconnect
	socket.on("disconnect", (reason) => {
		console.log("user disconnected", socket.id, "reason:", reason);
		
		if (userId && userId !== "undefined") {
			removeUser(userId);
			console.log(`User ${userId} disconnected`);
			
			// Broadcast updated online users
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
