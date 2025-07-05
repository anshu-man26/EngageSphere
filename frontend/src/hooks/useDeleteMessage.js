import { useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";

const useDeleteMessage = () => {
	const [loading, setLoading] = useState(false);
	const { selectedConversation, removeMessage } = useConversation();

	const deleteMessage = async (messageId, deleteForEveryone = false) => {
		if (!messageId || !selectedConversation) return;

		setLoading(true);
		try {
			const res = await fetch(`/api/messages/${messageId}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ deleteForEveryone }),
			});

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}

			// Remove message from conversation state
			removeMessage(messageId);
			
			toast.success(deleteForEveryone ? "Message deleted for everyone" : "Message deleted for you");
			return data;
		} catch (error) {
			toast.error(error.message);
			return null;
		} finally {
			setLoading(false);
		}
	};

	return { loading, deleteMessage };
};

export default useDeleteMessage; 