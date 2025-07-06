import { useState } from "react";
import toast from "react-hot-toast";

const usePrivacySettings = () => {
	const [loading, setLoading] = useState(false);

	const updateEmailVisibility = async (emailVisible) => {
		setLoading(true);
		try {
			const res = await fetch("/api/users/privacy-settings", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ emailVisible }),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Failed to update privacy settings");
			}

			toast.success("Privacy settings updated successfully");
			return data.user;
		} catch (error) {
			console.error("Error updating privacy settings:", error);
			toast.error(error.message);
			return null;
		} finally {
			setLoading(false);
		}
	};

	return {
		updateEmailVisibility,
		loading,
	};
};

export default usePrivacySettings; 