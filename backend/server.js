// EC2 entry point. Sets up the HTTP server with the Express app, attaches
// Socket.IO, and starts listening. Used by PM2 (ecosystem.config.cjs).
//
// All Express middleware + routes live in app.js so the same app can be
// wrapped by serverless-http for Lambda (lambda.js).
import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectToMongoDB from "./db/connectToMongoDB.js";
import { createSocketServer } from "./socket/socket.js";
import notificationService from "./services/notificationService.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
createSocketServer(server);

server.listen(PORT, "0.0.0.0", () => {
	connectToMongoDB();
	console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || "development"})`);

	// Notification cleanup runs every 6 hours
	setInterval(
		() => notificationService.cleanupOldNotifications(),
		6 * 60 * 60 * 1000,
	);
	notificationService.cleanupOldNotifications();
});
