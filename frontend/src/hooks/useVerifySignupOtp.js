import { useState } from "react";
import { toast } from "react-hot-toast";

const useVerifySignupOtp = () => {
	const [loading, setLoading] = useState(false);

	const verifyOtp = async (email, otp) => {
		if (!email || !otp) {
			toast.error("Email and OTP are required");
			return { success: false, error: "Email and OTP are required" };
		}

		if (otp.length !== 6) {
			toast.error("Please enter a valid 6-digit OTP");
			return { success: false, error: "Invalid OTP format" };
		}

		setLoading(true);
		try {
			const res = await fetch("/api/auth/verify-signup-otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, otp }),
			});

			const data = await res.json();

			if (data.error) {
				throw new Error(data.error);
			}

			toast.success("Email verified successfully!");
			return { success: true, message: data.message };
		} catch (error) {
			toast.error(error.message);
			return { success: false, error: error.message };
		} finally {
			setLoading(false);
		}
	};

	return { loading, verifyOtp };
};

export default useVerifySignupOtp; 