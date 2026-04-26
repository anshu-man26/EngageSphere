import express from "express";
import pkg from "agora-access-token";
import protectRoute from "../middleware/protectRoute.js";

const { RtcTokenBuilder, RtcRole } = pkg;

const router = express.Router();

// GET /api/agora/token?channel=<name>&uid=<optional>
// Returns a short-lived RTC token bound to the requested channel.
router.get("/token", protectRoute, (req, res) => {
	try {
		const appId = process.env.AGORA_APP_ID;
		const appCertificate = process.env.AGORA_APP_CERTIFICATE;

		if (!appId || !appCertificate) {
			return res.status(500).json({
				error:
					"Server is missing AGORA_APP_ID or AGORA_APP_CERTIFICATE. Add them to backend/.env.",
			});
		}

		const channel = req.query.channel;
		if (!channel || typeof channel !== "string") {
			return res.status(400).json({ error: "channel query param is required" });
		}

		// Numeric uid (0 = let Agora assign one). Allow caller to pin a uid via ?uid=
		const uid = Number.isFinite(Number(req.query.uid)) ? Number(req.query.uid) : 0;

		const role = RtcRole.PUBLISHER;
		const expireSeconds = 60 * 60; // 1 hour
		const privilegeExpire = Math.floor(Date.now() / 1000) + expireSeconds;

		const token = RtcTokenBuilder.buildTokenWithUid(
			appId,
			appCertificate,
			channel,
			uid,
			role,
			privilegeExpire,
		);

		return res.status(200).json({
			token,
			appId,
			channel,
			uid,
			expireAt: privilegeExpire,
		});
	} catch (err) {
		console.error("Agora token generation failed:", err);
		return res.status(500).json({ error: "Failed to generate Agora token" });
	}
});

export default router;
