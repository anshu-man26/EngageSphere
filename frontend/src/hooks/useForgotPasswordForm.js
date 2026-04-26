import { useState } from "react";
import useForgotPassword from "./useForgotPassword";

// All UI state + handlers for the user-side forgot-password page.
// JSX consumes a flat bag of values and callbacks.
const useForgotPasswordForm = () => {
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [step, setStep] = useState("email"); // "email" | "otp" | "password" | "success"
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const { loading, sendOtp, verifyOtp, resetPassword } = useForgotPassword();

	const handleEmailChange = (e) => setEmail(e.target.value);
	const handleOtpChange = (e) => setOtp(e.target.value.replace(/\D/g, ""));
	const handleNewPasswordChange = (e) => setNewPassword(e.target.value);
	const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);
	const togglePassword = () => setShowPassword((v) => !v);
	const toggleConfirmPassword = () => setShowConfirmPassword((v) => !v);
	const goBackToEmailStep = () => setStep("email");

	const handleSendOTP = async (e) => {
		e.preventDefault();
		if (await sendOtp(email)) setStep("otp");
	};

	const handleVerifyOTP = async (e) => {
		e.preventDefault();
		if (await verifyOtp(email, otp)) setStep("password");
	};

	const handleResetPassword = async (e) => {
		e.preventDefault();
		if (await resetPassword(email, newPassword, confirmPassword)) setStep("success");
	};

	return {
		email,
		otp,
		newPassword,
		confirmPassword,
		step,
		showPassword,
		showConfirmPassword,
		loading,
		handleEmailChange,
		handleOtpChange,
		handleNewPasswordChange,
		handleConfirmPasswordChange,
		togglePassword,
		toggleConfirmPassword,
		goBackToEmailStep,
		handleSendOTP,
		handleVerifyOTP,
		handleResetPassword,
	};
};

export default useForgotPasswordForm;
