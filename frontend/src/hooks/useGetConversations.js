import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

const useGetConversations = () => {
	const [loading, setLoading] = useState(false);
	const [conversations, setConversations] = useState([]);

	const getConversations = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/users/conversations", {
				credentials: "include"
			});
			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}
			setConversations(data);
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		getConversations();

		// Listen for refresh events
		const handleRefresh = () => {
			getConversations();
		};

		window.addEventListener('refreshConversations', handleRefresh);

		return () => {
			window.removeEventListener('refreshConversations', handleRefresh);
		};
	}, [getConversations]);

	return { loading, conversations, setConversations, getConversations };
};
export default useGetConversations;
