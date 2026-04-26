// Chat scroll + loading logic, WhatsApp-style.
//
//   • Initial render: synchronous scroll-to-bottom (or scroll-to-unread-
//     divider) in `useLayoutEffect`. No animation, no flicker, never
//     "stuck on image load" because we're not waiting for media.
//   • Unread divider: captured once per conversation, before mark-as-read
//     fires. Renders a thin "Unread messages" line above the first unread.
//   • Auto-scroll on new message: only if the user is already near the
//     bottom (within ~120px). Otherwise shows a "↓ N new messages" pill —
//     same as WhatsApp. Outgoing messages always scroll because the user
//     just hit send.
//   • Pagination: IntersectionObserver on a top sentinel; older messages
//     prepend, scrollTop adjusted by the delta so the user's eye stays on
//     the same line.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import useGetMessages from "../../hooks/useGetMessages";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import Message from "./Message";
import DateSeparator from "./DateSeparator";
import useListenMessages from "../../hooks/useListenMessages";
import { useAuthContext } from "../../context/AuthContext";
import useConversation from "../../zustand/useConversation";
import useMarkMessageAsRead from "../../hooks/useMarkMessageAsRead";
import { isDifferentDay } from "../../utils/dateUtils";

const NEAR_BOTTOM_PX = 120;

const Messages = ({ isSelectionMode = false, selectedMessages = new Set(), onMessageSelect = null }) => {
	const { messages, loading, loadingMore, hasMore, loadMoreMessages } = useGetMessages();
	const { authUser } = useAuthContext();
	const selectedConversation = useConversation((s) => s.selectedConversation);
	const uploadingFiles = useConversation((s) => s.uploadingFiles);
	const updateMultipleMessageStatuses = useConversation((s) => s.updateMultipleMessageStatuses);
	const { markMultipleAsRead } = useMarkMessageAsRead();
	useListenMessages();

	const messagesArray = Array.isArray(messages) ? messages : [];

	const scrollContainerRef = useRef(null);
	const topSentinelRef = useRef(null);
	const unreadDividerIdRef = useRef(null);
	const initialScrollDoneRef = useRef(false);
	const lastSeenLengthRef = useRef(0);
	const prevConvIdRef = useRef(null);

	const [newMessagesPillCount, setNewMessagesPillCount] = useState(0);

	// ── Reset all per-conversation state when chat changes ──────────
	useEffect(() => {
		if (selectedConversation?._id !== prevConvIdRef.current) {
			prevConvIdRef.current = selectedConversation?._id;
			unreadDividerIdRef.current = null;
			initialScrollDoneRef.current = false;
			lastSeenLengthRef.current = 0;
			setNewMessagesPillCount(0);
		}
	}, [selectedConversation?._id]);

	// ── Capture first unread message id (before mark-as-read fires) ─
	useEffect(() => {
		if (loading || messagesArray.length === 0 || initialScrollDoneRef.current) return;
		const firstUnread = messagesArray.find(
			(m) => m.receiverId === authUser?._id && m.status !== "read",
		);
		unreadDividerIdRef.current = firstUnread?._id || null;
	}, [loading, messagesArray, authUser?._id]);

	// ── Initial scroll position (synchronous, no flicker) ──────────
	useLayoutEffect(() => {
		if (loading || messagesArray.length === 0 || initialScrollDoneRef.current) return;
		const c = scrollContainerRef.current;
		if (!c) return;

		if (unreadDividerIdRef.current) {
			const el = c.querySelector(`[data-message-id="${unreadDividerIdRef.current}"]`);
			if (el) {
				// Land the divider near the top of the viewport so unreads are
				// visible immediately.
				const offset = el.offsetTop - 60;
				c.scrollTop = Math.max(0, offset);
			} else {
				c.scrollTop = c.scrollHeight;
			}
		} else {
			c.scrollTop = c.scrollHeight;
		}

		initialScrollDoneRef.current = true;
		lastSeenLengthRef.current = messagesArray.length;
	}, [loading, messagesArray.length]);

	// ── Keep pinned to bottom for a few seconds while media loads ─
	// After the initial scroll, images and GIFs are still loading. As they
	// resolve their actual height, content grows and the chat would drift
	// up unless we re-pin. We watch the scroll-container's content for
	// height growth for 3s after first paint and re-scroll to bottom IF
	// the user was still near the bottom at the moment of growth.
	useEffect(() => {
		if (loading || messagesArray.length === 0 || !initialScrollDoneRef.current) return;
		// Don't fight the user — if we initially scrolled to an unread
		// divider mid-chat, leave them there.
		if (unreadDividerIdRef.current) return;

		const c = scrollContainerRef.current;
		if (!c) return;
		const inner = c.firstElementChild;
		if (!inner) return;

		const stopAt = Date.now() + 3000;
		let lastHeight = c.scrollHeight;

		const observer = new ResizeObserver(() => {
			if (Date.now() > stopAt) {
				observer.disconnect();
				return;
			}
			const newHeight = c.scrollHeight;
			if (newHeight > lastHeight) {
				const distanceFromBottomBeforeGrow =
					lastHeight - c.scrollTop - c.clientHeight;
				if (distanceFromBottomBeforeGrow < 240) {
					c.scrollTop = newHeight;
				}
			}
			lastHeight = newHeight;
		});

		observer.observe(inner);
		return () => observer.disconnect();
	}, [loading, messagesArray.length]);

	// ── Auto-scroll on new messages (only if near bottom) ─────────
	useEffect(() => {
		if (!initialScrollDoneRef.current) return;
		const c = scrollContainerRef.current;
		if (!c) return;

		const grew = messagesArray.length > lastSeenLengthRef.current;
		if (!grew) return;

		const distanceFromBottom = c.scrollHeight - c.scrollTop - c.clientHeight;
		const nearBottom = distanceFromBottom < NEAR_BOTTOM_PX;
		const newSlice = messagesArray.slice(lastSeenLengthRef.current);
		const fromMe = newSlice.some((m) => m.senderId === authUser?._id);

		if (nearBottom || fromMe) {
			// Wait one frame for the new message to be in the DOM before scrolling.
			requestAnimationFrame(() => {
				c.scrollTop = c.scrollHeight;
			});
		} else {
			// Stash incoming-only count so the pill shows accurately.
			const fromOthers = newSlice.filter((m) => m.senderId !== authUser?._id).length;
			if (fromOthers > 0) {
				setNewMessagesPillCount((p) => p + fromOthers);
			}
		}
		lastSeenLengthRef.current = messagesArray.length;
	}, [messagesArray.length, authUser?._id]);

	// ── Mark visible messages as read (batched, optimistic) ───────
	useEffect(() => {
		if (!authUser || !selectedConversation || loading) return;
		const unread = messagesArray.filter(
			(m) => m.receiverId === authUser._id && m.status !== "read",
		);
		if (unread.length === 0) return;

		const t = setTimeout(async () => {
			const ids = unread.map((m) => m._id);
			const ok = await markMultipleAsRead(ids);
			if (!ok) return;
			// Locally flip statuses so this effect's next run finds 0 unread.
			updateMultipleMessageStatuses(ids, "read", new Date().toISOString());
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
	}, [authUser, selectedConversation, loading, messagesArray, markMultipleAsRead, updateMultipleMessageStatuses]);

	// ── Reset unread badge on the conversation list when chat opens ─
	useEffect(() => {
		if (selectedConversation?._id) {
			window.dispatchEvent(
				new CustomEvent("resetConversationUnreadCount", {
					detail: { conversationId: selectedConversation._id },
				}),
			);
		}
	}, [selectedConversation?._id]);

	// ── Pagination — load older messages when top sentinel is visible ─
	useEffect(() => {
		const sentinel = topSentinelRef.current;
		const scroller = scrollContainerRef.current;
		if (!sentinel || !scroller || !hasMore) return;

		const observer = new IntersectionObserver(
			async (entries) => {
				const [entry] = entries;
				if (!entry.isIntersecting || loadingMore || loading) return;

				const prevHeight = scroller.scrollHeight;
				const prevTop = scroller.scrollTop;
				const added = await loadMoreMessages();
				if (added) {
					// Preserve the user's visual position: add the height delta
					// of the prepended messages back to scrollTop.
					requestAnimationFrame(() => {
						const delta = scroller.scrollHeight - prevHeight;
						scroller.scrollTop = prevTop + delta;
					});
				}
			},
			{ root: scroller, threshold: 0, rootMargin: "200px 0px 0px 0px" },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasMore, loadingMore, loading, loadMoreMessages]);

	// ── Hide the "new messages" pill once user scrolls back to bottom ─
	const handleScroll = () => {
		const c = scrollContainerRef.current;
		if (!c) return;
		const distanceFromBottom = c.scrollHeight - c.scrollTop - c.clientHeight;
		if (distanceFromBottom < NEAR_BOTTOM_PX && newMessagesPillCount > 0) {
			setNewMessagesPillCount(0);
		}
	};

	const scrollToBottom = () => {
		const c = scrollContainerRef.current;
		if (!c) return;
		c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
		setNewMessagesPillCount(0);
	};

	return (
		<div className='h-full flex flex-col relative'>
			<div
				ref={scrollContainerRef}
				onScroll={handleScroll}
				className='px-2 sm:px-4 flex-1 overflow-auto messages-container'
			>
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
							const showUnreadDivider = unreadDividerIdRef.current === message._id;

							return (
								<div key={message._id}>
									{showDateSeparator && <DateSeparator date={message.createdAt} />}
									{showUnreadDivider && (
										<div className='flex items-center gap-2 my-2 px-2'>
											<div className='flex-1 h-px bg-[#00A884]/40' />
											<span className='text-[10px] uppercase tracking-wider text-[#00A884] font-medium px-2 py-0.5 bg-[#00A884]/10 rounded-full'>
												Unread messages
											</span>
											<div className='flex-1 h-px bg-[#00A884]/40' />
										</div>
									)}
									<div data-message-id={message._id}>
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

					{uploadingFiles.map((uploadingFile) => {
						const messageWithContext = {
							...uploadingFile,
							senderId: authUser?._id,
							receiverId: selectedConversation?._id,
						};
						return (
							<div key={uploadingFile.id}>
								<Message message={messageWithContext} isUploading />
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

			{/* Floating "↓ N new messages" pill — WhatsApp-style */}
			{newMessagesPillCount > 0 && (
				<button
					onClick={scrollToBottom}
					className='absolute bottom-4 right-4 sm:right-6 z-10 px-3 py-2 rounded-full bg-[#00A884] hover:bg-[#06CF9C] text-white text-xs font-medium shadow-lg flex items-center gap-1.5 transition-colors'
				>
					<span>↓</span>
					<span>
						{newMessagesPillCount} new message{newMessagesPillCount > 1 ? "s" : ""}
					</span>
				</button>
			)}
		</div>
	);
};

export default Messages;
