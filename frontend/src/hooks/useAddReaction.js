import { useState } from "react";
import toast from "react-hot-toast";

const useAddReaction = () => {
	const [loading, setLoading] = useState(false);

	const addReaction = async (messageId, emoji) => {
		setLoading(true);
		try {
			const res = await fetch(`/api/messages/${messageId}/reactions`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ emoji }),
			});

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}

			return data;
		} catch (error) {
			toast.error(error.message);
			return null;
		} finally {
			setLoading(false);
		}
	};

	return { loading, addReaction };
};
export default useAddReaction; 