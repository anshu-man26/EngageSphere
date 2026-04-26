import { useEffect, useRef, useState } from "react";
import useGetMessages from "../../hooks/useGetMessages";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import Message from "./Message";
import DateSeparator from "./DateSeparator";
import useListenMessages from "../../hooks/useListenMessages";
import { useAuthContext } from "../../context/AuthContext";
import useConversation from "../../zustand/useConversation";
import useMarkMessageAsRead from "../../hooks/useMarkMessageAsRead";
import useScrollToBottom from "../../hooks/useScrollToBottom";
import { isDifferentDay } from "../../utils/dateUtils";

const Messages = ({ isSelectionMode = false, selectedMessages = new Set(), onMessageSelect = null }) => {
	const { messages, loading, loadingMore, hasMore, loadMoreMessages } = useGetMessages();
	const { uploadingFiles } = useConversation();
	const { authUser } = useAuthContext();
	const { selectedConversation } = useConversation();
	const { markMultipleAsRead } = useMarkMessageAsRead();
	useListenMessages();

	const messagesArray = Array.isArray(messages) ? messages : [];

	const lastMessageRef = useRef();
	const scrollContainerRef = useRef(null);
	const topSentinelRef = useRef(null);
	const [previousMessageCount, setPreviousMessageCount] = useState(0);
	const { scrollToBottomAfterImagesLoad, smoothScrollToBottom, cleanup } = useScrollToBottom();

	// ── Mark visible messages as read ─────────────────────────────
	useEffect(() => {
		if (!authUser || !selectedConversation || loading) return;

		const unread = messagesArray.filter(
			(m) => m.receiverId === authUser._id && m.status !== "read",
		);
		if (unread.length === 0) return;

		const t = setTimeout(async () => {
			const ids = unread.map((m) => m._id);
			await markMultipleAsRead(ids);
			window.dispatchEvent(
				new CustomEvent("messagesRead", {
					detail: {
						messageIds: ids,
						senderId: unread[0].senderId,
						receiverId: unread[0].receiverId,
					},
				}),
			);
		}, 500);
		return () => clearTimeout(t);
	}, [authUser, selectedConversation, loading, messagesArray, markMultipleAsRead]);

	// ── Reset unread count when conversation is opened ────────────
	useEffect(() => {
		if (selectedConversation?._id) {
			window.dispatchEvent(
				new CustomEvent("resetConversationUnreadCount", {
					detail: { conversationId: selectedConversation._id },
				}),
			);
		}
	}, [selectedConversation?._id]);

	// ── Scroll to bottom on first open of a conversation ──────────
	useEffect(() => {
		if (!selectedConversation || loading || messagesArray.length === 0) return;
		const hasMedia = messagesArray.some(
			(m) => m.messageType === "image" || (m.message && m.message.startsWith("[GIF]")),
		);
		if (hasMedia) {
			scrollToBottomAfterImagesLoad(messagesArray);
		} else {
			setTimeout(() => smoothScrollToBottom(800), 200);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedConversation?._id, loading]);

	useEffect(() => () => cleanup(), [cleanup]);

	// ── Scroll to bottom when a NEW message arrives (not history) ──
	useEffect(() => {
		const currentCount = messagesArray.length;
		const grew = currentCount > previousMessageCount;
		// Only auto-scroll if a *new* message was appended, not if older
		// history was prepended (which we detect by the user not being near
		// the bottom).
		if (grew || uploadingFiles.length > 0) {
			const c = scrollContainerRef.current;
			const nearBottom = !c || c.scrollHeight - c.scrollTop - c.clientHeight < 240;
			if (nearBottom) {
				const hasMedia = messagesArray.some(
					(m) => m.messageType === "image" || (m.message && m.message.startsWith("[GIF]")),
				);
				if (hasMedia) {
					scrollToBottomAfterImagesLoad(messagesArray);
				} else {
					setTimeout(() => smoothScrollToBottom(500), 100);
				}
			}
		}
		setPreviousMessageCount(currentCount);
	}, [messagesArray, uploadingFiles, previousMessageCount, scrollToBottomAfterImagesLoad, smoothScrollToBottom]);

	// ── Pagination: when the top sentinel is in view, load older ──
	useEffect(() => {
		const sentinel = topSentinelRef.current;
		const scroller = scrollContainerRef.current;
		if (!sentinel || !scroller || !hasMore) return;

		const observer = new IntersectionObserver(
			async (entries) => {
				const [entry] = entries;
				if (!entry.isIntersecting || loadingMore || loading) return;

				// Capture scroll metrics so we can preserve the user's visual
				// position after older messages are prepended.
				const prevScrollHeight = scroller.scrollHeight;
				const prevScrollTop = scroller.scrollTop;

				const added = await loadMoreMessages();

				if (added) {
					// Wait one frame for the DOM to update, then offset scrollTop
					// by the height delta so the same message stays under the
					// user's eye.
					requestAnimationFrame(() => {
						const delta = scroller.scrollHeight - prevScrollHeight;
						scroller.scrollTop = prevScrollTop + delta;
					});
				}
			},
			{ root: scroller, threshold: 0, rootMargin: "200px 0px 0px 0px" },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasMore, loadingMore, loading, loadMoreMessages]);

	if (!Array.isArray(messagesArray)) {
		return (
			<div className='px-4 flex-1 overflow-auto messages-container'>
				<p className='text-center text-red-400 mt-4'>Error loading messages</p>
			</div>
		);
	}

	return (
		<div className='h-full flex flex-col'>
			<div ref={scrollContainerRef} className='px-2 sm:px-4 flex-1 overflow-auto messages-container'>
				<div className='py-2'>
					{/* Top sentinel for infinite-scroll pagination */}
					<div ref={topSentinelRef} aria-hidden='true' />

					{loadingMore && (
						<div className='flex justify-center py-2'>
							<div className='animate-spin rounded-full h-5 w-5 border-2 border-[#00A884] border-t-transparent' />
						</div>
					)}

					{!hasMore && messagesArray.length > 0 && !loading && (
						<p className='text-center text-[#667781] text-[11px] py-2'>
							You're all caught up
						</p>
					)}

					{!loading &&
						messagesArray.length > 0 &&
						messagesArray.map((message, index) => {
							if (!message || !message._id) return null;
							const showDateSeparator =
								index === 0 ||
								(messagesArray[index - 1] &&
									isDifferentDay(messagesArray[index - 1].createdAt, message.createdAt));
							const isLast = index === messagesArray.length - 1 && uploadingFiles.length === 0;

							return (
								<div key={message._id}>
									{showDateSeparator && <DateSeparator date={message.createdAt} />}
									<div ref={isLast ? lastMessageRef : null}>
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

					{uploadingFiles.map((uploadingFile, index) => {
						const messageWithContext = {
							...uploadingFile,
							senderId: authUser?._id,
							receiverId: selectedConversation?._id,
						};
						const showDateSeparator = messagesArray.length === 0 && index === 0;
						return (
							<div key={uploadingFile.id}>
								{showDateSeparator && <DateSeparator date={uploadingFile.createdAt} />}
								<div ref={index === uploadingFiles.length - 1 ? lastMessageRef : null}>
									<Message message={messageWithContext} isUploading />
								</div>
							</div>
						);
					})}

					{loading && [...Array(3)].map((_, idx) => <MessageSkeleton key={idx} />)}
					{!loading && messagesArray.length === 0 && uploadingFiles.length === 0 && (
						<p className='text-center text-[#8696A0] mt-8 text-sm'>
							Send a message to start the conversation
						</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default Messages;
