import { useState } from "react";
import useSendMessage from "./useSendMessage";
import { toast } from "react-hot-toast";

const useSendGif = () => {
	const [loading, setLoading] = useState(false);
	const { sendMessage } = useSendMessage();

	const sendGif = async (gifUrl, gifTitle = "GIF") => {
		setLoading(true);
		try {
			// Create a special GIF message format that can be detected by the Message component
			const gifMessage = `[GIF] ${gifTitle}\n${gifUrl}`;
			await sendMessage(gifMessage);
			return true;
		} catch (error) {
			console.error("Error sending GIF:", error);
			toast.error("Failed to send GIF");
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { loading, sendGif };
};

export default useSendGif; 