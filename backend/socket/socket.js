// Socket.IO server — presence + signaling.
//
// One source of truth: `onlineUsers` (Map<userId, socketId>).
// "Online" = "has a connected websocket". No heartbeats, no activity tracking,
// no inactivity timers. Socket.IO already maintains the connection (with its
// own ping/pong), so we trust `connect`/`disconnect` events and that's it.
//
// Public API (preserved for callers in controllers/services):
//   - getReceiverSocketId(userId) → socketId | undefined
//   - isUserOnline(userId) → boolean
//   - shouldSendEmailNotification(userId) → boolean (true when offline)
//   - getActiveOnlineUsers() → string[]
//   - clearAllOnlineUsers() → void  (admin tool)
//   - sendOfflineNotification(...) → forwards to notificationService when offline
//   - app, io, server (Express + Socket.IO instances)

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
			process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
			process.env.FRONTEND_URL,
		].filter(Boolean),
		methods: ["GET", "POST"],
		credentials: true,
	},
});

// userId → socketId. Latest connection wins (multi-tab: newest tab gets events).
const onlineUsers = new Map();

const broadcastOnline = () => {
	io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
};

// ──────────────────── Public helpers ────────────────────
export const getReceiverSocketId = (userId) => onlineUsers.get(userId);
export const isUserOnline = (userId) => onlineUsers.has(userId);
export const shouldSendEmailNotification = (userId) => !onlineUsers.has(userId);
export const getActiveOnlineUsers = () => Array.from(onlineUsers.keys());

export const clearAllOnlineUsers = () => {
	onlineUsers.clear();
	broadcastOnline();
};

export const sendOfflineNotification = async (
	recipientId,
	senderId,
	conversationId,
	messagePreview = "",
) => {
	if (!shouldSendEmailNotification(recipientId)) return false;
	try {
		return await notificationService.sendOfflineNotification(
			recipientId,
			senderId,
			conversationId,
			messagePreview,
		);
	} catch (err) {
		console.error("sendOfflineNotification failed:", err.message);
		return false;
	}
};

// ──────────────────── Admin stats helper ────────────────────
// Triggers a fresh stats snapshot to all admin clients. Lazy import to avoid
// a circular dependency at module load.
const broadcastAdminStats = async () => {
	try {
		const { getSystemStats } = await import("../controllers/admin.controller.js");
		await getSystemStats(
			{ admin: { _id: "system" } },
			{
				status: (code) => ({
					json: (data) => {
						if (code === 200) io.emit("adminStatsUpdate", data);
					},
				}),
			},
		);
	} catch (err) {
		console.error("broadcastAdminStats failed:", err.message);
	}
};

// ──────────────────── Connection lifecycle ────────────────────
io.on("connection", (socket) => {
	const userId = socket.handshake.query.userId;
	if (!userId || userId === "undefined") {
		socket.disconnect(true);
		return;
	}

	onlineUsers.set(userId, socket.id);
	broadcastOnline();
	broadcastAdminStats();

	// Video-call signaling — pure passthrough to recipient
	socket.on("videoCallStarted", (data) => {
		const target = onlineUsers.get(data?.recipientId);
		if (target) io.to(target).emit("videoCallStarted", data);
	});
	socket.on("videoCallEnded", (data) => {
		const target = onlineUsers.get(data?.recipientId);
		if (target) io.to(target).emit("videoCallEnded", data);
	});

	// Admin requests
	socket.on("requestAdminStats", broadcastAdminStats);
	socket.on("requestOnlineUsers", () => {
		socket.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
	});

	socket.on("disconnect", () => {
		// Only clear if THIS socket is still the tracked one (a newer tab from
		// the same user may have replaced it).
		if (onlineUsers.get(userId) === socket.id) {
			onlineUsers.delete(userId);
			broadcastOnline();
			broadcastAdminStats();
		}
	});
});

export { app, io, server };
