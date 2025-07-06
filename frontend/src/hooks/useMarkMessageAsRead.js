import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";

const useMarkMessageAsRead = () => {
	const [loading, setLoading] = useState(false);
	const { authUser } = useAuthContext();

	const markAsRead = async (messageId) => {
		if (!authUser) return false;
		
		setLoading(true);
		try {
			const res = await fetch(`/api/messages/${messageId}/read`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			});

			const data = await res.json();
			if (data.error) {
				console.error("Error marking message as read:", data.error);
				return false;
			}

			return true;
		} catch (error) {
			console.error("Error marking message as read:", error);
			return false;
		} finally {
			setLoading(false);
		}
	};

	const markMultipleAsRead = async (messageIds) => {
		if (!authUser || !messageIds || messageIds.length === 0) return false;
		
		setLoading(true);
		try {
			const res = await fetch(`/api/messages/read/multiple`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ messageIds }),
			});

			const data = await res.json();
			if (data.error) {
				console.error("Error marking messages as read:", data.error);
				return false;
			}

			return true;
		} catch (error) {
			console.error("Error marking messages as read:", error);
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { markAsRead, markMultipleAsRead, loading };
};

export default useMarkMessageAsRead; 