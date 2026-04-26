import { useEffect, useRef, useState } from "react";
import { FaDownload } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuthContext } from "../../context/AuthContext";
import useConversation from "../../zustand/useConversation";
import useAddReaction from "../../hooks/useAddReaction";
import useRemoveReaction from "../../hooks/useRemoveReaction";
import { formatMessageTime } from "../../utils/dateUtils";
import ReactionPicker from "./ReactionPicker";

const LONG_PRESS_MS = 500;

const Message = ({
	message,
	isUploading = false,
	isSelected = false,
	onSelect = null,
	isSelectionMode = false,
}) => {
	const { authUser } = useAuthContext();
	const {
		selectedConversation,
		updateMessageReaction,
		activeEmojiPicker,
		setActiveEmojiPicker,
		clearActiveEmojiPicker,
	} = useConversation();
	const { addReaction } = useAddReaction();
	const { removeReaction } = useRemoveReaction();

	const [showImageMenu, setShowImageMenu] = useState(false);
	const reactionPickerTimeout = useRef(null);
	const imageMenuTimeout = useRef(null);
	const messageBubbleRef = useRef(null);

	if (!message || !message.senderId) return null;

	const fromMe = message.senderId === authUser?._id;
	const formattedTime = formatMessageTime(message.createdAt);
	const showReactionPicker = activeEmojiPicker === message._id;

	const isGifMessage = message.message && message.message.startsWith("[GIF]");
	const gifData = isGifMessage
		? (() => {
				const lines = message.message.split("\n");
				return { title: lines[0].replace("[GIF] ", ""), url: lines[1] };
			})()
		: null;

	// ── File download ─────────────────────────────────────────────
	const handleFileDownload = async (fileUrl, fileName) => {
		try {
			const res = await fetch(fileUrl);
			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch {
			window.open(fileUrl, "_blank");
		}
	};

	// ── Reactions ─────────────────────────────────────────────────
	const groupedReactions =
		message.reactions?.reduce((acc, r) => {
			(acc[r.emoji] ||= []).push(r);
			return acc;
		}, {}) || {};

	const handleReaction = async (emoji) => {
		const mine = message.reactions?.find((r) => r.userId === authUser._id && r.emoji === emoji);
		if (mine) {
			const ok = await removeReaction(message._id, emoji);
			if (ok) updateMessageReaction(message._id, "remove", { userId: authUser._id, emoji });
			return;
		}
		const existingType = message.reactions?.some((r) => r.emoji === emoji);
		if (!existingType && message.reactions?.length > 0) {
			const types = new Set(message.reactions.map((r) => r.emoji));
			if (types.size >= 2) {
				toast.error("Only 2 reaction types are allowed");
				return;
			}
		}
		if (message.reactions?.some((r) => r.userId === authUser._id)) {
			const prev = message.reactions.find((r) => r.userId === authUser._id);
			if (prev) {
				await removeReaction(message._id, prev.emoji);
				updateMessageReaction(message._id, "remove", { userId: authUser._id, emoji: prev.emoji });
			}
		}
		const ok = await addReaction(message._id, emoji);
		if (ok) updateMessageReaction(message._id, "add", { userId: authUser._id, emoji });
	};

	// ── Long-press handlers (bubble) ──────────────────────────────
	const startBubblePress = () => {
		if (message.deletedForEveryone) return;
		reactionPickerTimeout.current = setTimeout(() => setActiveEmojiPicker(message._id), LONG_PRESS_MS);
	};
	const cancelBubblePress = () => clearTimeout(reactionPickerTimeout.current);

	// ── Long-press handlers (image/gif) ───────────────────────────
	const startImagePress = (e) => {
		e.stopPropagation();
		imageMenuTimeout.current = setTimeout(() => setShowImageMenu(true), LONG_PRESS_MS);
	};
	const cancelImagePress = (e) => {
		e.stopPropagation();
		clearTimeout(imageMenuTimeout.current);
	};

	// ── Selection ─────────────────────────────────────────────────
	const handleClick = () => {
		if (isSelectionMode && onSelect) onSelect(message._id);
	};

	// ── Click-outside cleanup for emoji + image menu ──────────────
	useEffect(() => {
		const onClickOutside = (e) => {
			if (showReactionPicker && !e.target.closest(".reaction-picker") && !e.target.closest("[data-message-bubble]")) {
				clearActiveEmojiPicker();
			}
			if (showImageMenu && !e.target.closest(".image-menu") && !e.target.closest(".message-image")) {
				setShowImageMenu(false);
			}
		};
		document.addEventListener("mousedown", onClickOutside);
		return () => document.removeEventListener("mousedown", onClickOutside);
	}, [showReactionPicker, showImageMenu, clearActiveEmojiPicker]);

	// ── Emoji picker placement ────────────────────────────────────
	const getEmojiPickerPosition = () => {
		if (!messageBubbleRef.current) return {};
		const rect = messageBubbleRef.current.getBoundingClientRect();
		const w = window.innerWidth;
		const h = window.innerHeight;
		const isMobile = w <= 768;
		const pickerW = isMobile ? Math.min(240, w * 0.85) : 280;
		const pickerH = isMobile ? Math.min(300, h * 0.6) : 400;

		let style = {
			position: "absolute",
			zIndex: 50,
			maxWidth: isMobile ? "85vw" : "90vw",
			maxHeight: isMobile ? "60vh" : "80vh",
		};

		const spaceAbove = rect.top;
		const spaceBelow = h - rect.bottom;
		if (spaceAbove < pickerH + 20) {
			style.top = "100%";
			style.marginTop = "0.5rem";
		} else {
			style.bottom = "100%";
			style.marginBottom = "0.5rem";
		}

		if (isMobile) {
			style.left = "50%";
			style.transform = "translateX(-50%)";
		} else if (fromMe) {
			if (rect.left < pickerW + 20) {
				style.left = "100%";
				style.marginLeft = "0.5rem";
			} else {
				style.right = "100%";
				style.marginRight = "0.5rem";
			}
		} else {
			if (w - rect.right < pickerW + 20) {
				style.right = "100%";
				style.marginRight = "0.5rem";
			} else {
				style.left = "100%";
				style.marginLeft = "0.5rem";
			}
		}
		return style;
	};

	// ── Bubble color/shape (WhatsApp dark) ────────────────────────
	const bubbleClass = fromMe
		? "wa-bubble-sent wa-tail rounded-lg rounded-br-none"
		: "wa-bubble-recv wa-tail rounded-lg rounded-bl-none";

	const isMedia = message.messageType === "image" || isGifMessage;

	// ── Loading state ─────────────────────────────────────────────
	if (isUploading) {
		return (
			<div className={`flex ${fromMe ? "justify-end" : "justify-start"} mb-1 px-3 sm:px-6`}>
				<div className={`relative max-w-[75%] sm:max-w-md ${bubbleClass} px-2 py-1.5 shadow`}>
					<div className='flex flex-col items-center space-y-2 py-2'>
						<div className='w-20 h-20 sm:w-28 sm:h-28 bg-black/20 rounded-lg flex items-center justify-center'>
							<div className='animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent' />
						</div>
						<p className='text-xs text-white/70'>Uploading…</p>
					</div>
					<div className='flex items-center justify-end gap-1 text-[11px] text-white/55 mt-1'>
						<span>{formattedTime}</span>
					</div>
				</div>
			</div>
		);
	}

	// ── Regular render ────────────────────────────────────────────
	return (
		<div
			className={`flex ${fromMe ? "justify-end" : "justify-start"} mb-1 px-3 sm:px-6 group transition-colors ${
				isSelectionMode ? "cursor-pointer" : ""
			} ${isSelected ? "bg-[#00A884]/10" : ""}`}
			onClick={handleClick}
		>
			<div className='relative max-w-[80%] sm:max-w-md'>
				<div
					ref={messageBubbleRef}
					data-message-bubble
					className={`${bubbleClass} ${
						isMedia ? "p-1" : "px-2.5 py-1.5"
					} shadow relative ${message.shouldShake ? "shake" : ""} ${
						isSelected ? "ring-2 ring-[#00A884]" : ""
					} select-none`}
					onMouseDown={(e) => e.button === 0 && startBubblePress()}
					onMouseUp={cancelBubblePress}
					onMouseLeave={cancelBubblePress}
					onTouchStart={startBubblePress}
					onTouchEnd={cancelBubblePress}
				>
					{showReactionPicker && (
						<div style={getEmojiPickerPosition()}>
							<ReactionPicker
								messageId={message._id}
								isOpen={showReactionPicker}
								onReactionSelect={(emoji) => {
									handleReaction(emoji);
									clearActiveEmojiPicker();
								}}
								onClose={clearActiveEmojiPicker}
							/>
						</div>
					)}

					{message.deletedForEveryone ? (
						<p className='italic text-sm text-[#8696A0] px-1 py-0.5'>🚫 This message was deleted</p>
					) : (
						<>
							{message.messageType === "image" && (
								<div className='flex flex-col gap-1.5'>
									<div className='relative overflow-hidden rounded-xl message-image group/img'>
										<img
											src={message.fileUrl}
											alt={message.fileName || "Image"}
											className='max-w-full max-h-80 cursor-pointer rounded-xl'
											onClick={() => window.open(message.fileUrl, "_blank")}
											onMouseDown={startImagePress}
											onMouseUp={cancelImagePress}
											onMouseLeave={cancelImagePress}
											onTouchStart={startImagePress}
											onTouchEnd={cancelImagePress}
											onContextMenu={(e) => e.preventDefault()}
										/>
										{showImageMenu && (
											<div className='absolute top-2 right-2 bg-[#233138] ring-1 ring-black/30 rounded-xl shadow-xl p-1 image-menu z-20'>
												<button
													onClick={() => {
														handleFileDownload(message.fileUrl, message.fileName || "image.jpg");
														setShowImageMenu(false);
													}}
													className='w-full flex items-center gap-2 px-3 py-1.5 text-[#E9EDEF] hover:bg-[#2A3942] rounded-lg text-xs'
												>
													<FaDownload size={11} className='text-[#8696A0]' />
													Download
												</button>
												<button
													onClick={() => {
														setShowImageMenu(false);
														setActiveEmojiPicker(message._id);
													}}
													className='w-full flex items-center gap-2 px-3 py-1.5 text-[#E9EDEF] hover:bg-[#2A3942] rounded-lg text-xs'
												>
													😊 React
												</button>
											</div>
										)}
									</div>
									{message.message && (
										<p className='text-sm px-1.5'>{message.message}</p>
									)}
								</div>
							)}

							{message.messageType === "document" && (
								<div className='flex flex-col gap-1.5'>
									{message.message && <p className='text-sm px-1.5'>{message.message}</p>}
									<div className='flex items-center gap-2 p-2 bg-black/20 rounded-lg'>
										<div className='text-xl'>📄</div>
										<div className='flex-1 min-w-0'>
											<p className='text-xs font-medium truncate'>{message.fileName}</p>
											{message.fileSize && (
												<p className='text-[11px] opacity-70'>{(message.fileSize / 1024 / 1024).toFixed(2)} MB</p>
											)}
										</div>
										<button
											onClick={() => handleFileDownload(message.fileUrl, message.fileName)}
											className='px-2 py-1 bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium rounded-md transition-colors'
										>
											Download
										</button>
									</div>
								</div>
							)}

							{isGifMessage && gifData && (
								<div className='relative overflow-hidden rounded-xl message-image group/img'>
									<img
										src={gifData.url}
										alt={gifData.title || "GIF"}
										className='max-w-full max-h-80 cursor-pointer rounded-xl'
										onClick={() => window.open(gifData.url, "_blank")}
										onMouseDown={startImagePress}
										onMouseUp={cancelImagePress}
										onMouseLeave={cancelImagePress}
										onTouchStart={startImagePress}
										onTouchEnd={cancelImagePress}
										onContextMenu={(e) => e.preventDefault()}
									/>
									<span className='absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider backdrop-blur-sm'>
										GIF
									</span>
									{showImageMenu && (
										<div className='absolute top-2 right-2 bg-[#233138] ring-1 ring-black/30 rounded-xl shadow-xl p-1 image-menu z-20'>
											<button
												onClick={() => {
													handleFileDownload(gifData.url, gifData.title || "gif.gif");
													setShowImageMenu(false);
												}}
												className='w-full flex items-center gap-2 px-3 py-1.5 text-[#E9EDEF] hover:bg-[#2A3942] rounded-lg text-xs'
											>
												<FaDownload size={11} className='text-[#8696A0]' />
												Download
											</button>
											<button
												onClick={() => {
													setShowImageMenu(false);
													setActiveEmojiPicker(message._id);
												}}
												className='w-full flex items-center gap-2 px-3 py-1.5 text-[#E9EDEF] hover:bg-[#2A3942] rounded-lg text-xs'
											>
												😊 React
											</button>
										</div>
									)}
								</div>
							)}

							{(!message.messageType || message.messageType === "text") && !isGifMessage && (
								<p className='text-sm leading-relaxed whitespace-pre-wrap break-words'>{message.message}</p>
							)}
						</>
					)}

					{/* Footer (time + read receipts) */}
					<div className={`flex items-center justify-end gap-1 -mb-0.5 text-[11px] ${fromMe ? "text-white/55" : "text-[#8696A0]"}`}>
						<span>{formattedTime}</span>
						<MessageStatus status={message.status} fromMe={fromMe} />
					</div>
				</div>

				{/* Reactions */}
				{message.reactions && message.reactions.length > 0 && !message.deletedForEveryone && (
					<div className={`absolute ${fromMe ? "-left-1" : "-right-1"} -bottom-2 flex items-center gap-0.5`}>
						{Object.entries(groupedReactions).map(([emoji, reactions]) => {
							const mine = reactions.some((r) => r.userId === authUser._id);
							return (
								<button
									key={emoji}
									onClick={() => handleReaction(emoji)}
									className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs ring-1 ring-[#0B141A] transition-colors ${
										mine ? "bg-[#00A884]/30 text-[#E9EDEF]" : "bg-[#2A3942] text-[#E9EDEF]"
									}`}
								>
									<span>{emoji}</span>
									{reactions.length > 1 && <span className='text-[10px] font-medium'>{reactions.length}</span>}
								</button>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

const MessageStatus = ({ status, fromMe }) => {
	if (!fromMe) return null;
	const Single = (cls) => (
		<svg className={`w-3.5 h-3.5 ${cls}`} fill='currentColor' viewBox='0 0 20 20'>
			<path
				fillRule='evenodd'
				d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
				clipRule='evenodd'
			/>
		</svg>
	);
	const Double = (cls) => (
		<span className='inline-flex'>
			{Single(cls)}
			<span className='-ml-1.5'>{Single(cls)}</span>
		</span>
	);
	if (status === "read") return Double("text-[#53BDEB]");
	if (status === "delivered") return Double("text-white/60");
	return Single("text-white/60");
};

export default Message;
