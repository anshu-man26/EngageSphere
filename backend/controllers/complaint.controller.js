import Complaint from "../models/complaint.model.js";
import User from "../models/user.model.js";

// Submit a new complaint (public route)
export const submitComplaint = async (req, res) => {
	try {
		const { subject, message, category, priority, name, email } = req.body;
		const userId = req.user?._id; // Will be null for anonymous users

		// Validate required fields
		if (!subject || !message) {
			return res.status(400).json({ error: "Subject and message are required" });
		}

		// Validate subject length
		if (subject.length > 200) {
			return res.status(400).json({ error: "Subject must be less than 200 characters" });
		}

		// Validate message length
		if (message.length > 2000) {
			return res.status(400).json({ error: "Message must be less than 2000 characters" });
		}

		// Create complaint object
		const complaintData = {
			subject: subject.trim(),
			message: message.trim(),
			category: category || "general",
			priority: priority || "medium",
			userAgent: req.headers["user-agent"] || "",
			ipAddress: req.ip || req.connection.remoteAddress || "",
			pageSubmitted: req.headers.referer || "unknown"
		};

		// Add user information
		if (userId) {
			complaintData.userId = userId;
		} else {
			// For anonymous users, require name and email
			if (!name || !email) {
				return res.status(400).json({ error: "Name and email are required for anonymous complaints" });
			}
			
			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				return res.status(400).json({ error: "Please enter a valid email address" });
			}

			complaintData.anonymousUser = {
				name: name.trim(),
				email: email.toLowerCase().trim()
			};
		}

		// Create and save complaint
		const complaint = new Complaint(complaintData);
		await complaint.save();

		console.log(`New complaint submitted: ${complaint._id} by ${userId ? 'user' : 'anonymous'}`);

		res.status(201).json({
			message: "Complaint submitted successfully",
			complaintId: complaint._id
		});
	} catch (error) {
		console.log("Error in submitComplaint controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Get all complaints (admin only)
export const getAllComplaints = async (req, res) => {
	try {
		const { page = 1, limit = 20, status, category, priority, search } = req.query;
		const skip = (page - 1) * limit;

		// Build filter object
		const filter = {};
		if (status) filter.status = status;
		if (category) filter.category = category;
		if (priority) filter.priority = priority;
		if (search) {
			filter.$or = [
				{ subject: { $regex: search, $options: "i" } },
				{ message: { $regex: search, $options: "i" } },
				{ "anonymousUser.name": { $regex: search, $options: "i" } },
				{ "anonymousUser.email": { $regex: search, $options: "i" } }
			];
		}

		// Get complaints with pagination
		const complaints = await Complaint.find(filter)
			.populate("userId", "username email fullName")
			.populate("adminResponse.respondedBy", "username")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit));

		// Get total count for pagination
		const total = await Complaint.countDocuments(filter);

		// Get status counts for dashboard
		const statusCounts = await Complaint.aggregate([
			{ $group: { _id: "$status", count: { $sum: 1 } } }
		]);

		const statusStats = {};
		statusCounts.forEach(item => {
			statusStats[item._id] = item.count;
		});

		res.status(200).json({
			complaints,
			total,
			totalPages: Math.ceil(total / limit),
			currentPage: parseInt(page),
			statusStats
		});
	} catch (error) {
		console.log("Error in getAllComplaints controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Get single complaint (admin only)
export const getComplaint = async (req, res) => {
	try {
		const { complaintId } = req.params;

		const complaint = await Complaint.findById(complaintId)
			.populate("userId", "username email fullName")
			.populate("adminResponse.respondedBy", "username");

		if (!complaint) {
			return res.status(404).json({ error: "Complaint not found" });
		}

		res.status(200).json(complaint);
	} catch (error) {
		console.log("Error in getComplaint controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Update complaint status (admin only)
export const updateComplaintStatus = async (req, res) => {
	try {
		const { complaintId } = req.params;
		const { status, priority } = req.body;
		const adminId = req.admin._id;

		if (!status && !priority) {
			return res.status(400).json({ error: "Status or priority is required" });
		}

		const updateData = {};
		if (status) updateData.status = status;
		if (priority) updateData.priority = priority;

		const complaint = await Complaint.findByIdAndUpdate(
			complaintId,
			updateData,
			{ new: true, runValidators: true }
		).populate("userId", "username email fullName");

		if (!complaint) {
			return res.status(404).json({ error: "Complaint not found" });
		}

		console.log(`Admin ${req.admin.username} updated complaint ${complaintId} status to ${status}`);

		res.status(200).json({
			message: "Complaint updated successfully",
			complaint
		});
	} catch (error) {
		console.log("Error in updateComplaintStatus controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Respond to complaint (admin only)
export const respondToComplaint = async (req, res) => {
	try {
		const { complaintId } = req.params;
		const { message } = req.body;
		const adminId = req.admin._id;

		if (!message || message.trim().length === 0) {
			return res.status(400).json({ error: "Response message is required" });
		}

		if (message.length > 2000) {
			return res.status(400).json({ error: "Response message must be less than 2000 characters" });
		}

		const complaint = await Complaint.findByIdAndUpdate(
			complaintId,
			{
				adminResponse: {
					message: message.trim(),
					respondedBy: adminId,
					respondedAt: new Date()
				},
				status: "resolved" // Auto-resolve when admin responds
			},
			{ new: true, runValidators: true }
		).populate("userId", "username email fullName")
		 .populate("adminResponse.respondedBy", "username");

		if (!complaint) {
			return res.status(404).json({ error: "Complaint not found" });
		}

		console.log(`Admin ${req.admin.username} responded to complaint ${complaintId}`);

		res.status(200).json({
			message: "Response sent successfully",
			complaint
		});
	} catch (error) {
		console.log("Error in respondToComplaint controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Delete complaint (admin only)
export const deleteComplaint = async (req, res) => {
	try {
		const { complaintId } = req.params;

		const complaint = await Complaint.findByIdAndDelete(complaintId);

		if (!complaint) {
			return res.status(404).json({ error: "Complaint not found" });
		}

		console.log(`Admin ${req.admin.username} deleted complaint ${complaintId}`);

		res.status(200).json({
			message: "Complaint deleted successfully"
		});
	} catch (error) {
		console.log("Error in deleteComplaint controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Get complaint statistics (admin only)
export const getComplaintStats = async (req, res) => {
	try {
		const stats = await Complaint.aggregate([
			{
				$group: {
					_id: null,
					total: { $sum: 1 },
					pending: {
						$sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
					},
					inProgress: {
						$sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
					},
					resolved: {
						$sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
					},
					closed: {
						$sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] }
					}
				}
			}
		]);

		// Get complaints by category
		const categoryStats = await Complaint.aggregate([
			{
				$group: {
					_id: "$category",
					count: { $sum: 1 }
				}
			},
			{ $sort: { count: -1 } }
		]);

		// Get complaints by priority
		const priorityStats = await Complaint.aggregate([
			{
				$group: {
					_id: "$priority",
					count: { $sum: 1 }
				}
			},
			{ $sort: { count: -1 } }
		]);

		// Get recent complaints (last 7 days)
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const recentComplaints = await Complaint.countDocuments({
			createdAt: { $gte: sevenDaysAgo }
		});

		res.status(200).json({
			overview: stats[0] || {
				total: 0,
				pending: 0,
				inProgress: 0,
				resolved: 0,
				closed: 0
			},
			categoryStats,
			priorityStats,
			recentComplaints
		});
	} catch (error) {
		console.log("Error in getComplaintStats controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
}; 