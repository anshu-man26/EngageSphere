import { useCallback, useState } from "react";
import { useAuthContext } from "../context/AuthContext";

const useMarkMessageAsRead = () => {
	const [loading, setLoading] = useState(false);
	const { authUser } = useAuthContext();

	// useCallback so the function identity stays stable across renders.
	// Otherwise consumers that put it in a useEffect dep array re-run their
	// effect on every render of this hook (the `loading` state churns).
	const markAsRead = useCallback(
		async (messageId) => {
			if (!authUser) return false;
			setLoading(true);
			try {
				const res = await fetch(`/api/messages/${messageId}/read`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
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
		},
		[authUser],
	);

	const markMultipleAsRead = useCallback(
		async (messageIds) => {
			if (!authUser || !messageIds || messageIds.length === 0) return false;
			setLoading(true);
			try {
				const res = await fetch(`/api/messages/read/multiple`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
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
		},
		[authUser],
	);

	return { markAsRead, markMultipleAsRead, loading };
};

export default useMarkMessageAsRead;
