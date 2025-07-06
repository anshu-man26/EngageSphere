import { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useGetMessages = () => {
	const [loading, setLoading] = useState(false);
	const { messages, setMessages, selectedConversation } = useConversation();

	useEffect(() => {
		const getMessages = async () => {
			if (!selectedConversation?._id) {
				setMessages([]);
				return;
			}

			setLoading(true);
			try {
				const userToChatId = selectedConversation.participant?._id || selectedConversation._id;
				
				const res = await fetch(`/api/messages/${userToChatId}`, {
					credentials: "include"
				});
				
				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status}`);
				}
				
				const data = await res.json();
				
				if (data.error) throw new Error(data.error);
				
				// Ensure data is an array
				const messagesArray = Array.isArray(data) ? data : [];
				setMessages(messagesArray);
			} catch (error) {
				console.error("Error fetching messages:", error);
				toast.error(error.message || "Failed to load messages");
				setMessages([]);
			} finally {
				setLoading(false);
			}
		};

		getMessages();
	}, [selectedConversation?._id, selectedConversation?.participant?._id, setMessages]);

	// Ensure we always return an array
	const safeMessages = Array.isArray(messages) ? messages : [];
	
	return { messages: safeMessages, loading };
};
export default useGetMessages;
