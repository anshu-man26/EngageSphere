import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const useLogin = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser } = useAuthContext();
	const navigate = useNavigate();

	const login = async (identifier, password, otp = null) => {
		const success = handleInputErrors(identifier, password);
		if (!success) return;
		setLoading(true);
		try {
			// Determine if identifier is email or username
			const isEmail = identifier.includes('@');
			const requestBody = {
				password,
				otp
			};
			
			if (isEmail) {
				requestBody.email = identifier;
			} else {
				requestBody.username = identifier;
			}

			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(requestBody),
			});

			const data = await res.json();
			if (data.error) {
				// Check if user needs email verification
				if (data.needsVerification) {
					toast.error(data.error);
					navigate("/verify-signup", { state: { email: data.email } });
					return;
				}
				throw new Error(data.error);
			}

			// Check if 2FA is required
			if (data.needsOTP) {
				// Return the data so the component can handle showing OTP field
				return data;
			}

			setAuthUser(data);
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	return { loading, login };
};
export default useLogin;

function handleInputErrors(identifier, password) {
	if (!identifier || !password) {
		toast.error("Please fill in all fields");
		return false;
	}

	return true;
}
