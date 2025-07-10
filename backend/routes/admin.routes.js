import express from "express";
import {
	adminLogin,
	adminLogout,
	verifyAdminLoginOtp,
	getAdminProfile,
	updateAdminProfile,
	changeAdminPassword,
	requestAdminPasswordReset,
	verifyAdminPasswordResetOtp,
	resetAdminPassword,
	requestDeleteConfirmationOtp,
	verifyDeleteConfirmationOtp,
	confirmDeleteUsers,
	getAllUsers,
	deleteUser,
	deleteMultipleUsers,
	getUserDetails,
	updateUserProfile,
	changeUserPassword,
	uploadUserProfilePic,
	getSystemStats,
	clearOnlineUsers,
	getSystemHealth,
	getSystemSettings,
	updateSystemSettings,
	broadcastMessage,
	getBroadcastHistory,
	deleteBroadcast
} from "../controllers/admin.controller.js";
import { protectAdminRoute, requirePermission } from "../middleware/protectAdminRoute.js";
import { profilePicUpload } from "../middleware/upload.js";
import SystemSettings from "../models/systemSettings.model.js";

const router = express.Router();

// Public admin routes
router.post("/login", adminLogin);
router.post("/verify-login-otp", verifyAdminLoginOtp);
router.post("/logout", adminLogout);

// Admin password recovery routes (public)
router.post("/forgot-password", requestAdminPasswordReset);
router.post("/verify-otp", verifyAdminPasswordResetOtp);
router.post("/reset-password", resetAdminPassword);

// Public system settings route (for mobile availability check)
router.get("/settings/public", async (req, res) => {
	try {
		const settings = await SystemSettings.getInstance();
		res.status(200).json({
			mobileAvailability: settings.mobileAvailability,
			maintenanceMode: settings.maintenanceMode,
			userRegistration: settings.features.userRegistration,
			userLogin: settings.features.userLogin,
			videoCalls: settings.features.videoCalls
		});
	} catch (error) {
		console.log("Error in public settings route", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

// Protected admin routes
router.get("/profile", protectAdminRoute, getAdminProfile);
router.put("/profile", protectAdminRoute, updateAdminProfile);
router.put("/password", protectAdminRoute, changeAdminPassword);
router.get("/stats", protectAdminRoute, requirePermission("viewAnalytics"), getSystemStats);
router.get("/health", protectAdminRoute, getSystemHealth);
router.get("/settings", protectAdminRoute, getSystemSettings);
router.put("/settings", protectAdminRoute, updateSystemSettings);

// User management routes (require specific permissions)
router.get("/users", protectAdminRoute, requirePermission("viewAllUsers"), getAllUsers);
router.get("/users/:userId", protectAdminRoute, requirePermission("viewAllUsers"), getUserDetails);
router.put("/users/:userId", protectAdminRoute, requirePermission("editAccounts"), updateUserProfile);
router.put("/users/:userId/password", protectAdminRoute, requirePermission("editAccounts"), changeUserPassword);
router.post("/users/:userId/profile-pic", protectAdminRoute, requirePermission("editAccounts"), profilePicUpload, uploadUserProfilePic);
router.delete("/users/:userId", protectAdminRoute, requirePermission("deleteAccounts"), deleteUser);
router.delete("/users", protectAdminRoute, requirePermission("deleteAccounts"), deleteMultipleUsers);

// Secure delete confirmation routes
router.post("/request-delete-otp", protectAdminRoute, requirePermission("deleteAccounts"), requestDeleteConfirmationOtp);
router.post("/verify-delete-otp", protectAdminRoute, requirePermission("deleteAccounts"), verifyDeleteConfirmationOtp);
router.post("/confirm-delete", protectAdminRoute, requirePermission("deleteAccounts"), confirmDeleteUsers);

// Broadcast message routes
router.post("/broadcast-message", protectAdminRoute, requirePermission("sendNotifications"), broadcastMessage);
router.get("/broadcast-history", protectAdminRoute, requirePermission("sendNotifications"), getBroadcastHistory);
router.delete("/broadcast/:broadcastId", protectAdminRoute, requirePermission("sendNotifications"), deleteBroadcast);

// Debug routes
router.post("/clear-online-users", protectAdminRoute, clearOnlineUsers);

export default router; 