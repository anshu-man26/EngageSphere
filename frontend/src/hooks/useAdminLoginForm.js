import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAdminLogin from "./useAdminLogin";

const useAdminLoginForm = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [otp, setOtp] = useState("");
	const navigate = useNavigate();

	const {
		loading,
		otpLoading,
		error,
		showOtpInput,
		email,
		submitCredentials,
		submitOtp,
		backToLogin,
	} = useAdminLogin();

	const handleUsernameChange = (e) => setUsername(e.target.value);
	const handlePasswordChange = (e) => setPassword(e.target.value);
	const handleOtpChange = (e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
	const goHome = () => navigate("/");
	const goForgotPassword = () => navigate("/admin/forgot-password");

	const handleSubmit = (e) => {
		e.preventDefault();
		submitCredentials(username, password);
	};
	const handleOtpSubmit = (e) => {
		e.preventDefault();
		submitOtp(username, otp);
	};
	const handleBackToLogin = () => {
		setOtp("");
		backToLogin();
	};

	return {
		username,
		password,
		otp,
		loading,
		otpLoading,
		error,
		showOtpInput,
		email,
		handleUsernameChange,
		handlePasswordChange,
		handleOtpChange,
		handleSubmit,
		handleOtpSubmit,
		handleBackToLogin,
		goHome,
		goForgotPassword,
	};
};

export default useAdminLoginForm;
