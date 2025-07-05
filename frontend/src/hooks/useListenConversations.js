import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";

const useListenConversations = () => {
	const { socket } = useSocketContext();

	useEffect(() => {
		if (!socket) return;

		// Listen for new messages to refresh conversations
		const handleNewMessage = () => {
			// Trigger a refresh of conversations
			window.dispatchEvent(new CustomEvent('refreshConversations'));
		};

		// Listen for messages being read to refresh conversations
		const handleMessagesRead = () => {
			// Trigger a refresh of conversations
			window.dispatchEvent(new CustomEvent('refreshConversations'));
		};

		socket.on("newMessage", handleNewMessage);
		socket.on("messagesRead", handleMessagesRead);

		return () => {
			socket.off("newMessage", handleNewMessage);
			socket.off("messagesRead", handleMessagesRead);
		};
	}, [socket]);
};

export default useListenConversations; 