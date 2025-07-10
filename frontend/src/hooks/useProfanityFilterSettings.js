import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

const useProfanityFilterSettings = () => {
	const [loading, setLoading] = useState(false);
	const { authUser, setAuthUser } = useAuthContext();

	const updateProfanityFilterSettings = async (profanityFilterEnabled) => {
		setLoading(true);
		try {
			const res = await fetch(`/api/users/profanity-filter-settings`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ profanityFilterEnabled }),
			});

			const data = await res.json();

			if (data.error) {
				throw new Error(data.error);
			}

			// Update auth user with new settings
			setAuthUser({
				...authUser,
				profanityFilterEnabled: data.profanityFilterEnabled
			});

			toast.success(data.message);
			return data;
		} catch (error) {
			console.error("Error updating profanity filter settings:", error);
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	return { loading, updateProfanityFilterSettings };
};

export default useProfanityFilterSettings; 