import { useState } from "react";
import { toast } from "react-hot-toast";

const useSendSignupOtp = () => {
	const [loading, setLoading] = useState(false);

	const sendOtp = async (email) => {
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			toast.error("Please enter a valid email address");
			return { success: false, error: "Invalid email address" };
		}

		setLoading(true);
		try {
			const res = await fetch("/api/auth/send-signup-otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await res.json();

			if (data.error) {
				return { success: false, error: data.error };
			}

			toast.success("OTP sent to your email!");
			return { success: true, message: data.message };
		} catch (error) {
			toast.error(error.message);
			return { success: false, error: error.message };
		} finally {
			setLoading(false);
		}
	};

	return { loading, sendOtp };
};

export default useSendSignupOtp; 