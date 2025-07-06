import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useConversation from "../../zustand/useConversation";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import GiphyPicker from "./GiphyPicker";
import { TiMessages } from "react-icons/ti";
import { FaTrash, FaTimes } from "react-icons/fa";
import { Video, MoreVertical, User } from "lucide-react";
import { VideoCameraIcon } from "@heroicons/react/24/outline";
import { IoChevronBack } from "react-icons/io5";
import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import { useVideoCall } from "../../context/VideoCallContext";
import useDeleteMultipleMessages from "../../hooks/useDeleteMultipleMessages";
import useSendGif from "../../hooks/useSendGif";
import ChatBackgroundSelector from "../chat-background/ChatBackgroundSelector";
import toast from "react-hot-toast";

const MessageContainer = ({ isSidebarOpen, setIsSidebarOpen }) => {
	const navigate = useNavigate();
	const { selectedConversation, setSelectedConversation, messages, updateConversationBackground } = useConversation();
	const { onlineUsers } = useSocketContext();
	const { loading: deleteLoading, deleteMultipleMessages } = useDeleteMultipleMessages();
	const { authUser } = useAuthContext();
	const { socket } = useSocketContext();
	const { startOutgoingCall } = useVideoCall();
	const { sendGif } = useSendGif();
	
	// GIF picker state
	const [showGiphyPicker, setShowGiphyPicker] = useState(false);
	
	// Message selection state
	const [selectedMessages, setSelectedMessages] = useState(new Set());
	const [isSelectionMode, setIsSelectionMode] = useState(false);
	
	// Chat background state
	const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
	const [chatBackground, setChatBackground] = useState(selectedConversation?.chatBackground || authUser?.defaultChatBackground || "");
	const [isDarkBackground, setIsDarkBackground] = useState(false);
	
	// Check if the selected conversation user is online
	const isOnline = selectedConversation ? onlineUsers.includes(selectedConversation.participant?._id) : false;

	useEffect(() => {
		// cleanup function (unmounts)
		return () => setSelectedConversation(null);
	}, [setSelectedConversation]);

	// Function to detect if background is dark
	const isBackgroundDark = (background) => {
		if (!background) return false;
		
		// Check for dark gradients
		if (background.includes('linear-gradient')) {
			if (background.includes('#000') || background.includes('black') || 
				background.includes('#1a1a1a') || background.includes('#2d2d2d') ||
				background.includes('rgb(0,0,0)') || background.includes('rgba(0,0,0')) {
				return true;
			}
		}
		
		// Check for dark solid colors
		if (background.includes('#000') || background.includes('black') || 
			background.includes('#1a1a1a') || background.includes('#2d2d2d') ||
			background.includes('rgb(0,0,0)') || background.includes('rgba(0,0,0')) {
			return true;
		}
		
		return false;
	};

	// Update chat background when conversation changes or user's default background changes
	useEffect(() => {
		const newBackground = selectedConversation?.chatBackground || authUser?.defaultChatBackground || "";
		setChatBackground(newBackground);
		
		// Detect if background is dark
		const isDark = isBackgroundDark(newBackground);
		setIsDarkBackground(isDark);
	}, [selectedConversation, authUser?.defaultChatBackground, authUser]);

	// Handle message selection
	const handleMessageSelect = (messageId) => {
		setSelectedMessages(prev => {
			const newSet = new Set(prev);
			if (newSet.has(messageId)) {
				newSet.delete(messageId);
			} else {
				newSet.add(messageId);
			}
			return newSet;
		});
	};

	// Handle bulk delete
	const handleBulkDelete = async (deleteForEveryone = false) => {
		if (selectedMessages.size === 0) return;
		
		const messageIds = Array.from(selectedMessages);
		await deleteMultipleMessages(messageIds, deleteForEveryone);
		setSelectedMessages(new Set());
		setIsSelectionMode(false);
	};

	// Toggle selection mode
	const toggleSelectionMode = () => {
		setIsSelectionMode(!isSelectionMode);
		if (isSelectionMode) {
			setSelectedMessages(new Set());
		}
	};

	// Handle select all messages
	const handleSelectAll = () => {
		if (messages && messages.length > 0) {
			const allMessageIds = messages.map(message => message._id);
			setSelectedMessages(new Set(allMessageIds));
		}
	};

	// Handle cancel selection
	const handleCancelSelection = () => {
		setSelectedMessages(new Set());
		setIsSelectionMode(false);
	};

	// Handle starting video call
	const handleStartVideoCall = async () => {
		try {
			// Check if we have permissions first
			const hasPermissions = await navigator.permissions.query({ name: 'camera' });
			
			if (hasPermissions.state === 'denied') {
				toast.error('Camera access is required for video calls. Please enable it in your browser settings.');
				return;
			}
			
			const result = startOutgoingCall(
				selectedConversation?.participant?._id,
				selectedConversation?.participant?.fullName
			);
		} catch (error) {
			const result = startOutgoingCall(
				selectedConversation?.participant?._id,
				selectedConversation?.participant?.fullName
			);
		}
	};

	// Handle background change
	const handleBackgroundChange = (newBackground) => {
		setChatBackground(newBackground);
		// Update the conversation in the store
		if (selectedConversation?._id) {
			updateConversationBackground(selectedConversation._id, newBackground);
		}
	};

	// Handle GIF picker toggle
	const handleGifPickerToggle = (show) => {
		setShowGiphyPicker(show);
	};

	// Handle GIF selection
	const handleGifSelect = async (gifUrl, gifTitle) => {
		await sendGif(gifUrl, gifTitle);
		setShowGiphyPicker(false);
	};

	// Helper function to format background for CSS
	const formatBackgroundForCSS = (background) => {
		if (!background) return '';
		
		// If it's a URL (starts with http or https), wrap it in url()
		if (background.startsWith('http://') || background.startsWith('https://')) {
			return `url(${background})`;
		}
		
		// If it's already a CSS value (like linear-gradient), return as is
		return background;
	};

	return (
		<div 
			key={`${selectedConversation?._id}-${chatBackground}-${authUser?.defaultChatBackground}`}
			className='flex-1 flex flex-col h-full relative bg-gray-900 min-w-0 overflow-hidden'
			style={{
				background: formatBackgroundForCSS(chatBackground || authUser?.defaultChatBackground || ''),
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat',
			}}
		>


			{!selectedConversation ? (
				<NoChatSelected isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
			) : (
				<>
					{/* Mobile X button for selection mode - positioned to avoid overlap with sidebar button */}
					{isSelectionMode && (
						<div className='lg:hidden fixed top-4 right-4 z-50'>
							<button
								onClick={handleCancelSelection}
								className='p-3 bg-white rounded-full border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-lg'
								style={{ 
									minWidth: '44px', 
									minHeight: '44px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center'
								}}
							>
								<FaTimes size={18} />
							</button>
						</div>
					)}
					
					{/* Fixed Header */}
					<div className={`flex-shrink-0 backdrop-blur-sm px-3 sm:px-4 py-3 border-b relative ${isSelectionMode ? 'z-40' : 'z-10'} mobile-header chat-header ${
						isDarkBackground 
							? 'bg-black/20 border-white/20' 
							: 'bg-gray-800/90 border-gray-600'
					} lg:pl-4 pl-16`}>
						{/* Selection mode toolbar */}
						{isSelectionMode ? (
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
								{/* Left side - X button and message count */}
								<div className="flex items-center gap-2 sm:gap-3">
									<button
										onClick={handleCancelSelection}
										className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
									>
										<FaTimes size={18} />
									</button>
									<span className="text-white text-sm font-medium">
										{selectedMessages.size} selected
									</span>
								</div>
								
								{/* Right side - Select All and Delete buttons */}
								<div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end sm:justify-start">
									{/* Select All button - only show if not all messages are selected */}
									{selectedMessages.size < (messages?.length || 0) && (
										<button
											onClick={handleSelectAll}
											className="px-2 sm:px-3 py-1.5 bg-blue-500 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-600 transition-colors font-medium whitespace-nowrap"
										>
											<span className="hidden sm:inline">Select All</span>
											<span className="sm:hidden">All</span>
										</button>
									)}
									<button
										onClick={() => handleBulkDelete(false)}
										disabled={deleteLoading || selectedMessages.size === 0}
										className="px-2 sm:px-3 py-1.5 bg-red-500 text-white text-xs sm:text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 font-medium whitespace-nowrap"
									>
										<span className="hidden sm:inline">Delete for me</span>
										<span className="sm:hidden">Me</span>
									</button>
									<button
										onClick={() => handleBulkDelete(true)}
										disabled={deleteLoading || selectedMessages.size === 0}
										className="px-2 sm:px-3 py-1.5 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium whitespace-nowrap"
									>
										<span className="hidden sm:inline">Delete for all</span>
										<span className="sm:hidden">All</span>
									</button>
								</div>
							</div>
						) : (
						<div className='flex items-center justify-between'>
							{/* Left side - Profile and Info */}
							<div className='flex items-center gap-2 sm:gap-3 min-w-0 flex-1'>
								{/* Mobile Sidebar Toggle Button - Only visible on mobile */}
								<button
									onClick={() => setIsSidebarOpen(!isSidebarOpen)}
									className='lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors'
									title="Toggle sidebar"
								>
									<IoChevronBack size={18} />
								</button>
								
								{/* Profile Picture */}
								<div 
									className='w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0'
									onClick={() => navigate(`/user/${selectedConversation.participant._id}`)}
									title={`View ${selectedConversation.participant.fullName}'s profile`}
								>
									{selectedConversation.participant?.profilePic ? (
										<img
											src={selectedConversation.participant.profilePic}
											alt={`${selectedConversation.participant.fullName} profile`}
											className='w-full h-full object-cover'
											onError={(e) => {
												e.target.style.display = 'none';
												e.target.nextSibling.style.display = 'flex';
											}}
										/>
									) : null}
									<User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" style={{ display: selectedConversation.participant?.profilePic ? 'none' : 'block' }} />
								</div>
								
								{/* User Info */}
								<div className='min-w-0 flex-1'>
									<h3 className="text-white font-semibold text-sm sm:text-base truncate">{selectedConversation.participant?.fullName}</h3>
									<p className="text-white/70 text-xs sm:text-sm truncate">
										{isOnline ? 'online' : 'last seen recently'}
									</p>
								</div>
							</div>
							
							{/* Right side - Actions */}
							<div className='flex items-center gap-1 sm:gap-2 flex-shrink-0'>
								{/* Video Call Button */}
								<button
									onClick={handleStartVideoCall}
									className="p-2 sm:p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
									title="Start Video Call"
								>
									<VideoCameraIcon className="w-5 h-5 sm:w-6 sm:h-6" />
								</button>
								
								{/* More Options Button */}
								{messages && messages.length > 0 && (
									<button
										onClick={toggleSelectionMode}
										className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
										title="More options"
									>
										<MoreVertical size={18} className="sm:w-5 sm:h-5" />
									</button>
								)}
							</div>
						</div>
						)}
					</div>
					
					{/* Messages Area - Takes remaining space */}
					<div className='flex-1 min-h-0 mobile-messages-area'>
						<Messages 
							isSelectionMode={isSelectionMode}
							selectedMessages={selectedMessages}
							onMessageSelect={handleMessageSelect}
						/>
					</div>
					
					{/* Fixed Input */}
					<div className='flex-shrink-0'>
						<MessageInput onGifPickerToggle={handleGifPickerToggle} />
					</div>
				</>
			)}

			{/* Chat Background Selector Modal */}
			{showBackgroundSelector && (
				<ChatBackgroundSelector
					conversationId={selectedConversation?._id}
					currentBackground={selectedConversation?.chatBackground || ""}
					onClose={() => setShowBackgroundSelector(false)}
					onBackgroundChange={handleBackgroundChange}
				/>
			)}

			{/* GIF Picker Modal */}
			{showGiphyPicker && (
				<div className="absolute inset-0 z-50 flex items-center justify-center">
					<GiphyPicker
						onGifSelect={handleGifSelect}
						onClose={() => setShowGiphyPicker(false)}
					/>
				</div>
			)}
		</div>
	);
};
export default MessageContainer;

const NoChatSelected = ({ isSidebarOpen, setIsSidebarOpen }) => {
	const { authUser } = useAuthContext();
	return (
		<div className='flex items-center justify-center w-full h-full bg-gradient-to-br from-white/5 to-white/10 px-4 relative'>
			{/* Mobile Sidebar Toggle Button - positioned in top-left corner, only visible on mobile */}
			<div className='lg:hidden absolute top-4 left-4 z-30'>
				<button
					onClick={() => setIsSidebarOpen(!isSidebarOpen)}
					className={`sidebar-toggle-button-top ${isSidebarOpen ? 'sidebar-open' : ''}`}
				>
					<IoChevronBack 
						size={20} 
						className="arrow-icon"
					/>
				</button>
			</div>
			<div className='text-center'>
				<div className='w-16 h-16 lg:w-24 lg:h-24 mx-auto mb-4 lg:mb-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center'>
					<TiMessages className='text-white text-2xl lg:text-4xl' />
				</div>
				<h2 className='text-lg lg:text-2xl font-bold text-white mb-2'>
					Welcome back, {authUser?.fullName || 'User'}! 👋
				</h2>
				<p className='text-gray-300 mb-4 text-sm lg:text-base'>Select a conversation to start messaging</p>
				
				<div className='flex items-center justify-center gap-2 text-gray-400'>
					<div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse'></div>
					<span className='text-xs lg:text-sm'>Ready to connect</span>
				</div>
			</div>
		</div>
	);
};

// STARTER CODE SNIPPET
// import MessageInput from "./MessageInput";
// import Messages from "./Messages";

// const MessageContainer = () => {
// 	return (
// 		<div className='md:min-w-[450px] flex flex-col'>
// 			<>
// 				{/* Header */}
// 				<div className='bg-slate-500 px-4 py-2 mb-2'>
// 					<span className='label-text'>To:</span> <span className='text-gray-900 font-bold'>John doe</span>
// 				</div>

// 				<Messages />
// 				<MessageInput />
// 			</>
// 		</div>
// 	);
// };
// export default MessageContainer;
