import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAdminPasswordRecovery from "./useAdminPasswordRecovery";

const useAdminVerifyOtpForm = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [step, setStep] = useState("verify"); // "verify" | "reset"
	const { loading, verifyOtp, resetPassword } = useAdminPasswordRecovery();

	useEffect(() => {
		if (location.state?.email) {
			setEmail(location.state.email);
		} else {
			navigate("/admin/forgot-password");
		}
	}, [location.state, navigate]);

	const handleOtpChange = (e) => setOtp(e.target.value);
	const handleNewPasswordChange = (e) => setNewPassword(e.target.value);
	const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);
	const togglePassword = () => setShowPassword((v) => !v);
	const toggleConfirmPassword = () => setShowConfirmPassword((v) => !v);

	const handleVerifyOtp = async (e) => {
		e.preventDefault();
		setError("");
		setMessage("");
		const result = await verifyOtp(email, otp);
		if (result.ok) {
			setMessage(result.message);
			setStep("reset");
		} else {
			setError(result.message);
		}
	};

	const handleResetPassword = async (e) => {
		e.preventDefault();
		setError("");
		setMessage("");
		const result = await resetPassword(email, newPassword, confirmPassword);
		if (result.ok) {
			setMessage(result.message);
			setTimeout(() => navigate("/admin/login"), 2000);
		} else {
			setError(result.message);
		}
	};

	return {
		email,
		otp,
		newPassword,
		confirmPassword,
		showPassword,
		showConfirmPassword,
		message,
		error,
		step,
		loading,
		handleOtpChange,
		handleNewPasswordChange,
		handleConfirmPasswordChange,
		togglePassword,
		toggleConfirmPassword,
		handleVerifyOtp,
		handleResetPassword,
	};
};

export default useAdminVerifyOtpForm;
