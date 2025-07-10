import { useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";

const useUploadFile = () => {
	const [loading, setLoading] = useState(false);
	const { selectedConversation, addMessage, addUploadingFile, removeUploadingFile } = useConversation();

	// Mobile detection
	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

	const uploadFile = async (file, message = "") => {
		if (!file) {
			toast.error("Please select a file");
			return;
		}

		if (!selectedConversation) {
			toast.error("Please select a conversation");
			return;
		}

		// Validate file type
		const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
		const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
		
		if (!allowedImageTypes.includes(file.type) && !allowedDocTypes.includes(file.type)) {
			toast.error("File type not supported. Please select an image or document.");
			return;
		}

		// Validate file size (10MB)
		if (file.size > 10 * 1024 * 1024) {
			toast.error("File size must be less than 10MB");
			return;
		}

		// Add file to uploading state
		const uploadingFileId = addUploadingFile(file);
		
		setLoading(true);
		try {
			const formData = new FormData();
			formData.append('file', file);
			if (message) {
				formData.append('message', message);
			}

			// Use the participant's user ID instead of conversation ID
			const userToChatId = selectedConversation.participant?._id || selectedConversation._id;
			
			const res = await fetch(`/api/messages/upload/${userToChatId}`, {
				method: "POST",
				credentials: "include",
				body: formData,
			});

			const data = await res.json();
			
			if (data.error) {
				throw new Error(data.error);
			}
			
			// Remove from uploading state and add to messages
			removeUploadingFile(uploadingFileId);
			addMessage(data);
			return data;
		} catch (error) {
			// Remove from uploading state on error
			removeUploadingFile(uploadingFileId);
			
			// Provide mobile-specific error messages
			if (isMobile) {
				if (error.message.includes('Network') || error.message.includes('fetch')) {
					toast.error("Network error. Please check your connection and try again.");
				} else if (error.message.includes('file')) {
					toast.error("File upload failed. Please try selecting the file again.");
				} else {
					toast.error(error.message || "Upload failed. Please try again.");
				}
			} else {
				toast.error(error.message);
			}
			return null;
		} finally {
			setLoading(false);
		}
	};

	return { loading, uploadFile };
};

export default useUploadFile; 