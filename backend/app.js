// Express app — pure HTTP. No socket.io, no .listen(). Used by both the
// EC2 entrypoint (server.js, which adds socket.io) and the Lambda
// entrypoint (lambda.js, which wraps it with serverless-http).
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import agoraRoutes from "./routes/agora.routes.js";

const __dirname = path.resolve();
const isProd = process.env.NODE_ENV === "production";

const app = express();

// CORS — same allow-list for both Lambda and EC2 entrypoints.
app.use(
	cors({
		origin: [
			"http://localhost:3000",
			"http://localhost:5173",
			process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
			process.env.FRONTEND_URL,
		].filter(Boolean),
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	}),
);

app.use(express.json());
app.use(cookieParser());

// Optional request logger (off by default — set LOG_REQUESTS=true to enable)
if (process.env.LOG_REQUESTS === "true") {
	app.use((req, _res, next) => {
		console.log(`${req.method} ${req.path}`);
		next();
	});
}

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/agora", agoraRoutes);

// Health check
app.get("/api/health", (_req, res) => {
	res.status(200).json({
		status: "OK",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		environment: process.env.NODE_ENV || "development",
	});
});

// In production on EC2 the same Express server can also serve the SPA build
// (when frontend is co-hosted). On Lambda this branch is a no-op since the
// dist files aren't packaged.
if (isProd) {
	app.use(express.static(path.join(__dirname, "../frontend/dist")));
	app.get("*", (_req, res) => {
		res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
	});
}

export default app;
