import { useState } from "react";
import useAdminPasswordRecovery from "./useAdminPasswordRecovery";

const useAdminForgotPasswordForm = () => {
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [emailSent, setEmailSent] = useState(false);
	const { loading, sendOtp } = useAdminPasswordRecovery();

	const handleEmailChange = (e) => setEmail(e.target.value);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setMessage("");
		const result = await sendOtp(email);
		if (result.ok) {
			setMessage(result.message);
			setEmailSent(true);
		} else {
			setError(result.message);
		}
	};

	return {
		email,
		message,
		error,
		emailSent,
		loading,
		handleEmailChange,
		handleSubmit,
	};
};

export default useAdminForgotPasswordForm;
