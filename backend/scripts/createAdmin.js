import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/admin.model.js";

dotenv.config();

const createSuperAdmin = async () => {
	try {
		await mongoose.connect(process.env.MONGO_DB_URI);
		console.log("Connected to MongoDB");

		// Check if super admin already exists
		const existingAdmin = await Admin.findOne({ role: "super_admin" });
		if (existingAdmin) {
			console.log("Super admin already exists:", existingAdmin.username);
			process.exit(0);
		}

		// Create super admin
		const superAdmin = new Admin({
			username: "superadmin",
			email: "admin@engagesphere.com",
			password: "admin123456",
			role: "super_admin",
			permissions: {
				deleteAccounts: true,
				viewAllUsers: true,
				manageAdmins: true,
				viewAnalytics: true
			}
		});

		await superAdmin.save();
		console.log("✅ Super admin created successfully!");
		console.log("Username: superadmin");
		console.log("Email: admin@engagesphere.com");
		console.log("Password: admin123456");
		console.log("\n⚠️  IMPORTANT: Change the password after first login!");

		process.exit(0);
	} catch (error) {
		console.error("Error creating super admin:", error);
		process.exit(1);
	}
};

createSuperAdmin(); 