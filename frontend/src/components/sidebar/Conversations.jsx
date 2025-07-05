import { useNavigate } from "react-router-dom";
import useGetUsers from "../../hooks/useGetUsers";
import useConversation from "../../zustand/useConversation";
import { getRandomEmoji } from "../../utils/emojis";
import Conversation from "./Conversation";

const Conversations = ({ onConversationSelect }) => {
	const navigate = useNavigate();
	const { users } = useGetUsers();
	const { setSelectedConversation, searchTerm } = useConversation();

	// Filter users based on search term
	const filteredUsers = users.filter(user => {
		if (!searchTerm.trim()) return true;
		return user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase().trim());
	});

	const handleUserClick = (user) => {
		// Create a conversation object for this user
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

	return (
		<div className='py-2 flex flex-col overflow-auto'>
			{/* Search results indicator */}
			{searchTerm.trim() && (
				<div className='px-3 py-2 text-sm text-gray-400 border-b border-white/10 mb-2'>
					{filteredUsers.length === 0 
						? `No users found for "${searchTerm}"`
						: `Found ${filteredUsers.length} user${filteredUsers.length === 1 ? '' : 's'} for "${searchTerm}"`
					}
				</div>
			)}

			{/* Show all users */}
			{filteredUsers.map((user, idx) => (
				<div
					key={user._id}
					className='flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer border-b border-white/10 last:border-b-0 transition-colors'
					onClick={() => handleUserClick(user)}
				>
					<div 
						className='w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity'
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
						<p className='text-white font-medium truncate'>{user.fullName}</p>
						<p className='text-gray-400 text-sm truncate'>{user.email}</p>
					</div>
				</div>
			))}

			{filteredUsers.length === 0 && !searchTerm.trim() && (
				<div className='text-center py-8 text-gray-400'>
					<p>No users found</p>
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
