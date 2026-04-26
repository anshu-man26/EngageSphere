import { useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";
import { apiPost, apiPut } from "../config/api";

const useChatBackground = () => {
	const [loading, setLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const { updateConversationBackground } = useConversation();

	const updateChatBackground = async (conversationId, backgroundImage) => {
		if (!conversationId) {
			toast.error("Conversation ID is required");
			return false;
		}
		setLoading(true);
		try {
			await apiPut("/api/users/chat-background", { conversationId, backgroundImage });
			updateConversationBackground(conversationId, backgroundImage);
			toast.success("Chat background updated successfully!");
			return true;
		} catch (err) {
			toast.error(err.message);
			return false;
		} finally {
			setLoading(false);
		}
	};

	const uploadBackground = async (file) => {
		if (!file) return null;
		setUploading(true);
		try {
			const fd = new FormData();
			fd.append("backgroundImage", file);
			const data = await apiPost("/api/users/upload-background", fd);
			return data?.backgroundUrl || null;
		} catch (err) {
			toast.error(err.message || "Failed to upload background image");
			return null;
		} finally {
			setUploading(false);
		}
	};

	return { loading, uploading, updateChatBackground, uploadBackground };
};

export default useChatBackground; 