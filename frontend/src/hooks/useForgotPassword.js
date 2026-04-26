import { useState } from "react";
import toast from "react-hot-toast";
import { apiPost } from "../config/api";

// Three-step forgot-password flow: request OTP → verify OTP → reset password.
// Each call returns `true` on success and `false` on failure (after toasting
// the error). The component owns step state and inputs; this hook owns
// network + validation only.
const useForgotPassword = () => {
	const [loading, setLoading] = useState(false);

	const sendOtp = async (email) => {
		const trimmed = email?.trim();
		if (!trimmed) {
			toast.error("Please enter your email address");
			return false;
		}
		const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRe.test(trimmed)) {
			toast.error("Please enter a valid email address");
			return false;
		}
		setLoading(true);
		try {
			await apiPost("/api/auth/send-otp", { email: trimmed });
			toast.success("OTP sent successfully!");
			return true;
		} catch (err) {
			toast.error(err.message);
			return false;
		} finally {
			setLoading(false);
		}
	};

	const verifyOtp = async (email, otp) => {
		const trimmedOtp = otp?.trim();
		if (!trimmedOtp) {
			toast.error("Please enter the OTP");
			return false;
		}
		if (trimmedOtp.length !== 6) {
			toast.error("OTP must be 6 digits");
			return false;
		}
		setLoading(true);
		try {
			await apiPost("/api/auth/verify-otp", { email: email.trim(), otp: trimmedOtp });
			toast.success("OTP verified successfully!");
			return true;
		} catch (err) {
			toast.error(err.message);
			return false;
		} finally {
			setLoading(false);
		}
	};

	const resetPassword = async (email, newPassword, confirmPassword) => {
		if (!newPassword || !confirmPassword) {
			toast.error("Please fill in all fields");
			return false;
		}
		if (newPassword.length < 6) {
			toast.error("Password must be at least 6 characters");
			return false;
		}
		if (newPassword !== confirmPassword) {
			toast.error("Passwords do not match");
			return false;
		}
		setLoading(true);
		try {
			await apiPost("/api/auth/reset-password", { email: email.trim(), newPassword });
			toast.success("Password reset successfully!");
			return true;
		} catch (err) {
			toast.error(err.message);
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { loading, sendOtp, verifyOtp, resetPassword };
};

export default useForgotPassword;
