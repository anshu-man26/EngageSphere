import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const useChangeUsername = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser } = useAuthContext();

	const changeUsername = async (newUsername) => {
		setLoading(true);
		try {
			const res = await fetch("/api/users/change-username", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ newUsername }),
			});

			const data = await res.json();

			if (data.error) {
				throw new Error(data.error);
			}

			// Update auth context with new user data
			setAuthUser(data.user);
			toast.success("Username changed successfully!");
			return true;
		} catch (error) {
			toast.error(error.message);
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { loading, changeUsername };
};

export default useChangeUsername; 