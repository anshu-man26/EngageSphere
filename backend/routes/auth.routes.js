import express from "express";
import { login, logout, signup, sendOTP, sendSignupOtp, verifyOTP, resetPassword, verifySignupOTP, enable2FA, verifyEnable2FA, disable2FA } from "../controllers/auth.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/signup", signup);

router.post("/send-signup-otp", sendSignupOtp);

router.post("/verify-signup-otp", verifySignupOTP);

router.post("/login", login);

router.post("/logout", logout);

router.post("/send-otp", sendOTP);

router.post("/verify-otp", verifyOTP);

router.post("/reset-password", resetPassword);

// 2FA routes - require authentication
router.post("/enable-2fa", protectRoute, enable2FA);

router.post("/verify-enable-2fa", protectRoute, verifyEnable2FA);

router.post("/disable-2fa", protectRoute, disable2FA);

export default router;
