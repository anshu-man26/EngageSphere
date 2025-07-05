import { useState } from "react";
import { useAuthContext } from "../context/AuthContext.jsx";

const useDeleteAccount = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser } = useAuthContext();

	const deleteAccount = async (otp) => {
		setLoading(true);
		try {
			const res = await fetch("/api/users/delete-account", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ otp }),
			});

			const data = await res.json();

			if (data.error) {
				throw new Error(data.error);
			}

			// Clear auth user and redirect to login
			setAuthUser(null);
			localStorage.removeItem("chat-user");
			
			return { success: true, message: data.message };
		} catch (error) {
			return { success: false, error: error.message };
		} finally {
			setLoading(false);
		}
	};

	return { loading, deleteAccount };
};

export default useDeleteAccount; 