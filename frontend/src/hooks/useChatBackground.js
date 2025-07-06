import { useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";

const useChatBackground = () => {
	const [loading, setLoading] = useState(false);
	const { updateConversationBackground } = useConversation();

	const updateChatBackground = async (conversationId, backgroundImage) => {
		if (!conversationId) {
			toast.error("Conversation ID is required");
			return false;
		}

		setLoading(true);
		try {
			const res = await fetch("/api/users/chat-background", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ conversationId, backgroundImage }),
			});

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}
			
			// Update the conversation in the store
			updateConversationBackground(conversationId, backgroundImage);
			
			toast.success("Chat background updated successfully!");
			return true;
		} catch (error) {
			toast.error(error.message);
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { loading, updateChatBackground };
};

export default useChatBackground; 