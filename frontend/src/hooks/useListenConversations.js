import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";

const useListenConversations = () => {
	const { socket } = useSocketContext();

	useEffect(() => {
		if (!socket) return;

		// Listen for messages being read to refresh conversations
		const handleMessagesRead = () => {
			// For read status changes, we still need a full refresh since unread count changes
			window.dispatchEvent(new CustomEvent('refreshConversations'));
		};

		socket.on("messagesRead", handleMessagesRead);

		return () => {
			socket.off("messagesRead", handleMessagesRead);
		};
	}, [socket]);
};

export default useListenConversations; 