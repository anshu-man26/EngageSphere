import { useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";

const useDeleteMultipleMessages = () => {
	const [loading, setLoading] = useState(false);
	const { selectedConversation, removeMessages } = useConversation();

	const deleteMultipleMessages = async (messageIds, deleteForEveryone = false) => {
		if (!messageIds || messageIds.length === 0 || !selectedConversation) return;

		setLoading(true);
		try {
			const res = await fetch(`/api/messages/multiple`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ messageIds, deleteForEveryone }),
			});

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}

			// Remove messages from conversation state
			removeMessages(messageIds);
			
			toast.success(`${data.deletedCount} message${data.deletedCount > 1 ? 's' : ''} deleted ${deleteForEveryone ? 'for everyone' : 'for you'}`);
			return data;
		} catch (error) {
			toast.error(error.message);
			return null;
		} finally {
			setLoading(false);
		}
	};

	return { loading, deleteMultipleMessages };
};

export default useDeleteMultipleMessages; 