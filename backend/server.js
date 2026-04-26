import "dotenv/config";
import path from "path";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

// Verify environment variables are loaded
console.log("🔍 Environment Variables Check:");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "✅ Set" : "❌ Missing");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Set" : "❌ Missing");
console.log("");

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import agoraRoutes from "./routes/agora.routes.js";

import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";
import notificationService from "./services/notificationService.js";

const __dirname = path.resolve();
// PORT should be assigned after calling dotenv.config() because we need to access the env variables. Didn't realize while recording the video. Sorry for the confusion.
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
	origin: [
		"http://localhost:3000",
		"http://localhost:5173",
		"http://10.18.214.234:3000",
		process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
		process.env.FRONTEND_URL
	].filter(Boolean), // Allow both common frontend ports and your IP
	credentials: true, // Allow cookies and authentication headers
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json()); // to parse the incoming requests with JSON payloads (from req.body)
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/agora", agoraRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
	res.status(200).json({ 
		status: 'OK', 
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		environment: process.env.NODE_ENV || 'development',
		version: '1.0.0'
	});
});

console.log("✅ Routes registered:");
console.log("  - /api/auth");
console.log("  - /api/messages");
console.log("  - /api/users");
console.log("  - /api/notifications");
console.log("  - /api/admin");
console.log("  - /api/complaints");
console.log("  - /api/agora");
console.log("  - /api/health");

// Request logger — noisy in prod, only enabled when LOG_REQUESTS=true
if (process.env.LOG_REQUESTS === "true") {
	app.use((req, res, next) => {
		console.log(`${req.method} ${req.path}`);
		next();
	});
}

// Only serve static files and handle frontend routes in production
if (process.env.NODE_ENV === 'production') {
	// Serve static files from the frontend/dist directory
	app.use(express.static(path.join(__dirname, "../frontend/dist")));

	// Handle all other routes by serving the React app
	app.get("*", (req, res) => {
		res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
	});
}

server.listen(PORT, '0.0.0.0', () => {
	connectToMongoDB();
	console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);

	// Start notification cleanup job (runs every 6 hours)
	setInterval(() => {
		notificationService.cleanupOldNotifications();
	}, 6 * 60 * 60 * 1000);

	// Run initial cleanup
	notificationService.cleanupOldNotifications();
});
