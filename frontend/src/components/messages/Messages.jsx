import { useEffect, useRef, useState } from "react";
import useGetMessages from "../../hooks/useGetMessages";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import Message from "./Message";
import DateSeparator from "./DateSeparator";
import useListenMessages from "../../hooks/useListenMessages";
import { useAuthContext } from "../../context/AuthContext";
import useConversation from "../../zustand/useConversation";
import useMarkMessageAsDelivered from "../../hooks/useMarkMessageAsDelivered";
import useMarkMessageAsRead from "../../hooks/useMarkMessageAsRead";
import useScrollToBottom from "../../hooks/useScrollToBottom";
import { isDifferentDay } from "../../utils/dateUtils";

const Messages = ({ isSelectionMode = false, selectedMessages = new Set(), onMessageSelect = null }) => {
	const { messages, loading } = useGetMessages();
	const { uploadingFiles } = useConversation();
	const { authUser } = useAuthContext();
	const { selectedConversation } = useConversation();
	const { markAsDelivered } = useMarkMessageAsDelivered();
	const { markAsRead, markMultipleAsRead } = useMarkMessageAsRead();
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

			if (unreadMessages.length === 0) return;

			// Mark all unread messages as read in a single API call
			const messageIds = unreadMessages.map(message => message._id);
			await markMultipleAsRead(messageIds);

			// Emit event to update conversation unread count for all messages at once
			window.dispatchEvent(new CustomEvent('messagesRead', {
				detail: {
					messageIds: messageIds,
					senderId: unreadMessages[0].senderId,
					receiverId: unreadMessages[0].receiverId
				}
			}));
		};

		// Small delay to ensure messages are rendered
		const timeoutId = setTimeout(markMessagesAsDeliveredAndRead, 500);
		return () => clearTimeout(timeoutId);
	}, [authUser, selectedConversation, loading, messagesArray, markMultipleAsRead]);

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
			<div className='px-4 sm:px-4 flex-1 overflow-auto messages-container'>
				{/* Messages content */}
				<div className="pb-0">
					{/* Regular messages */}
					{!loading &&
						messagesArray.length > 0 &&
						messagesArray.map((message, index) => {
							// Additional safety check for message object
							if (!message || !message._id) {
								console.error("Invalid message object:", message);
								return null;
							}
							
							// Check if we need to add a date separator
							const showDateSeparator = index === 0 || 
								(messagesArray[index - 1] && 
								 isDifferentDay(messagesArray[index - 1].createdAt, message.createdAt));
							
							return (
								<div key={message._id}>
									{/* Date separator */}
									{showDateSeparator && (
										<DateSeparator date={message.createdAt} />
									)}
									
									{/* Message */}
									<div 
										ref={index === messagesArray.length - 1 && uploadingFiles.length === 0 ? lastMessageRef : null}
									>
										<Message 
											message={message} 
											isSelected={selectedMessages.has(message._id)}
											onSelect={isSelectionMode ? onMessageSelect : null}
											isSelectionMode={isSelectionMode}
										/>
									</div>
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
						
						// Check if we need to add a date separator for uploading files
						const showDateSeparator = messagesArray.length === 0 && index === 0;
						
						return (
							<div key={uploadingFile.id}>
								{/* Date separator for first uploading file if no messages exist */}
								{showDateSeparator && (
									<DateSeparator date={uploadingFile.createdAt} />
								)}
								
								{/* Uploading message */}
								<div 
									ref={index === uploadingFiles.length - 1 ? lastMessageRef : null}
								>
									<Message message={messageWithContext} isUploading={true} />
								</div>
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
