import { useState } from "react";
import { apiPost } from "../config/api";

// Three calls used across AdminForgotPassword and AdminVerifyOtp.
// Each returns { ok: boolean, message?: string } so the component can decide
// what to show — these screens use inline banners instead of toasts.
const useAdminPasswordRecovery = () => {
	const [loading, setLoading] = useState(false);

	const sendOtp = async (email) => {
		setLoading(true);
		try {
			const data = await apiPost("/api/admin/forgot-password", { email });
			return { ok: true, message: data?.message || "OTP sent" };
		} catch (err) {
			return { ok: false, message: err.message };
		} finally {
			setLoading(false);
		}
	};

	const verifyOtp = async (email, otp) => {
		setLoading(true);
		try {
			const data = await apiPost("/api/admin/verify-otp", { email, otp });
			return { ok: true, message: data?.message || "OTP verified" };
		} catch (err) {
			return { ok: false, message: err.message };
		} finally {
			setLoading(false);
		}
	};

	const resetPassword = async (email, newPassword, confirmPassword) => {
		if (newPassword !== confirmPassword) {
			return { ok: false, message: "Passwords do not match" };
		}
		if (newPassword.length < 6) {
			return { ok: false, message: "Password must be at least 6 characters long" };
		}
		setLoading(true);
		try {
			const data = await apiPost("/api/admin/reset-password", { email, newPassword });
			return { ok: true, message: data?.message || "Password reset" };
		} catch (err) {
			return { ok: false, message: err.message };
		} finally {
			setLoading(false);
		}
	};

	return { loading, sendOtp, verifyOtp, resetPassword };
};

export default useAdminPasswordRecovery;
