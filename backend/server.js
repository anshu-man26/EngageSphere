import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

// Load environment variables first
dotenv.config();

// Verify environment variables are loaded
console.log("🔍 Environment Variables Check:");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "✅ Set" : "❌ Missing");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Set" : "❌ Missing");
console.log("");

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";

import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";

const __dirname = path.resolve();
// PORT should be assigned after calling dotenv.config() because we need to access the env variables. Didn't realize while recording the video. Sorry for the confusion.
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
	origin: [
		"http://localhost:3000", 
		"http://localhost:5173", 
		"http://10.18.214.234:3000",
		"https://engagesphere-mrjv.onrender.com"
	], // Allow both common frontend ports and your IP
	credentials: true, // Allow cookies and authentication headers
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json()); // to parse the incoming requests with JSON payloads (from req.body)
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

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
	console.log(`Server Running on port ${PORT}`);
	console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
	console.log(`Access from mobile: http://10.18.214.234:3000`);
});
