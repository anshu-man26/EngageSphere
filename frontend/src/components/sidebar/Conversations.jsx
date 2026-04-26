import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import useGetConversations from "../../hooks/useGetConversations";
import useGetUsers from "../../hooks/useGetUsers";
import useConversation from "../../zustand/useConversation";
import Conversation from "./Conversation";
import Avatar from "../Avatar";

const Conversations = ({ onConversationSelect }) => {
	const navigate = useNavigate();
	const { conversations, loading } = useGetConversations();
	const { users } = useGetUsers();
	const { setSelectedConversation, searchTerm } = useConversation();
	const previousConversationsRef = useRef([]);
	const [animatedConversations, setAnimatedConversations] = useState(new Set());

	useEffect(() => {
		if (conversations.length > 0 && previousConversationsRef.current.length > 0) {
			const newAnimated = new Set();
			conversations.forEach((c) => {
				const prev = previousConversationsRef.current.find((p) => p._id === c._id);
				if (prev) {
					const movedToTop =
						conversations.indexOf(c) === 0 &&
						previousConversationsRef.current.indexOf(prev) !== 0;
					if (movedToTop) newAnimated.add(c._id);
				}
			});
			if (newAnimated.size > 0) {
				setAnimatedConversations(newAnimated);
				setTimeout(() => setAnimatedConversations(new Set()), 800);
			}
		}
		previousConversationsRef.current = conversations;
	}, [conversations]);

	const term = searchTerm.trim().toLowerCase();

	const filteredConversations = useMemo(() => {
		if (!term) return conversations;
		return conversations.filter((c) =>
			(c.participant?.fullName || "").toLowerCase().includes(term),
		);
	}, [conversations, term]);

	const filteredUsers = useMemo(() => {
		const existing = new Set(conversations.map((c) => c.participant._id));
		const available = users.filter((u) => !existing.has(u._id));
		if (!term) return available;
		return available.filter((u) =>
			(u.fullName || "").toLowerCase().includes(term),
		);
	}, [conversations, users, term]);

	const handleUserClick = (user) => {
		setSelectedConversation({
			_id: user._id,
			participant: user,
			unreadCount: 0,
			lastMessage: null,
			lastMessageTime: new Date(),
			createdAt: new Date(),
		});
		if (onConversationSelect) onConversationSelect();
	};

	if (loading) {
		return <div className='py-6 text-center text-[#8696A0] text-sm'>Loading…</div>;
	}

	const totalResults = filteredConversations.length + filteredUsers.length;

	return (
		<div className='h-full overflow-y-auto conversation-list-container'>
			{term && (
				<p className='px-3 pt-3 pb-1 text-[11px] uppercase tracking-wider text-[#00A884] font-medium'>
					{totalResults === 0 ? `No results for "${searchTerm}"` : `${totalResults} result${totalResults === 1 ? "" : "s"}`}
				</p>
			)}

			{filteredConversations.length > 0 && (
				<div>
					{filteredConversations.map((c) => (
						<Conversation
							key={c._id}
							conversation={c}
							onConversationSelect={onConversationSelect}
							isNewMessage={animatedConversations.has(c._id)}
						/>
					))}
				</div>
			)}

			{filteredUsers.length > 0 && (
				<>
					<p className='px-3 pt-4 pb-1 text-[11px] uppercase tracking-wider text-[#00A884] font-medium'>
						{term ? "Other contacts" : "Start a new chat"}
					</p>
					<div>
						{filteredUsers.map((user) => (
							<button
								key={user._id}
								onClick={() => handleUserClick(user)}
								className='w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#202C33] transition-colors border-b border-[#222D34]/40'
							>
								<Avatar
									src={user.profilePic}
									alt={user.fullName}
									size={48}
									onClick={(e) => {
										e.stopPropagation();
										navigate(`/user/${user._id}`);
									}}
								/>
								<div className='flex-1 min-w-0'>
									<p className='text-[15px] font-medium text-[#E9EDEF] truncate'>{user.fullName}</p>
									<p className='text-[13px] text-[#8696A0] truncate'>Click to start chat</p>
								</div>
							</button>
						))}
					</div>
				</>
			)}

			{filteredConversations.length === 0 && filteredUsers.length === 0 && !term && (
				<div className='py-12 text-center text-[#8696A0]'>
					<p className='text-sm'>No conversations yet</p>
					<p className='text-xs mt-1'>Start a chat to see it here</p>
				</div>
			)}
		</div>
	);
};

export default Conversations;
