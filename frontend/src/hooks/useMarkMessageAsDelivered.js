import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";

const useMarkMessageAsDelivered = () => {
	const [loading, setLoading] = useState(false);
	const { authUser } = useAuthContext();

	const markAsDelivered = async (messageId) => {
		if (!authUser) return false;
		
		setLoading(true);
		try {
			const res = await fetch(`/api/messages/${messageId}/delivered`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			});

			const data = await res.json();
			if (data.error) {
				console.error("Error marking message as delivered:", data.error);
				return false;
			}

			return true;
		} catch (error) {
			console.error("Error marking message as delivered:", error);
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { markAsDelivered, loading };
};

export default useMarkMessageAsDelivered; 