import { useEffect, useRef, useState } from "react";
import useGetMessages from "../../hooks/useGetMessages";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import Message from "./Message";
import useListenMessages from "../../hooks/useListenMessages";
import { useAuthContext } from "../../context/AuthContext";
import useConversation from "../../zustand/useConversation";

const Messages = ({ isSelectionMode = false, selectedMessages = new Set(), onMessageSelect = null }) => {
	const { messages, loading } = useGetMessages();
	const { uploadingFiles } = useConversation();
	const { authUser } = useAuthContext();
	const { selectedConversation } = useConversation();
	useListenMessages();
	const lastMessageRef = useRef();
	const [previousMessageCount, setPreviousMessageCount] = useState(0);

	// Ensure messages is always an array
	const messagesArray = Array.isArray(messages) ? messages : [];

	useEffect(() => {
		// Only scroll to bottom when new messages are added (not when reactions are updated)
		const currentMessageCount = messagesArray.length;
		const hasNewMessages = currentMessageCount > previousMessageCount;
		
		if (hasNewMessages || uploadingFiles.length > 0) {
			setTimeout(() => {
				lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
			}, 100);
		}
		
		setPreviousMessageCount(currentMessageCount);
	}, [messagesArray, uploadingFiles, previousMessageCount]);

	// Error handling for invalid messages
	if (!Array.isArray(messagesArray)) {
		console.error("Messages is not an array:", messagesArray);
		return (
			<div className='px-4 flex-1 overflow-auto messages-container'>
				<p className='text-center text-red-400 mt-4'>Error loading messages</p>
			</div>
		);
	}

	return (
		<div className='h-full flex flex-col'>
			{/* Messages container with proper spacing */}
			<div className='px-2 sm:px-4 flex-1 overflow-auto messages-container'>
				{/* Messages content */}
				<div className="pb-4">
					{/* Regular messages */}
					{!loading &&
						messagesArray.length > 0 &&
						messagesArray.map((message, index) => {
							// Additional safety check for message object
							if (!message || !message._id) {
								console.error("Invalid message object:", message);
								return null;
							}
							
							return (
								<div 
									key={message._id} 
									ref={index === messagesArray.length - 1 && uploadingFiles.length === 0 ? lastMessageRef : null}
								>
									<Message 
										message={message} 
										isSelected={selectedMessages.has(message._id)}
										onSelect={isSelectionMode ? onMessageSelect : null}
										isSelectionMode={isSelectionMode}
									/>
								</div>
							);
						})}

					{/* Uploading files */}
					{uploadingFiles.map((uploadingFile, index) => {
						const messageWithContext = {
							...uploadingFile,
							senderId: authUser?._id,
							receiverId: selectedConversation?._id,
						};
						
						return (
							<div 
								key={uploadingFile.id} 
								ref={index === uploadingFiles.length - 1 ? lastMessageRef : null}
							>
								<Message message={messageWithContext} isUploading={true} />
							</div>
						);
					})}

					{loading && [...Array(3)].map((_, idx) => <MessageSkeleton key={idx} />)}
					{!loading && messagesArray.length === 0 && uploadingFiles.length === 0 && (
						<p className='text-center text-gray-400 mt-4'>Send a message to start the conversation</p>
					)}
				</div>
			</div>
		</div>
	);
};
export default Messages;

// STARTER CODE SNIPPET
// import Message from "./Message";

// const Messages = () => {
// 	return (
// 		<div className='px-4 flex-1 overflow-auto'>
// 			<Message />
// 			<Message />
// 			<Message />
// 			<Message />
// 			<Message />
// 			<Message />
// 			<Message />
// 			<Message />
// 			<Message />
// 			<Message />
// 			<Message />
// 			<Message />
// 		</div>
// 	);
// };
// export default Messages;
