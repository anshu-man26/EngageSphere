import nodemailer from "nodemailer";

let transporter = null;

// Function to create transporter when needed
const createTransporter = () => {
	if (transporter) return transporter;

	// Validate environment variables
	if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
		console.error("❌ Email configuration missing!");
	
		return null;
	}

	transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
		debug: true, // Enable debug output
		logger: true, // Log to console
	});

	// Verify transporter configuration
	transporter.verify(function(error, success) {
		if (error) {
			console.error("❌ Nodemailer configuration error:", error.message);
			console.error("Please check your EMAIL_USER and EMAIL_PASS in .env file");
		} else {
			console.log("✅ Nodemailer configured successfully");
			console.log("📧 Email user:", process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}...` : "Missing");
		}
	});

	return transporter;
};

// Export a function that returns the transporter
export default createTransporter; 