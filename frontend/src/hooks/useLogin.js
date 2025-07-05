import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const useLogin = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser } = useAuthContext();
	const navigate = useNavigate();

	const login = async (email, password, otp = null) => {
		const success = handleInputErrors(email, password);
		if (!success) return;
		setLoading(true);
		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ email, password, otp }),
			});

			const data = await res.json();
			if (data.error) {
				// Check if user needs email verification
				if (data.needsVerification) {
					toast.error(data.error);
					navigate("/verify-signup", { state: { email } });
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

function handleInputErrors(email, password) {
	if (!email || !password) {
		toast.error("Please fill in all fields");
		return false;
	}

	return true;
}
