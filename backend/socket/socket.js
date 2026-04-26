// Socket.IO server — presence + signaling.
//
// In the new architecture this file is a *factory*:
//   - On EC2 (server.js) we call createSocketServer(httpServer) to attach
//     a real Socket.IO server to the http server.
//   - On Lambda (lambda.js) we never call it — Lambda can't hold persistent
//     connections — so the exported `io` stays a no-op stub. Any controller
//     that accidentally calls `io.to(...).emit(...)` from a Lambda invocation
//     simply does nothing instead of throwing.
//
// Public API (preserved for callers in controllers/services):
//   - getReceiverSocketId(userId) → socketId | undefined
//   - isUserOnline(userId) → boolean
//   - shouldSendEmailNotification(userId) → boolean (true when offline)
//   - getActiveOnlineUsers() → string[]
//   - clearAllOnlineUsers() → void  (admin tool)
//   - sendOfflineNotification(...) → forwards to notificationService when offline
//   - io  (real Server instance after createSocketServer runs; stub before)
//   - createSocketServer(httpServer) → real Server

import { Server } from "socket.io";
import notificationService from "../services/notificationService.js";

// userId → socketId. Latest connection wins (multi-tab: newest tab gets events).
const onlineUsers = new Map();

// `io` is exposed as a mutable export — controllers do `import { io } from
// "../socket/socket.js"` and call `io.to(...)`. Until createSocketServer runs
// it's a stub with no-op chains so Lambda doesn't crash.
const noopChain = { emit: () => {} };
const ioStub = {
	to: () => noopChain,
	emit: () => {},
	on: () => {},
	off: () => {},
	use: () => {},
	removeAllListeners: () => {},
};
export let io = ioStub;

// ──────────────────── Public helpers ────────────────────
export const getReceiverSocketId = (userId) => onlineUsers.get(userId);
export const isUserOnline = (userId) => onlineUsers.has(userId);
export const shouldSendEmailNotification = (userId) => !onlineUsers.has(userId);
export const getActiveOnlineUsers = () => Array.from(onlineUsers.keys());

export const clearAllOnlineUsers = () => {
	onlineUsers.clear();
	if (io && typeof io.emit === "function") {
		io.emit("getOnlineUsers", []);
	}
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

// ──────────────────── Factory ────────────────────
// Called once from server.js on the EC2 box. Returns the real Server so the
// caller can keep a reference if needed.
export const createSocketServer = (httpServer) => {
	const realIo = new Server(httpServer, {
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

	io = realIo;

	const broadcastOnline = () => {
		realIo.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
	};

	realIo.on("connection", (socket) => {
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
			if (target) realIo.to(target).emit("videoCallStarted", data);
		});
		socket.on("videoCallEnded", (data) => {
			const target = onlineUsers.get(data?.recipientId);
			if (target) realIo.to(target).emit("videoCallEnded", data);
		});

		// Admin requests
		socket.on("requestAdminStats", broadcastAdminStats);
		socket.on("requestOnlineUsers", () => {
			socket.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
		});

		socket.on("disconnect", () => {
			if (onlineUsers.get(userId) === socket.id) {
				onlineUsers.delete(userId);
				broadcastOnline();
				broadcastAdminStats();
			}
		});
	});

	return realIo;
};
