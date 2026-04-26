// AWS Lambda entrypoint. Wraps the Express app with serverless-http and
// caches the Mongo connection across invocations so warm invocations skip
// the connection handshake.
//
// Socket.IO is NOT run here — Lambda can't hold persistent connections.
// The long-lived socket server runs on EC2 (server.js + ecosystem.config.cjs).
// Any controller that calls `io.to(...).emit(...)` from a Lambda invocation
// hits the no-op stub in socket/socket.js — message is saved, but the
// real-time push goes through whatever channel the EC2 socket server
// broadcasts on.

import "dotenv/config";
import serverless from "serverless-http";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import app from "./app.js";

// ── Cloudinary (sync, no network) ────────────────────────────────
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// ── Mongo connection cache ────────────────────────────────────────
// Lambda re-uses the Node runtime across warm invocations, so we keep a
// singleton promise for the connection. `bufferCommands: false` makes
// queries fail fast instead of queueing if Mongo is unreachable, which
// avoids requests hanging until the 29s API Gateway timeout.
let connectionPromise = null;
const connectToMongo = async () => {
	if (mongoose.connection.readyState === 1) return;
	if (!connectionPromise) {
		connectionPromise = mongoose
			.connect(process.env.MONGO_DB_URI, {
				serverSelectionTimeoutMS: 5000,
				bufferCommands: false,
			})
			.catch((err) => {
				connectionPromise = null;
				throw err;
			});
	}
	await connectionPromise;
};

// ── Handler ──────────────────────────────────────────────────────
const wrapped = serverless(app, {
	binary: ["multipart/form-data", "application/octet-stream", "image/*"],
});

export const main = async (event, context) => {
	// Keep the Lambda container alive after we return so Mongo's connection
	// pool survives between invocations.
	context.callbackWaitsForEmptyEventLoop = false;
	await connectToMongo();
	return wrapped(event, context);
};
