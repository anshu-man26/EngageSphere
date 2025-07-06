import { useNavigate } from "react-router-dom";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";

const Conversation = ({ conversation, lastIdx, emoji, onConversationSelect }) => {
	const navigate = useNavigate();
	const { selectedConversation, setSelectedConversation } = useConversation();

	const isSelected = selectedConversation?._id === conversation._id;
	const { onlineUsers } = useSocketContext();
	const isOnline = onlineUsers.includes(conversation.participant._id);

	// Format last message time
	const formatLastMessageTime = (timestamp) => {
		if (!timestamp) return '';
		
		const date = new Date(timestamp);
		const now = new Date();
		const diffInHours = (now - date) / (1000 * 60 * 60);
		
		if (diffInHours < 1) {
			return 'Just now';
		} else if (diffInHours < 24) {
			return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
		} else if (diffInHours < 48) {
			return 'Yesterday';
		} else {
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		}
	};

	const handleClick = () => {
		if (conversation) {
			setSelectedConversation(conversation);
			// Call the callback to close sidebar on mobile
			if (onConversationSelect) {
				onConversationSelect();
			}
		}
	};

	return (
		<>
			<div
				className={`flex items-center gap-2 sm:gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 ${
					isSelected 
						? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30' 
						: conversation.unreadCount > 0
							? 'hover:bg-white/10 border border-red-500/20 bg-red-500/5'
							: 'hover:bg-white/10 border border-transparent'
				}`}
				onClick={handleClick}
			>
				{/* Avatar */}
				<div className='relative flex-shrink-0'>
					<div 
						className='w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity'
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/user/${conversation.participant._id}`);
						}}
						title={`View ${conversation.participant.fullName}'s profile`}
					>
						<img 
							src={conversation.participant.profilePic || 'https://cdn0.iconfinder.com/data/icons/communication-line-10/24/account_profile_user_contact_person_avatar_placeholder-512.png'} 
							alt={`${conversation.participant.fullName || 'User'} avatar`}
							className='w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover'
							onError={(e) => {
								e.target.src = 'https://cdn0.iconfinder.com/data/icons/communication-line-10/24/account_profile_user_contact_person_avatar_placeholder-512.png';
							}}
						/>
					</div>
					{/* Online indicator */}
					{isOnline && (
						<div className='absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full'></div>
					)}
					{/* Unread count badge */}
					{conversation.unreadCount > 0 && !isSelected && (
						<div className='absolute -top-1 -right-1 min-w-[18px] h-4 sm:min-w-[20px] sm:h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center animate-pulse shadow-lg'>
							<span className='text-xs text-white font-bold px-1'>
								{conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
							</span>
						</div>
					)}
				</div>

				{/* User info */}
				<div className='flex-1 min-w-0'>
					<div className='flex items-center justify-between'>
						<h3 className={`font-semibold truncate text-sm sm:text-base ${conversation.unreadCount > 0 && !isSelected ? 'text-white' : 'text-gray-300'}`}>
							{conversation.participant.fullName || 'Unknown User'}
						</h3>
						<span className='text-base sm:text-lg flex-shrink-0 ml-2'>{emoji}</span>
					</div>
					<div className='flex items-center justify-between mt-1'>
						<div className='flex items-center gap-1 sm:gap-2 flex-1 min-w-0'>
							<div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
							<span className='text-xs text-gray-400 truncate'>
								{conversation.lastMessage ? (
									conversation.lastMessage.message && conversation.lastMessage.message.startsWith('[GIF]') 
										? 'GIF' 
										: conversation.lastMessage.message
								) : 'No messages yet'}
							</span>
						</div>
						{conversation.lastMessage && (
							<span className='text-xs text-gray-500 ml-1 sm:ml-2 flex-shrink-0'>
								{formatLastMessageTime(conversation.lastMessage.createdAt)}
							</span>
						)}
					</div>
				</div>
			</div>

			{!lastIdx && <div className='h-px bg-white/10 my-2'></div>}
		</>
	);
};
export default Conversation;

// STARTER CODE SNIPPET
// const Conversation = () => {
// 	return (
// 		<>
// 			<div className='flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer'>
// 				<div className='avatar online'>
// 					<div className='w-12 rounded-full'>
// 						<img
// 							src='https://cdn0.iconfinder.com/data/icons/communication-line-10/24/account_profile_user_contact_person_avatar_placeholder-512.png'
// 							alt='user avatar'
// 						/>
// 					</div>
// 				</div>

// 				<div className='flex flex-col flex-1'>
// 					<div className='flex gap-3 justify-between'>
// 						<p className='font-bold text-gray-200'>John Doe</p>
// 						<span className='text-xl'>🎃</span>
// 					</div>
// 				</div>
// 			</div>

// 			<div className='divider my-0 py-0 h-1' />
// 		</>
// 	);
// };
// export default Conversation;
