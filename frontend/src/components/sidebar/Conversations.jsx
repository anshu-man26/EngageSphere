import { useNavigate } from "react-router-dom";
import useGetConversations from "../../hooks/useGetConversations";
import useGetUsers from "../../hooks/useGetUsers";
import useConversation from "../../zustand/useConversation";
import { getRandomEmoji } from "../../utils/emojis";
import Conversation from "./Conversation";

const Conversations = ({ onConversationSelect }) => {
	const navigate = useNavigate();
	const { conversations, loading } = useGetConversations();
	const { users } = useGetUsers();
	const { setSelectedConversation, searchTerm } = useConversation();

	// Filter conversations based on search term
	const filteredConversations = conversations.filter(conversation => {
		if (!searchTerm.trim()) return true;
		const participantName = conversation.participant?.fullName || '';
		return participantName.toLowerCase().includes(searchTerm.toLowerCase().trim());
	});

	// Filter users for new chat (exclude users already in conversations)
	const existingConversationUserIds = conversations.map(conv => conv.participant._id);
	const availableUsers = users.filter(user => !existingConversationUserIds.includes(user._id));
	const filteredUsers = availableUsers.filter(user => {
		if (!searchTerm.trim()) return true;
		return user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase().trim());
	});

	const handleConversationClick = (conversation) => {
		setSelectedConversation(conversation);
		if (onConversationSelect) onConversationSelect();
	};

	const handleUserClick = (user) => {
		// Create a new conversation object for this user
		const conversation = {
			_id: user._id,
			participant: user,
			unreadCount: 0,
			lastMessage: null,
			lastMessageTime: new Date(),
			createdAt: new Date()
		};
		setSelectedConversation(conversation);
		if (onConversationSelect) onConversationSelect();
	};

	if (loading) {
		return (
			<div className='py-2 flex flex-col overflow-auto'>
				<div className='text-center py-8 text-gray-400'>
					<p>Loading conversations...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='py-2 flex flex-col overflow-auto min-w-0'>
			{/* Search results indicator */}
			{searchTerm.trim() && (
				<div className='px-3 py-2 text-sm text-gray-400 border-b border-white/10 mb-2'>
					{filteredConversations.length === 0 && filteredUsers.length === 0
						? `No results found for "${searchTerm}"`
						: `Found ${filteredConversations.length + filteredUsers.length} result${filteredConversations.length + filteredUsers.length === 1 ? '' : 's'} for "${searchTerm}"`
					}
				</div>
			)}

			{/* Show existing conversations */}
			{filteredConversations.length > 0 && (
				<>
					{filteredConversations.map((conversation, idx) => (
						<Conversation 
							key={conversation._id}
							conversation={conversation}
							lastIdx={idx === filteredConversations.length - 1 && filteredUsers.length === 0}
							emoji={getRandomEmoji()}
							onConversationSelect={onConversationSelect}
						/>
					))}
					{filteredUsers.length > 0 && <div className='h-px bg-white/10 my-2'></div>}
				</>
			)}

			{/* Show available users for new chats */}
			{filteredUsers.map((user, idx) => (
				<div
					key={user._id}
					className='flex items-center gap-2 sm:gap-3 p-3 hover:bg-white/10 cursor-pointer border-b border-white/10 last:border-b-0 transition-colors'
					onClick={() => handleUserClick(user)}
				>
					<div 
						className='w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0'
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/user/${user._id}`);
						}}
						title={`View ${user.fullName}'s profile`}
					>
						{user.profilePic ? (
							<img 
								src={user.profilePic} 
								alt={user.fullName}
								className='w-full h-full rounded-full object-cover'
							/>
						) : (
							user.fullName.charAt(0).toUpperCase()
						)}
					</div>
					<div className='flex-1 min-w-0'>
						<p className='text-white font-medium truncate text-sm sm:text-base'>{user.fullName}</p>
						<p className='text-gray-400 text-xs sm:text-sm truncate'>Click to start chat</p>
					</div>
				</div>
			))}

			{filteredConversations.length === 0 && filteredUsers.length === 0 && !searchTerm.trim() && (
				<div className='text-center py-8 text-gray-400 px-4'>
					<p>No conversations yet</p>
					<p className='text-sm mt-1'>Start a chat with someone to see conversations here</p>
				</div>
			)}
		</div>
	);
};
export default Conversations;

// STARTER CODE SNIPPET
// import Conversation from "./Conversation";

// const Conversations = () => {
// 	return (
// 		<div className='py-2 flex flex-col overflow-auto'>
// 			<Conversation />
// 			<Conversation />
// 			<Conversation />
// 			<Conversation />
// 			<Conversation />
// 			<Conversation />
// 		</div>
// 	);
// };
// export default Conversations;
