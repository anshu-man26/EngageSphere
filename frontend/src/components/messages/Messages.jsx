import { useEffect, useRef, useState } from "react";
import useGetMessages from "../../hooks/useGetMessages";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import Message from "./Message";
import useListenMessages from "../../hooks/useListenMessages";
import { useAuthContext } from "../../context/AuthContext";
import useConversation from "../../zustand/useConversation";
import useMarkMessageAsDelivered from "../../hooks/useMarkMessageAsDelivered";
import useMarkMessageAsRead from "../../hooks/useMarkMessageAsRead";
import useScrollToBottom from "../../hooks/useScrollToBottom";

const Messages = ({ isSelectionMode = false, selectedMessages = new Set(), onMessageSelect = null }) => {
	const { messages, loading } = useGetMessages();
	const { uploadingFiles } = useConversation();
	const { authUser } = useAuthContext();
	const { selectedConversation } = useConversation();
	const { markAsDelivered } = useMarkMessageAsDelivered();
	const { markAsRead } = useMarkMessageAsRead();
	useListenMessages();
	const lastMessageRef = useRef();
	const [previousMessageCount, setPreviousMessageCount] = useState(0);
	const { scrollToBottomAfterImagesLoad, smoothScrollToBottom, cleanup } = useScrollToBottom();

	// Ensure messages is always an array
	const messagesArray = Array.isArray(messages) ? messages : [];

	// Mark messages as delivered and read when they are viewed
	useEffect(() => {
		if (!authUser || !selectedConversation || loading) return;

		const markMessagesAsDeliveredAndRead = async () => {
			const unreadMessages = messagesArray.filter(message => 
				message.receiverId === authUser._id && 
				message.status !== 'read'
			);

			for (const message of unreadMessages) {
				// Mark as delivered first
				if (message.status === 'sent') {
					await markAsDelivered(message._id);
				}
				
				// Mark as read
				if (message.status !== 'read') {
					await markAsRead(message._id);
					
					// Emit event to update conversation unread count
					window.dispatchEvent(new CustomEvent('messageRead', {
						detail: {
							senderId: message.senderId,
							receiverId: message.receiverId
						}
					}));
				}
			}
		};

		// Small delay to ensure messages are rendered
		const timeoutId = setTimeout(markMessagesAsDeliveredAndRead, 500);
		return () => clearTimeout(timeoutId);
	}, [authUser, selectedConversation, loading, messagesArray, markAsDelivered, markAsRead]);

	// Reset unread count when conversation is selected
	useEffect(() => {
		if (selectedConversation && selectedConversation._id) {
			// Reset unread count for the selected conversation
			window.dispatchEvent(new CustomEvent('resetConversationUnreadCount', {
				detail: { conversationId: selectedConversation._id }
			}));
		}
	}, [selectedConversation?._id]);

	// Scroll to bottom when conversation is selected and messages are loaded
	useEffect(() => {
		if (selectedConversation && !loading && messagesArray.length > 0) {
			// Check if there are images or GIFs in the messages
			const hasImagesOrGifs = messagesArray.some(message => {
				const isGif = message.message && message.message.startsWith('[GIF]');
				const isImage = message.messageType === 'image';
				return isGif || isImage;
			});
			
			if (hasImagesOrGifs) {
				// Wait for images to load before scrolling
				scrollToBottomAfterImagesLoad(messagesArray);
			} else {
				// For text-only messages, use custom smooth scroll
				setTimeout(() => {
					smoothScrollToBottom(1000); // 1 second duration for gentle scroll
				}, 300); // Slightly longer delay for smoother feel
			}
		}
	}, [selectedConversation?._id, loading, messagesArray.length, scrollToBottomAfterImagesLoad, smoothScrollToBottom]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			cleanup();
		};
	}, [cleanup]);

	useEffect(() => {
		// Only scroll to bottom when new messages are added (not when reactions are updated)
		const currentMessageCount = messagesArray.length;
		const hasNewMessages = currentMessageCount > previousMessageCount;
		
		if (hasNewMessages || uploadingFiles.length > 0) {
			// Check if there are images or GIFs in the messages
			const hasImagesOrGifs = messagesArray.some(message => {
				const isGif = message.message && message.message.startsWith('[GIF]');
				const isImage = message.messageType === 'image';
				return isGif || isImage;
			});
			
			if (hasImagesOrGifs) {
				// Wait for images to load before scrolling
				scrollToBottomAfterImagesLoad(messagesArray);
			} else {
				// For text-only messages, use smooth scroll
				setTimeout(() => {
					smoothScrollToBottom(600); // Shorter duration for new messages
				}, 200); // Slightly longer delay for smoother feel
			}
		}
		
		setPreviousMessageCount(currentMessageCount);
	}, [messagesArray, uploadingFiles, previousMessageCount, scrollToBottomAfterImagesLoad, smoothScrollToBottom]);

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
