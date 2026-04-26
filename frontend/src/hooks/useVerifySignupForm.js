import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext.jsx";
import useVerifySignupOtp from "./useVerifySignupOtp";
import useSendSignupOtp from "./useSendSignupOtp";

const useVerifySignupForm = () => {
	const [otp, setOtp] = useState("");
	const [error, setError] = useState("");
	const navigate = useNavigate();
	const location = useLocation();
	const { setAuthUser } = useAuthContext();
	const { loading: verifying, verifyOtp } = useVerifySignupOtp();
	const { loading: resending, sendOtp } = useSendSignupOtp();

	const email = location.state?.email || new URLSearchParams(location.search).get("email");
	const loading = verifying || resending;

	const handleOtpChange = (e) => setOtp(e.target.value);
	const goSignup = () => navigate("/signup");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		const result = await verifyOtp(email, otp);
		if (!result.success) {
			setError(result.error);
			return;
		}
		if (result.user) setAuthUser(result.user);
		navigate("/");
	};

	const handleResendOTP = async () => {
		setError("");
		await sendOtp(email);
	};

	return {
		otp,
		error,
		email,
		loading,
		handleOtpChange,
		handleSubmit,
		handleResendOTP,
		goSignup,
	};
};

export default useVerifySignupForm;
