import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import useVideoCallStatus from "../../hooks/useVideoCallStatus";
import ChatBackgroundSelector from "../chat-background/ChatBackgroundSelector";
import VideoCallMaintenanceNotice from "./VideoCallMaintenanceNotice";
import Avatar from "../Avatar";
import toast from "react-hot-toast";

const MessageContainer = ({ isSidebarOpen, setIsSidebarOpen }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { selectedConversation, setSelectedConversation, messages, updateConversationBackground } = useConversation();
	const { onlineUsers } = useSocketContext();
	const { loading: deleteLoading, deleteMultipleMessages } = useDeleteMultipleMessages();
	const { authUser } = useAuthContext();
	const { socket } = useSocketContext();
	const { startOutgoingCall } = useVideoCall();
	const { sendGif } = useSendGif();
	const { isVideoCallEnabled } = useVideoCallStatus();
	
	// GIF picker state
	const [showGiphyPicker, setShowGiphyPicker] = useState(false);
	
	// Message selection state
	const [selectedMessages, setSelectedMessages] = useState(new Set());
	const [isSelectionMode, setIsSelectionMode] = useState(false);
	
	// Chat background state
	const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
	const [chatBackground, setChatBackground] = useState(selectedConversation?.chatBackground || authUser?.defaultChatBackground || "");
	const [isDarkBackground, setIsDarkBackground] = useState(false);
	
	// Video call maintenance notice state
	const [showVideoCallMaintenance, setShowVideoCallMaintenance] = useState(false);
	
	// Check if the selected conversation user is online
	const isOnline = selectedConversation ? onlineUsers.includes(selectedConversation.participant?._id) : false;

	useEffect(() => {
		// cleanup function (unmounts)
		return () => setSelectedConversation(null);
	}, [setSelectedConversation]);

	// If we navigated here with a target user (e.g. "Message" button on a profile),
	// open that chat once. Runs after the cleanup-on-mount that StrictMode triggers,
	// so the conversation isn't wiped before MessageContainer can render it.
	useEffect(() => {
		const target = location.state?.openWithUser;
		if (!target?._id) return;
		setSelectedConversation({
			_id: target._id,
			participant: target,
			unreadCount: 0,
			lastMessage: null,
			lastMessageTime: new Date(),
			createdAt: new Date(),
		});
		// Clear the state so a future back/forward doesn't re-open it.
		window.history.replaceState({}, "");
	}, [location.state, setSelectedConversation]);

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
		// Check if video calling is enabled
		if (!isVideoCallEnabled) {
			setShowVideoCallMaintenance(true);
			return;
		}

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

	const participantInitial = (selectedConversation?.participant?.fullName || "U").charAt(0).toUpperCase();

	const customBg = formatBackgroundForCSS(chatBackground || authUser?.defaultChatBackground || "");

	return (
		<div
			key={`${selectedConversation?._id}-${chatBackground}-${authUser?.defaultChatBackground}`}
			className={`flex-1 flex flex-col h-full relative min-w-0 overflow-hidden ${customBg ? "" : "chat-doodle"}`}
			style={
				customBg
					? {
						background: customBg,
						backgroundSize: "cover",
						backgroundPosition: "center",
						backgroundRepeat: "no-repeat",
					}
					: undefined
			}
		>
			{!selectedConversation ? (
				<NoChatSelected isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
			) : (
				<>
					{/* Header */}
					<header
						className={`flex-shrink-0 px-3 sm:px-4 h-14 flex items-center bg-[#202C33] ${
							isSelectionMode ? "z-40" : "z-10"
						} relative mobile-header chat-header lg:pl-4 pl-16`}
					>
						{isSelectionMode ? (
							<div className='flex items-center justify-between w-full gap-2'>
								<div className='flex items-center gap-2 sm:gap-3'>
									<button
										onClick={handleCancelSelection}
										className='w-8 h-8 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-white/5 flex items-center justify-center transition-colors'
									>
										<FaTimes size={16} />
									</button>
									<span className='text-[#E9EDEF] text-sm font-medium'>
										{selectedMessages.size} selected
									</span>
								</div>
								<div className='flex items-center gap-1.5'>
									{selectedMessages.size < (messages?.length || 0) && (
										<button
											onClick={handleSelectAll}
											className='px-3 py-1.5 bg-[#2A3942] hover:bg-[#374248] text-[#E9EDEF] text-xs rounded-lg font-medium transition-colors'
										>
											Select all
										</button>
									)}
									<button
										onClick={() => handleBulkDelete(false)}
										disabled={deleteLoading || selectedMessages.size === 0}
										className='px-3 py-1.5 bg-[#2A3942] hover:bg-[#374248] text-[#E9EDEF] text-xs rounded-lg font-medium transition-colors disabled:opacity-50'
									>
										<span className='hidden sm:inline'>Delete for me</span>
										<span className='sm:hidden'>Me</span>
									</button>
									<button
										onClick={() => handleBulkDelete(true)}
										disabled={deleteLoading || selectedMessages.size === 0}
										className='px-3 py-1.5 bg-[#F15C6D] hover:bg-[#e0495a] text-white text-xs rounded-lg font-medium transition-colors disabled:opacity-50'
									>
										<span className='hidden sm:inline'>Delete for all</span>
										<span className='sm:hidden'>All</span>
									</button>
								</div>
							</div>
						) : (
							<div className='flex items-center justify-between w-full gap-2'>
								<div className='flex items-center gap-3 min-w-0 flex-1'>
									<button
										onClick={() => setIsSidebarOpen(!isSidebarOpen)}
										className='lg:hidden w-8 h-8 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-white/5 flex items-center justify-center transition-colors'
										title='Toggle sidebar'
									>
										<IoChevronBack size={18} />
									</button>

									<Avatar
										src={selectedConversation.participant?.profilePic}
										alt={selectedConversation.participant?.fullName}
										size={40}
										className='cursor-pointer hover:opacity-90 transition'
										onClick={() => navigate(`/user/${selectedConversation.participant._id}`)}
										title={`View ${selectedConversation.participant.fullName}'s profile`}
									/>

									<div className='min-w-0 flex-1 cursor-pointer' onClick={() => navigate(`/user/${selectedConversation.participant._id}`)}>
										<h3 className='text-[#E9EDEF] font-medium text-[15px] truncate leading-tight'>
											{selectedConversation.participant?.fullName}
										</h3>
										<p className={`text-[12px] truncate leading-tight mt-0.5 ${isOnline ? "text-[#00A884]" : "text-[#8696A0]"}`}>
											{isOnline ? "online" : "last seen recently"}
										</p>
									</div>
								</div>

								<div className='flex items-center gap-1 flex-shrink-0'>
									<button
										onClick={handleStartVideoCall}
										className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
											isVideoCallEnabled
												? "text-[#AEBAC1] hover:text-[#E9EDEF] hover:bg-white/5"
												: "text-[#667781] hover:bg-white/5"
										}`}
										title={isVideoCallEnabled ? "Start video call" : "Video calling is under maintenance"}
									>
										<VideoCameraIcon className='w-5 h-5' />
									</button>
									{messages && messages.length > 0 && (
										<button
											onClick={toggleSelectionMode}
											className='w-9 h-9 rounded-full text-[#AEBAC1] hover:text-[#E9EDEF] hover:bg-white/5 flex items-center justify-center transition-colors'
											title='More options'
										>
											<MoreVertical size={18} />
										</button>
									)}
								</div>
							</div>
						)}
					</header>
					
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
				<div className="absolute inset-0 z-[10000] flex items-center justify-center">
					<GiphyPicker
						onGifSelect={handleGifSelect}
						onClose={() => setShowGiphyPicker(false)}
					/>
				</div>
			)}

			{/* Video Call Maintenance Notice */}
			{showVideoCallMaintenance && (
				<VideoCallMaintenanceNotice
					onClose={() => setShowVideoCallMaintenance(false)}
				/>
			)}
		</div>
	);
};
export default MessageContainer;

const NoChatSelected = ({ isSidebarOpen, setIsSidebarOpen }) => {
	const { authUser } = useAuthContext();
	return (
		<div className='flex items-center justify-center w-full h-full bg-[#222E35] px-4 relative border-l-4 border-[#00A884]/40'>
			<div className='lg:hidden absolute top-4 left-4 z-30'>
				<button
					onClick={() => setIsSidebarOpen(!isSidebarOpen)}
					className={`sidebar-toggle-button-top ${isSidebarOpen ? "sidebar-open" : ""}`}
				>
					<IoChevronBack size={20} className='arrow-icon' />
				</button>
			</div>
			<div className='text-center max-w-sm'>
				<div className='w-20 h-20 mx-auto mb-6 rounded-full bg-[#2A3942] flex items-center justify-center'>
					<TiMessages className='text-[#8696A0] text-4xl' />
				</div>
				<h2 className='text-2xl font-light text-[#E9EDEF] mb-2'>
					Welcome, {authUser?.fullName?.split(" ")[0] || "there"}
				</h2>
				<p className='text-[#8696A0] text-sm'>Select a chat from the sidebar to start messaging.</p>
				<p className='text-[#667781] text-xs mt-6'>Your messages are end-to-end private.</p>
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
