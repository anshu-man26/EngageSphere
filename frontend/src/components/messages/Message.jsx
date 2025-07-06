import { useEffect, useRef, useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
import { FaDownload, FaImage, FaFile } from "react-icons/fa";
import useAddReaction from "../../hooks/useAddReaction";
import useRemoveReaction from "../../hooks/useRemoveReaction";
import ReactionPicker from "./ReactionPicker";
import toast from "react-hot-toast";

const Message = ({ message, isUploading = false, isSelected = false, onSelect = null, isSelectionMode = false }) => {
	const { authUser } = useAuthContext();
	const { selectedConversation, updateMessageReaction, activeEmojiPicker, setActiveEmojiPicker, clearActiveEmojiPicker } = useConversation();
	const { addReaction } = useAddReaction();
	const { removeReaction } = useRemoveReaction();
	const [showImageMenu, setShowImageMenu] = useState(false);
	const reactionPickerTimeout = useRef(null);
	const imageMenuTimeout = useRef(null);
	const messageBubbleRef = useRef(null);
	const imageRef = useRef(null);
	
	// Check if this message has the active emoji picker
	const showReactionPicker = activeEmojiPicker === message._id;
	
	// Safety checks for message object
	if (!message || !message.senderId) {
		console.error("Invalid message object:", message);
		return null;
	}
	
	const fromMe = message.senderId === authUser?._id;
	const formattedTime = extractTime(message.createdAt);
	const profilePic = fromMe ? authUser?.profilePic : selectedConversation?.participant?.profilePic;

	// Check if message is a GIF message
	const isGifMessage = message.message && message.message.startsWith('[GIF]');
	const gifData = isGifMessage ? (() => {
		const lines = message.message.split('\n');
		const title = lines[0].replace('[GIF] ', '');
		const url = lines[1];
		return { title, url };
	})() : null;



	const shakeClass = message.shouldShake ? "shake" : "";

	// Handle file download
	const handleFileDownload = async (fileUrl, fileName) => {
		try {
			const response = await fetch(fileUrl);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error downloading file:', error);
			// Fallback: open in new tab
			window.open(fileUrl, '_blank');
		}
	};

	// Handle message selection
	const handleSelect = () => {
		if (onSelect) {
			onSelect(message._id);
		}
	};

	// Handle message click for selection
	const handleMessageClick = () => {
		if (isSelectionMode && onSelect) {
			handleSelect();
		}
	};



	// Handle reaction
	const handleReaction = async (emoji) => {
		const existingReaction = message.reactions?.find(
			reaction => reaction.userId === authUser._id && reaction.emoji === emoji
		);

		if (existingReaction) {
			// Remove reaction
			const result = await removeReaction(message._id, emoji);
			if (result) {
				updateMessageReaction(message._id, 'remove', { userId: authUser._id, emoji });
			}
		} else {
			// Check if this emoji type already exists in reactions
			const existingEmojiType = message.reactions?.some(r => r.emoji === emoji);
			
			// If this is a new emoji type and we already have 2 different types, don't allow it
			if (!existingEmojiType && message.reactions && message.reactions.length > 0) {
				const uniqueEmojiTypes = [...new Set(message.reactions.map(r => r.emoji))];
				if (uniqueEmojiTypes.length >= 2) {
					// Show a toast or some feedback that only 2 reaction types are allowed
					toast.error("Only 2 reaction types are allowed");
					return;
				}
			}
			
			// Remove any existing reactions from this user first
			if (message.reactions && message.reactions.some(r => r.userId === authUser._id)) {
				const existingUserReaction = message.reactions.find(r => r.userId === authUser._id);
				if (existingUserReaction) {
					await removeReaction(message._id, existingUserReaction.emoji);
					updateMessageReaction(message._id, 'remove', { userId: authUser._id, emoji: existingUserReaction.emoji });
				}
			}
			
			// Add new reaction
			const result = await addReaction(message._id, emoji);
			if (result) {
				updateMessageReaction(message._id, 'add', { userId: authUser._id, emoji });
			}
		}
	};

	// Group reactions by emoji
	const groupedReactions = message.reactions?.reduce((acc, reaction) => {
		if (!acc[reaction.emoji]) {
			acc[reaction.emoji] = [];
		}
		acc[reaction.emoji].push(reaction);
		return acc;
	}, {}) || {};

	// Long-press handlers
	const handleBubbleMouseDown = (e) => {
		if (e.button !== 0) return; // Only left click
		if (message.deletedForEveryone) return; // Don't allow reactions on deleted messages
		reactionPickerTimeout.current = setTimeout(() => {
			setActiveEmojiPicker(message._id);
		}, 500);
	};
	const handleBubbleMouseUp = () => {
		clearTimeout(reactionPickerTimeout.current);
	};
	const handleBubbleMouseLeave = () => {
		clearTimeout(reactionPickerTimeout.current);
	};
	const handleBubbleTouchStart = () => {
		if (message.deletedForEveryone) return; // Don't allow reactions on deleted messages
		reactionPickerTimeout.current = setTimeout(() => {
			setActiveEmojiPicker(message._id);
		}, 500);
	};
	const handleBubbleTouchEnd = () => {
		clearTimeout(reactionPickerTimeout.current);
	};

	// Image long-press handlers
	const handleImageMouseDown = (e) => {
		e.preventDefault(); // Prevent browser context menu and selection
		e.stopPropagation(); // Prevent message bubble handlers from firing
		if (e.button !== 0) return; // Only left click
		imageMenuTimeout.current = setTimeout(() => {
			setShowImageMenu(true);
		}, 500);
	};
	const handleImageMouseUp = (e) => {
		e.preventDefault(); // Prevent browser context menu and selection
		e.stopPropagation(); // Prevent message bubble handlers from firing
		clearTimeout(imageMenuTimeout.current);
	};
	const handleImageMouseLeave = (e) => {
		e.preventDefault(); // Prevent browser context menu and selection
		e.stopPropagation(); // Prevent message bubble handlers from firing
		clearTimeout(imageMenuTimeout.current);
	};
	const handleImageTouchStart = (e) => {
		e.preventDefault(); // Prevent browser context menu and selection
		e.stopPropagation(); // Prevent message bubble handlers from firing
		imageMenuTimeout.current = setTimeout(() => {
			setShowImageMenu(true);
		}, 500);
	};
	const handleImageTouchEnd = (e) => {
		e.preventDefault(); // Prevent browser context menu and selection
		e.stopPropagation(); // Prevent message bubble handlers from firing
		clearTimeout(imageMenuTimeout.current);
	};

	// Prevent browser context menu on images
	const handleImageContextMenu = (e) => {
		e.preventDefault(); // Prevent browser context menu
		e.stopPropagation(); // Prevent event bubbling
	};

	// Handle React button click from image menu
	const handleImageReact = () => {
		setShowImageMenu(false);
		setActiveEmojiPicker(message._id);
	};

	// Calculate emoji picker position
	const getEmojiPickerPosition = () => {
		if (!messageBubbleRef.current) return {};
		
		const rect = messageBubbleRef.current.getBoundingClientRect();
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;
		const isMobile = windowWidth <= 768;
		
		// Responsive picker dimensions
		const pickerWidth = isMobile ? Math.min(240, windowWidth * 0.85) : 280;
		const pickerHeight = isMobile ? Math.min(300, windowHeight * 0.6) : 400;
		
		// Default position above the message
		let top = 'auto';
		let bottom = '100%';
		let left = 'auto';
		let right = 'auto';
		let marginBottom = '0.5rem';
		let marginTop = '0';
		let transform = 'none';
		let marginRight = '0.5rem';
		let marginLeft = '0.5rem';
		
		// Check if there's enough space above
		const spaceAbove = rect.top;
		const spaceBelow = windowHeight - rect.bottom;
		
		// If there's not enough space above, show below
		if (spaceAbove < pickerHeight + 20) {
			bottom = 'auto';
			top = '100%';
			marginBottom = '0';
			marginTop = '0.5rem';
		}
		
		// Mobile-specific positioning
		if (isMobile) {
			// On mobile, center the picker horizontally and position it above/below
			left = '50%';
			right = 'auto';
			transform = 'translateX(-50%)';
			marginLeft = '0';
			marginRight = '0';
			
			// Ensure it doesn't go off-screen horizontally
			const pickerHalfWidth = pickerWidth / 2;
			if (rect.left + rect.width / 2 - pickerHalfWidth < 10) {
				// Too close to left edge
				left = '10px';
				transform = 'none';
			} else if (rect.left + rect.width / 2 + pickerHalfWidth > windowWidth - 10) {
				// Too close to right edge
				left = 'auto';
				right = '10px';
				transform = 'none';
			}
			
			// Ensure vertical positioning works well on mobile
			if (spaceAbove < pickerHeight + 20 && spaceBelow < pickerHeight + 20) {
				// Not enough space above or below, position in the middle of the screen
				top = '50%';
				bottom = 'auto';
				transform = 'translate(-50%, -50%)';
				marginTop = '0';
				marginBottom = '0';
			}
		} else {
			// Desktop positioning - position emoji picker on the OPPOSITE side of the message
			if (fromMe) {
				// Message is on the right (from me) - show emoji picker on the LEFT side of the bubble
				right = '100%';
				left = 'auto';
				marginRight = '0.5rem';
				
				// If not enough space on the left, try right side
				if (rect.left < pickerWidth + 20) {
					right = 'auto';
					left = '100%';
					marginRight = '0';
					marginLeft = '0.5rem';
				}
			} else {
				// Message is on the left (from others) - show emoji picker on the RIGHT side of the bubble
				left = '100%';
				right = 'auto';
				marginLeft = '0.5rem';
				
				// If not enough space on the right, try left side
				if (windowWidth - rect.right < pickerWidth + 20) {
					left = 'auto';
					right = '100%';
					marginLeft = '0';
					marginRight = '0.5rem';
				}
			}
		}
		
		// Fallback: if still not enough space, center it
		const spaceRight = windowWidth - rect.right;
		const spaceLeft = rect.left;
		if (spaceLeft < pickerWidth / 2 && spaceRight < pickerWidth / 2) {
			right = 'auto';
			left = '50%';
			transform = 'translateX(-50%)';
			marginLeft = '0';
			marginRight = '0';
		}
		
		return {
			position: 'absolute',
			top,
			bottom,
			left,
			right,
			marginBottom,
			marginTop,
			transform,
			zIndex: 50,
			maxWidth: isMobile ? '85vw' : '90vw',
			maxHeight: isMobile ? '60vh' : '80vh',
			marginRight,
			marginLeft
		};
	};

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (showReactionPicker && !event.target.closest('.reaction-picker') && !event.target.closest('.chat-bubble')) {
				clearActiveEmojiPicker();
			}
			if (showImageMenu && !event.target.closest('.image-menu') && !event.target.closest('.message-image')) {
				setShowImageMenu(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showReactionPicker, showImageMenu]);

	// Loading state for file uploads
	if (isUploading) {
		return (
			<div className={`chat ${fromMe ? "chat-end" : "chat-start"}`}>
				<div className='chat-image avatar'>
					<div className='w-8 lg:w-10 rounded-full'>
						<img
							alt='Tailwind CSS chat bubble component'
							src={profilePic}
						/>
					</div>
				</div>
				<div className="relative">
					<div className={`chat-bubble ${fromMe ? 'bg-blue-500' : 'bg-gray-700'} text-white ${shakeClass} max-w-xs lg:max-w-md`}>
						<div className="flex flex-col items-center space-y-2">
							{/* File placeholder box */}
							<div className="w-20 h-20 lg:w-32 lg:h-32 bg-gray-600 rounded-lg border-2 border-dashed border-gray-400 flex items-center justify-center relative">
								{/* Rotating spinner */}
								<div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-white"></div>
							</div>
							{/* Upload text */}
							<p className="text-xs lg:text-sm text-gray-300 select-none">Uploading...</p>
						</div>
					</div>
					
					{/* WhatsApp-style reactions for loading state */}
					{message.reactions && message.reactions.length > 0 && !message.deletedForEveryone && (
						<div className={`absolute ${fromMe ? '-left-2' : '-right-2'} -bottom-1 flex items-center gap-1`}>
							{Object.entries(groupedReactions).map(([emoji, reactions], index) => (
								<button
									key={emoji}
									onClick={() => handleReaction(emoji)}
									className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-all duration-200 ${
										reactions.some(r => r.userId === authUser._id)
										? 'bg-blue-500/30 text-blue-200'
										: 'bg-red-500/30 text-red-200'
									}`}
									title={`${emoji} (${reactions.length})`}
								>
									<span className="text-sm">{emoji}</span>
									{reactions.length > 1 && (
										<span className="text-xs font-medium min-w-[12px] text-center">
											{reactions.length}
										</span>
									)}
								</button>
							))}
						</div>
					)}
				</div>
				<div className={`chat-footer text-xs flex items-center justify-end gap-1 ${
					fromMe ? 'opacity-70' : 'opacity-70'
				}`}>
					<span>{formattedTime}</span>
					<MessageStatus status={message.status} fromMe={fromMe} />
				</div>
			</div>
		);
	}

	// Regular message display
	return (
		<div 
			className={`chat ${fromMe ? "chat-end" : "chat-start"} relative group select-none cursor-pointer transition-all duration-200 ${
				isSelectionMode ? 'hover:bg-white/5' : ''
			} ${isSelected ? 'bg-blue-500/20' : ''}`} 
			style={{ position: 'relative' }}
			onClick={handleMessageClick}
		>
			<div className='chat-image avatar'>
				<div className='w-8 lg:w-10 rounded-full'>
					<img
						alt='Tailwind CSS chat bubble component'
						src={profilePic}
					/>
				</div>
			</div>
			<div className="relative">
				<div
					className={`chat-bubble ${
						fromMe 
							? isSelected 
								? 'bg-slate-700' 
								: 'bg-slate-600'
							: isSelected 
								? 'bg-slate-800' 
								: 'bg-slate-700'
					} text-white ${shakeClass} max-w-xs lg:max-w-md relative select-none transition-all duration-200 group`}
					ref={messageBubbleRef}
					onMouseDown={handleBubbleMouseDown}
					onMouseUp={handleBubbleMouseUp}
					onMouseLeave={handleBubbleMouseLeave}
					onTouchStart={handleBubbleTouchStart}
					onTouchEnd={handleBubbleTouchEnd}
					style={{ position: 'relative' }}
				>

					{/* Show ReactionPicker on long-press - positioned dynamically */}
					{showReactionPicker && (
						<div style={getEmojiPickerPosition()}>
							<ReactionPicker
								messageId={message._id}
								isOpen={showReactionPicker}
								onReactionSelect={(emoji) => {
									handleReaction(emoji);
									clearActiveEmojiPicker();
								}}
								onClose={() => clearActiveEmojiPicker()}
							/>
						</div>
					)}
					{/* Check if message is deleted for everyone */}
					{message.deletedForEveryone ? (
						<div className="flex items-center space-x-2 text-gray-400/80 italic animate-fadeIn">
							<div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-500/30">
								<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
								</svg>
							</div>
							<p className="text-sm lg:text-base font-medium select-none">This message was deleted</p>
						</div>
					) : (
						<>

							
							{/* File message display */}
							{message.messageType === 'image' && (
								<div className="flex flex-col space-y-3">
									{message.message && <p className="text-sm lg:text-base select-none">{message.message}</p>}
									<div className="max-w-full relative group message-image">
										<div className="relative overflow-hidden rounded-2xl shadow-lg border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
											<img 
												ref={imageRef}
												src={message.fileUrl} 
												alt={message.fileName || "Image"} 
												className="w-full h-auto cursor-pointer transition-all duration-300 group-hover:scale-[1.02] group-hover:brightness-110"
												onClick={() => window.open(message.fileUrl, '_blank')}
												onMouseDown={handleImageMouseDown}
												onMouseUp={handleImageMouseUp}
												onMouseLeave={handleImageMouseLeave}
												onTouchStart={handleImageTouchStart}
												onTouchEnd={handleImageTouchEnd}
												onContextMenu={handleImageContextMenu}
											/>
											{/* Hover overlay */}
											<div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
										</div>
										
										{/* Image menu */}
										{showImageMenu && (
											<div className="absolute top-3 right-3 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-2 min-w-[130px] z-20 animate-fadeIn image-menu">
												<button
													onClick={() => {
														handleFileDownload(message.fileUrl, message.fileName || "image.jpg");
														setShowImageMenu(false);
													}}
													className="w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-blue-500/20 rounded-lg transition-all duration-200 text-xs font-medium group"
												>
													<FaDownload size={12} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
													Download
												</button>
												<div className="h-px bg-white/10 my-1.5"></div>
												<button
													onClick={handleImageReact}
													className="w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-green-500/20 rounded-lg transition-all duration-200 text-xs font-medium group"
												>
													<span className="text-green-400 group-hover:text-green-300 transition-colors">😊</span>
													React
												</button>
											</div>
										)}
									</div>
								</div>
							)}


							
							{message.messageType === 'document' && (
								<div className="flex flex-col space-y-2">
									{message.message && <p className="text-sm lg:text-base select-none">{message.message}</p>}
									<div className="flex items-center space-x-2 p-2 lg:p-3 bg-gray-600 rounded-lg">
										<div className="text-xl lg:text-2xl">📄</div>
										<div className="flex-1 min-w-0">
											<p className="text-xs lg:text-sm font-medium truncate select-none">{message.fileName}</p>
											{message.fileSize && (
												<p className="text-xs text-gray-400 select-none">
													{(message.fileSize / 1024 / 1024).toFixed(2)} MB
												</p>
											)}
										</div>
										<button 
											onClick={() => handleFileDownload(message.fileUrl, message.fileName)}
											className="px-2 lg:px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
										>
											Download
										</button>
									</div>
								</div>
							)}
							
							{/* GIF message display */}
							{isGifMessage && gifData && (
								<div className="flex flex-col space-y-3">
									<div className="max-w-full relative group gif-message">
										<div className="relative overflow-hidden rounded-2xl shadow-lg border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
											<img 
												ref={imageRef}
												src={gifData.url} 
												alt={gifData.title || "GIF"} 
												className="w-full h-auto cursor-pointer transition-all duration-300 group-hover:scale-[1.02] group-hover:brightness-110"
												onClick={() => window.open(gifData.url, '_blank')}
												onMouseDown={handleImageMouseDown}
												onMouseUp={handleImageMouseUp}
												onMouseLeave={handleImageMouseLeave}
												onTouchStart={handleImageTouchStart}
												onTouchEnd={handleImageTouchEnd}
												onContextMenu={handleImageContextMenu}
											/>
											{/* Hover overlay */}
											<div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
											
											{/* GIF badge */}
											<div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg backdrop-blur-sm border border-white/20">
												GIF
											</div>
										</div>
										
										{/* Image menu */}
										{showImageMenu && (
											<div className="absolute top-3 right-3 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-2 min-w-[130px] z-20 animate-fadeIn image-menu">
												<button
													onClick={() => {
														handleFileDownload(gifData.url, gifData.title || "gif.gif");
														setShowImageMenu(false);
													}}
													className="w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-blue-500/20 rounded-lg transition-all duration-200 text-xs font-medium group"
												>
													<FaDownload size={12} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
													Download
												</button>
												<div className="h-px bg-white/10 my-1.5"></div>
												<button
													onClick={handleImageReact}
													className="w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-green-500/20 rounded-lg transition-all duration-200 text-xs font-medium group"
												>
													<span className="text-green-400 group-hover:text-green-300 transition-colors">😊</span>
													React
												</button>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Regular text message */}
							{(!message.messageType || message.messageType === 'text') && !isGifMessage && (
								<p className="text-sm lg:text-base select-none">{message.message}</p>
							)}
						</>
					)}
					<div className={`chat-footer text-xs flex items-center justify-end gap-1 ${
						fromMe ? 'opacity-70' : 'opacity-70'
					}`}>
						<span>{formattedTime}</span>
						<MessageStatus status={message.status} fromMe={fromMe} />
					</div>
				</div>
				
				{/* WhatsApp-style reactions - positioned outside the bubble */}
				{message.reactions && message.reactions.length > 0 && !message.deletedForEveryone && (
					<div className={`absolute ${fromMe ? '-left-2' : '-right-2'} -bottom-1 flex items-center gap-1`}>
						{Object.entries(groupedReactions).map(([emoji, reactions], index) => (
							<button
								key={emoji}
								onClick={() => handleReaction(emoji)}
								className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-all duration-200 ${
									reactions.some(r => r.userId === authUser._id)
									? 'bg-blue-500/30 text-blue-200'
									: 'bg-red-500/30 text-red-200'
								}`}
								title={`${emoji} (${reactions.length})`}
							>
								<span className="text-sm">{emoji}</span>
								{reactions.length > 1 && (
									<span className="text-xs font-medium min-w-[12px] text-center">
										{reactions.length}
									</span>
								)}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

// Message Status Component for WhatsApp-like ticks
const MessageStatus = ({ status, fromMe }) => {
	if (!fromMe) return null; // Only show status for sent messages

	const getStatusIcon = () => {
		switch (status) {
			case "sent":
				return (
					<svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
					</svg>
				);
			case "delivered":
				return (
					<div className="flex items-center">
						<svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
						</svg>
						<svg className="w-4 h-4 text-white -ml-1" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
						</svg>
					</div>
				);
			case "read":
				return (
					<div className="flex items-center">
						<svg className="w-4 h-4 text-blue-400 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
						</svg>
						<svg className="w-4 h-4 text-blue-400 drop-shadow-sm -ml-1" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
						</svg>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div className="flex items-center gap-1 ml-2">
			{getStatusIcon()}
		</div>
	);
};

export default Message;
