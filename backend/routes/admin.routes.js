import express from "express";
import {
	adminLogin,
	adminLogout,
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
	getSystemStats,
	clearOnlineUsers
} from "../controllers/admin.controller.js";
import { protectAdminRoute, requirePermission } from "../middleware/protectAdminRoute.js";

const router = express.Router();

// Public admin routes
router.post("/login", adminLogin);
router.post("/logout", adminLogout);

// Admin password recovery routes (public)
router.post("/forgot-password", requestAdminPasswordReset);
router.post("/verify-otp", verifyAdminPasswordResetOtp);
router.post("/reset-password", resetAdminPassword);

// Protected admin routes
router.get("/profile", protectAdminRoute, getAdminProfile);
router.put("/profile", protectAdminRoute, updateAdminProfile);
router.put("/password", protectAdminRoute, changeAdminPassword);
router.get("/stats", protectAdminRoute, requirePermission("viewAnalytics"), getSystemStats);

// User management routes (require specific permissions)
router.get("/users", protectAdminRoute, requirePermission("viewAllUsers"), getAllUsers);
router.delete("/users/:userId", protectAdminRoute, requirePermission("deleteAccounts"), deleteUser);
router.delete("/users", protectAdminRoute, requirePermission("deleteAccounts"), deleteMultipleUsers);

// Secure delete confirmation routes
router.post("/request-delete-otp", protectAdminRoute, requirePermission("deleteAccounts"), requestDeleteConfirmationOtp);
router.post("/verify-delete-otp", protectAdminRoute, requirePermission("deleteAccounts"), verifyDeleteConfirmationOtp);
router.post("/confirm-delete", protectAdminRoute, requirePermission("deleteAccounts"), confirmDeleteUsers);

// Debug routes
router.post("/clear-online-users", protectAdminRoute, clearOnlineUsers);

export default router; 