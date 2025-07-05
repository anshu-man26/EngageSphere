import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const useChangePassword = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser } = useAuthContext();

	const changePassword = async (currentPassword, newPassword) => {
		setLoading(true);
		try {
			const res = await fetch("/api/users/change-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ currentPassword, newPassword }),
			});

			const data = await res.json();

			if (data.error) {
				throw new Error(data.error);
			}

			toast.success("Password changed successfully!");
			return true;
		} catch (error) {
			toast.error(error.message);
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { loading, changePassword };
};

export default useChangePassword; 