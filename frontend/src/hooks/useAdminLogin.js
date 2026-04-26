import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext.jsx";
import { apiPost } from "../config/api";

// Two-step admin login: credentials → OTP. Returns helpers + state. The
// component owns input fields and renders; this hook owns network + flow.
const useAdminLogin = () => {
	const [loading, setLoading] = useState(false);
	const [otpLoading, setOtpLoading] = useState(false);
	const [error, setError] = useState("");
	const [showOtpInput, setShowOtpInput] = useState(false);
	const [email, setEmail] = useState("");

	const navigate = useNavigate();
	const { setAdmin } = useAuthContext();

	const submitCredentials = async (username, password) => {
		setLoading(true);
		setError("");
		try {
			const data = await apiPost("/api/admin/login", { username, password });
			if (data?.requiresOtp) {
				setShowOtpInput(true);
				setEmail(data.email || "");
				return;
			}
			setAdmin(data);
			navigate("/admin/dashboard");
		} catch (err) {
			setError(err.message || "An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const submitOtp = async (username, otp) => {
		setOtpLoading(true);
		setError("");
		try {
			const data = await apiPost("/api/admin/verify-login-otp", { username, otp });
			setAdmin(data);
			navigate("/admin/dashboard");
		} catch (err) {
			setError(err.message || "An error occurred. Please try again.");
		} finally {
			setOtpLoading(false);
		}
	};

	const backToLogin = () => {
		setShowOtpInput(false);
		setError("");
	};

	return {
		loading,
		otpLoading,
		error,
		showOtpInput,
		email,
		submitCredentials,
		submitOtp,
		backToLogin,
		setError,
	};
};

export default useAdminLogin;
