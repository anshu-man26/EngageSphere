import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useSendMessage = () => {
	const [loading, setLoading] = useState(false);
	const { addMessage, selectedConversation } = useConversation();

	const sendMessage = async (message) => {
		if (!selectedConversation?._id) {
			toast.error("No conversation selected");
			return;
		}

		if (!message.trim()) {
			toast.error("Message cannot be empty");
			return;
		}
		
		setLoading(true);
		try {
			const userToChatId = selectedConversation.participant?._id || selectedConversation._id;
			
			const res = await fetch(`/api/messages/send/${userToChatId}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ message: message.trim() }),
			});

			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}

			const data = await res.json();
			
			if (data.error) throw new Error(data.error);

			// Use the addMessage helper to safely add the new message
			addMessage(data);
		} catch (error) {
			console.error("Error sending message:", error);
			toast.error(error.message || "Failed to send message");
		} finally {
			setLoading(false);
		}
	};

	return { sendMessage, loading };
};
export default useSendMessage;
