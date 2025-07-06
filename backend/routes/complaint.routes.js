import express from "express";
import {
	submitComplaint,
	getAllComplaints,
	getComplaint,
	updateComplaintStatus,
	respondToComplaint,
	deleteComplaint,
	getComplaintStats
} from "../controllers/complaint.controller.js";
import { protectAdminRoute, requirePermission } from "../middleware/protectAdminRoute.js";

const router = express.Router();

// Public routes (no authentication required)
router.post("/submit", submitComplaint);

// Protected admin routes
router.get("/", protectAdminRoute, requirePermission("viewAnalytics"), getAllComplaints);
router.get("/stats", protectAdminRoute, requirePermission("viewAnalytics"), getComplaintStats);
router.get("/:complaintId", protectAdminRoute, requirePermission("viewAnalytics"), getComplaint);
router.put("/:complaintId/status", protectAdminRoute, requirePermission("viewAnalytics"), updateComplaintStatus);
router.post("/:complaintId/respond", protectAdminRoute, requirePermission("viewAnalytics"), respondToComplaint);
router.delete("/:complaintId", protectAdminRoute, requirePermission("viewAnalytics"), deleteComplaint);

export default router; 