import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";

const protectAdminRoute = async (req, res, next) => {
	try {
		const token = req.cookies.admin_jwt;

		if (!token) {
			return res.status(401).json({ error: "Unauthorized - Admin token required" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		if (!decoded || !decoded.adminId) {
			return res.status(401).json({ error: "Unauthorized - Invalid admin token" });
		}

		const admin = await Admin.findById(decoded.adminId).select("-password");

		if (!admin) {
			return res.status(404).json({ error: "Admin not found" });
		}

		if (!admin.isActive) {
			return res.status(403).json({ error: "Admin account is deactivated" });
		}

		req.admin = admin;
		next();
	} catch (error) {
		console.log("Error in protectAdminRoute middleware: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// Middleware to check specific permissions
const requirePermission = (permission) => {
	return (req, res, next) => {
		if (!req.admin) {
			return res.status(401).json({ error: "Admin authentication required" });
		}

		if (!req.admin.hasPermission(permission)) {
			return res.status(403).json({ 
				error: "Insufficient permissions",
				requiredPermission: permission,
				adminRole: req.admin.role
			});
		}

		next();
	};
};

export { protectAdminRoute, requirePermission }; 