import { useNavigate } from "react-router-dom";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";

const formatLastMessageTime = (timestamp) => {
	if (!timestamp) return "";
	const date = new Date(timestamp);
	const now = new Date();
	const diffH = (now - date) / (1000 * 60 * 60);
	if (diffH < 1) return "now";
	if (diffH < 24) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
	if (diffH < 48) return "Yesterday";
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const previewMessage = (msg) => {
	if (!msg) return "";
	if (msg.message?.startsWith("[GIF]")) return "GIF";
	if (msg.messageType === "image") return "📷 Photo";
	if (msg.messageType === "document") return "📄 Document";
	return msg.message || "";
};

const Conversation = ({ conversation, onConversationSelect, isNewMessage = false }) => {
	const navigate = useNavigate();
	const { selectedConversation, setSelectedConversation } = useConversation();
	const { onlineUsers } = useSocketContext();

	const isSelected = selectedConversation?._id === conversation._id;
	const isOnline = onlineUsers.includes(conversation.participant._id);
	const hasUnread = conversation.unreadCount > 0 && !isSelected;
	const initial = (conversation.participant.fullName || "U").charAt(0).toUpperCase();

	const handleClick = () => {
		setSelectedConversation(conversation);
		if (onConversationSelect) onConversationSelect();
	};

	return (
		<button
			onClick={handleClick}
			className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-[#222D34]/40 ${
				isSelected ? "bg-[#2A3942]" : "hover:bg-[#202C33]"
			} ${isNewMessage ? "animate-[slideInFromTop_0.3s_ease-out]" : ""}`}
		>
			{/* Avatar */}
			<div className='relative flex-shrink-0'>
				<div
					className='w-12 h-12 rounded-full bg-[#2A3942] overflow-hidden flex items-center justify-center text-[#E9EDEF] font-semibold text-sm'
					onClick={(e) => {
						e.stopPropagation();
						navigate(`/user/${conversation.participant._id}`);
					}}
					title={`View ${conversation.participant.fullName}'s profile`}
				>
					{conversation.participant.profilePic ? (
						<img
							src={conversation.participant.profilePic}
							alt=''
							className='w-full h-full object-cover'
							onError={(e) => {
								e.currentTarget.style.display = "none";
							}}
						/>
					) : (
						initial
					)}
				</div>
				{isOnline && (
					<span className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00A884] ring-2 ring-[#111B21] rounded-full' />
				)}
			</div>

			{/* Info */}
			<div className='flex-1 min-w-0'>
				<div className='flex items-center justify-between gap-2'>
					<h3 className='truncate text-[15px] font-medium text-[#E9EDEF]'>
						{conversation.participant.fullName || "Unknown"}
					</h3>
					{conversation.lastMessage && (
						<span
							className={`text-[12px] flex-shrink-0 ${
								hasUnread ? "text-[#00A884] font-medium" : "text-[#8696A0]"
							}`}
						>
							{formatLastMessageTime(conversation.lastMessage.createdAt)}
						</span>
					)}
				</div>
				<div className='flex items-center justify-between gap-2 mt-0.5'>
					<p className='truncate text-[13px] text-[#8696A0]'>
						{previewMessage(conversation.lastMessage) || "Say hi 👋"}
					</p>
					{hasUnread && (
						<span className='flex-shrink-0 min-w-[20px] h-[20px] px-1.5 bg-[#00A884] text-[#111B21] text-[11px] font-bold rounded-full flex items-center justify-center'>
							{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
						</span>
					)}
				</div>
			</div>
		</button>
	);
};

export default Conversation;
