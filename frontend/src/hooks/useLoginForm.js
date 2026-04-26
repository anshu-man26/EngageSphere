import { useState } from "react";
import useLogin from "./useLogin";
import useLoginStatus from "./useLoginStatus";

// Owns ALL state and handlers for the login screen so the JSX file is
// pure presentation. Returns a flat bag of values + callbacks the form
// can wire directly into inputs/buttons.
const useLoginForm = () => {
	const [inputs, setInputs] = useState({ username: "", password: "" });
	const [otp, setOtp] = useState("");
	const [needsOTP, setNeedsOTP] = useState(false);
	const [otpSent, setOtpSent] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showComplaintModal, setShowComplaintModal] = useState(false);

	const { loading, login } = useLogin();
	const { loginEnabled, loading: loginStatusLoading } = useLoginStatus();

	const handleUsernameChange = (e) => setInputs((p) => ({ ...p, username: e.target.value }));
	const handlePasswordChange = (e) => setInputs((p) => ({ ...p, password: e.target.value }));
	const handleOtpChange = (e) => setOtp(e.target.value);
	const togglePassword = () => setShowPassword((v) => !v);
	const openComplaint = () => setShowComplaintModal(true);
	const closeComplaint = () => setShowComplaintModal(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (needsOTP) {
			await login(inputs.username, inputs.password, otp);
			return;
		}
		const result = await login(inputs.username, inputs.password);
		if (result?.needsOTP) {
			setNeedsOTP(true);
			setOtpSent(true);
		}
	};

	const handleResendOTP = async () => {
		// Re-trigger the login endpoint so the backend re-mails the OTP.
		const result = await login(inputs.username, inputs.password);
		if (result?.needsOTP) setOtpSent(true);
	};

	const isEmail = inputs.username.includes("@");

	return {
		// values
		inputs,
		otp,
		needsOTP,
		otpSent,
		showPassword,
		showComplaintModal,
		isEmail,
		loading,
		loginEnabled,
		loginStatusLoading,
		// handlers
		handleUsernameChange,
		handlePasswordChange,
		handleOtpChange,
		togglePassword,
		openComplaint,
		closeComplaint,
		handleSubmit,
		handleResendOTP,
	};
};

export default useLoginForm;
