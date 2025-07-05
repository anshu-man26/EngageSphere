import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

const useChangeEmail = () => {
	const [loading, setLoading] = useState(false);
	const [otpLoading, setOtpLoading] = useState(false);
	const { setAuthUser } = useAuthContext();

	// Step 1: Request OTP
	const requestEmailChangeOtp = async (newEmail, currentPassword) => {
		const success = handleInputErrors(newEmail, currentPassword);
		if (!success) return false;
		setLoading(true);
		try {
			const res = await fetch("/api/users/change-email", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ newEmail, currentPassword }),
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			toast.success("OTP sent to new email!");
			return true;
		} catch (error) {
			toast.error(error.message);
			return false;
		} finally {
			setLoading(false);
		}
	};

	// Step 2: Verify OTP
	const verifyOtp = async (otp) => {
		if (!otp || otp.length !== 6) {
			toast.error("Please enter a valid 6-digit OTP");
			return false;
		}
		setOtpLoading(true);
		try {
			const res = await fetch("/api/users/verify-change-email-otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ otp }),
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			setAuthUser(prev => ({ ...prev, email: data.email }));
			toast.success("Email changed successfully!");
			return true;
		} catch (error) {
			toast.error(error.message);
			return false;
		} finally {
			setOtpLoading(false);
		}
	};

	return { loading, otpLoading, requestEmailChangeOtp, verifyOtp };
};

export default useChangeEmail;

function handleInputErrors(newEmail, currentPassword) {
	if (!newEmail || !newEmail.trim() || !currentPassword) {
		toast.error("Please enter a new email and your current password");
		return false;
	}

	// Email validation regex
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(newEmail.trim())) {
		toast.error("Please enter a valid email address");
		return false;
	}

	return true;
} 