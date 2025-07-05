import { useState } from "react";
import { useAuthContext } from "../context/AuthContext.jsx";

const useRequestDeleteAccountOtp = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser } = useAuthContext();

	const requestOtp = async (password) => {
		setLoading(true);
		try {
			const res = await fetch("/api/users/request-delete-account-otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			});

			const data = await res.json();

			if (data.error) {
				throw new Error(data.error);
			}

			return { success: true, message: data.message };
		} catch (error) {
			return { success: false, error: error.message };
		} finally {
			setLoading(false);
		}
	};

	return { loading, requestOtp };
};

export default useRequestDeleteAccountOtp; 