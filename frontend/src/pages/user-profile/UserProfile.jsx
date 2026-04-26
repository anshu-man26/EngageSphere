import { useParams, Link, useNavigate } from "react-router-dom";
import {
	FaArrowLeft,
	FaUser,
	FaCalendar,
	FaEnvelope,
	FaEdit,
	FaPaperPlane,
	FaVideo,
	FaAt,
} from "react-icons/fa";
import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import useGetUserProfile from "../../hooks/useGetUserProfile";

const formatJoined = (dateString) => {
	if (!dateString) return "—";
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
};

const UserProfile = () => {
	const { userId } = useParams();
	const navigate = useNavigate();
	const { authUser } = useAuthContext();
	const { onlineUsers } = useSocketContext();
	const { setSelectedConversation } = useConversation();
	const { user, loading, error } = useGetUserProfile(userId);

	const isSelf = user?._id === authUser?._id;
	const isOnline = user?._id ? onlineUsers.includes(user._id) : false;
	const initial = (user?.fullName || "U").charAt(0).toUpperCase();

	const openChat = () => {
		if (!user) return;
		setSelectedConversation({
			_id: user._id,
			participant: user,
			unreadCount: 0,
			lastMessage: null,
			lastMessageTime: new Date(),
			createdAt: new Date(),
		});
		navigate("/");
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-slate-950 flex items-center justify-center'>
				<div className='animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent' />
			</div>
		);
	}

	if (error || !user) {
		return (
			<div className='min-h-screen bg-slate-950 flex items-center justify-center px-4'>
				<div className='text-center max-w-sm'>
					<div className='w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 flex items-center justify-center'>
						<FaUser className='text-red-400 text-xl' />
					</div>
					<h2 className='text-xl font-semibold text-slate-100 mb-1'>Profile not found</h2>
					<p className='text-slate-400 text-sm mb-6'>{error || "We couldn't load this user."}</p>
					<Link
						to='/'
						className='inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-sm font-medium transition-colors'
					>
						<FaArrowLeft />
						Back to chat
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-slate-950'>
			{/* Top bar */}
			<div className='sticky top-0 z-10 bg-slate-950/95 backdrop-blur-md border-b border-slate-800'>
				<div className='max-w-2xl mx-auto px-4 h-14 flex items-center justify-between'>
					<button
						onClick={() => navigate(-1)}
						className='inline-flex items-center gap-2 text-slate-300 hover:text-slate-100 hover:bg-slate-800 px-3 py-1.5 rounded-lg text-sm transition-colors'
					>
						<FaArrowLeft className='text-xs' />
						Back
					</button>
					{isSelf && (
						<Link
							to='/profile'
							className='inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 ring-1 ring-emerald-500/30 rounded-lg text-sm font-medium transition-colors'
						>
							<FaEdit className='text-xs' />
							Edit profile
						</Link>
					)}
				</div>
			</div>

			<div className='max-w-2xl mx-auto px-4 py-8'>
				{/* Hero card */}
				<div className='bg-slate-900 ring-1 ring-slate-800 rounded-2xl p-6 sm:p-8'>
					<div className='flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7'>
						{/* Avatar */}
						<div className='relative flex-shrink-0'>
							<div className='w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-800 ring-2 ring-slate-700 overflow-hidden flex items-center justify-center text-3xl sm:text-4xl font-semibold text-slate-200'>
								{user.profilePic ? (
									<img
										src={user.profilePic}
										alt={user.fullName || "Profile"}
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
								<span className='absolute bottom-1.5 right-1.5 w-4 h-4 bg-emerald-400 ring-2 ring-slate-900 rounded-full' />
							)}
						</div>

						{/* Identity */}
						<div className='flex-1 text-center sm:text-left min-w-0'>
							<h1 className='text-2xl sm:text-3xl font-bold text-slate-100 leading-tight truncate'>
								{user.fullName || "Unknown user"}
							</h1>
							{user.username && (
								<p className='text-slate-400 text-sm mt-1 inline-flex items-center gap-1'>
									<FaAt className='text-xs opacity-60' />
									{user.username}
								</p>
							)}

							{/* Status pill */}
							<div className='mt-3 inline-flex items-center gap-2 px-2.5 py-1 bg-slate-800 ring-1 ring-slate-700 rounded-full'>
								<span
									className={`w-1.5 h-1.5 rounded-full ${
										isOnline ? "bg-emerald-400" : "bg-slate-500"
									}`}
								/>
								<span
									className={`text-xs font-medium ${
										isOnline ? "text-emerald-400" : "text-slate-400"
									}`}
								>
									{isOnline ? "Online" : "Offline"}
								</span>
							</div>

							{/* Bio (if present) */}
							{user.bio && (
								<p className='mt-4 text-slate-300 text-sm leading-relaxed'>{user.bio}</p>
							)}

							{/* Member since */}
							<p className='mt-4 text-slate-500 text-xs inline-flex items-center gap-1.5'>
								<FaCalendar className='opacity-70' />
								Member since {formatJoined(user.createdAt)}
							</p>
						</div>
					</div>

					{/* Actions */}
					{!isSelf && (
						<div className='mt-6 sm:mt-7 grid grid-cols-2 gap-2'>
							<button
								onClick={openChat}
								className='flex items-center justify-center gap-2 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm transition-colors shadow-md shadow-emerald-900/30'
							>
								<FaPaperPlane />
								Message
							</button>
							<button
								onClick={openChat}
								className='flex items-center justify-center gap-2 h-11 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-medium text-sm transition-colors'
							>
								<FaVideo />
								Video call
							</button>
						</div>
					)}
				</div>

				{/* Details (only if there's something worth showing besides what's in the hero) */}
				{user.email && (
					<div className='mt-4 bg-slate-900 ring-1 ring-slate-800 rounded-2xl p-6'>
						<p className='text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-3'>
							Contact
						</p>
						<div className='flex items-center gap-3'>
							<div className='w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0'>
								<FaEnvelope />
							</div>
							<div className='min-w-0 flex-1'>
								<p className='text-[11px] text-slate-500 uppercase tracking-wider'>Email</p>
								<a
									href={`mailto:${user.email}`}
									className='text-sm text-slate-100 hover:text-emerald-400 transition-colors truncate block'
								>
									{user.email}
								</a>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default UserProfile;
