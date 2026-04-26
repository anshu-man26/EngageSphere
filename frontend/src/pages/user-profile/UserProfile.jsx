import { useParams, Link, useNavigate } from "react-router-dom";
import {
	FaArrowLeft,
	FaUser,
	FaCalendar,
	FaEnvelope,
	FaEdit,
	FaPaperPlane,
	FaAt,
	FaCheckCircle,
	FaCopy,
} from "react-icons/fa";
import { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import useGetUserProfile from "../../hooks/useGetUserProfile";
import Avatar from "../../components/Avatar";

const formatJoined = (dateString) => {
	if (!dateString) return "—";
	const d = new Date(dateString);
	return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
};

const formatJoinedShort = (dateString) => {
	if (!dateString) return "—";
	const d = new Date(dateString);
	return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
};

const Stat = ({ label, value, icon: Icon, accent }) => (
	<div className='bg-[#111B21] ring-1 ring-[#222D34] rounded-xl p-4'>
		<div className='flex items-center gap-2 mb-1.5'>
			{Icon && <Icon className={`text-xs ${accent || "text-[#8696A0]"}`} />}
			<p className='text-[10px] font-medium text-[#8696A0] uppercase tracking-wider'>{label}</p>
		</div>
		<p className='text-sm font-semibold text-[#E9EDEF] truncate'>{value}</p>
	</div>
);

const UserProfile = () => {
	const { userId } = useParams();
	const navigate = useNavigate();
	const { authUser } = useAuthContext();
	const { onlineUsers } = useSocketContext();
	const { user, loading, error } = useGetUserProfile(userId);
	const [emailCopied, setEmailCopied] = useState(false);

	const isSelf = user?._id === authUser?._id;
	const isOnline = user?._id ? onlineUsers.includes(user._id) : false;

	const openChat = () => {
		if (!user) return;
		navigate("/", { state: { focusChat: true, openWithUser: user } });
	};

	const handleCopyEmail = async () => {
		if (!user?.email) return;
		try {
			await navigator.clipboard.writeText(user.email);
			setEmailCopied(true);
			setTimeout(() => setEmailCopied(false), 1500);
		} catch {}
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-[#0B141A] flex items-center justify-center'>
				<div className='animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent' />
			</div>
		);
	}

	if (error || !user) {
		return (
			<div className='min-h-screen bg-[#0B141A] flex items-center justify-center px-4'>
				<div className='text-center max-w-sm'>
					<div className='w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 flex items-center justify-center'>
						<FaUser className='text-red-400 text-xl' />
					</div>
					<h2 className='text-xl font-semibold text-[#E9EDEF] mb-1'>Profile not found</h2>
					<p className='text-[#8696A0] text-sm mb-6'>{error || "We couldn't load this user."}</p>
					<Link
						to='/'
						className='inline-flex items-center gap-2 px-4 py-2 bg-[#202C33] hover:bg-[#2A3942] text-[#E9EDEF] rounded-lg text-sm font-medium transition-colors'
					>
						<FaArrowLeft />
						Back to chat
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-[#0B141A]'>
			{/* Top bar */}
			<div className='sticky top-0 z-20 bg-[#0B141A]/95 backdrop-blur-md border-b border-[#222D34]'>
				<div className='max-w-3xl mx-auto px-4 h-14 flex items-center justify-between'>
					<button
						onClick={() => navigate(-1)}
						className='inline-flex items-center gap-2 text-[#D1D7DB] hover:text-[#E9EDEF] hover:bg-[#202C33] px-3 py-1.5 rounded-lg text-sm transition-colors'
					>
						<FaArrowLeft className='text-xs' />
						Back
					</button>
					<h1 className='text-sm font-semibold text-[#E9EDEF]'>Profile</h1>
					{isSelf ? (
						<Link
							to='/profile'
							className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/30 rounded-lg text-xs font-medium transition-colors'
						>
							<FaEdit className='text-[10px]' />
							Edit
						</Link>
					) : (
						<div className='w-12' />
					)}
				</div>
			</div>

			<div className='max-w-3xl mx-auto px-4 pb-10'>
				{/* Hero card with banner */}
				<div className='bg-[#111B21] ring-1 ring-[#222D34] rounded-2xl overflow-hidden mt-4'>
					{/* Banner */}
					<div className='relative h-32 sm:h-40 bg-gradient-to-br from-emerald-700/40 via-[#1d3a35] to-[#0f2722] overflow-hidden'>
						<div
							className='absolute inset-0 opacity-30'
							style={{
								backgroundImage:
									"radial-gradient(circle at 20% 50%, rgba(0,168,132,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 30%, rgba(0,168,132,0.25) 0%, transparent 50%)",
							}}
						/>
					</div>

					{/* Avatar overlapping banner */}
					<div className='px-5 sm:px-7 -mt-14 sm:-mt-16 pb-6 sm:pb-7'>
						<div className='flex items-end gap-4 sm:gap-5 mb-4'>
							<div className='relative flex-shrink-0'>
								<div className='p-1 rounded-full bg-[#111B21]'>
									<Avatar
										src={user.profilePic}
										alt={user.fullName || "Profile"}
										size={120}
										bg='bg-[#202C33]'
										iconColor='text-[#8696A0]'
									/>
								</div>
								{isOnline && (
									<span className='absolute bottom-2 right-2 flex h-4 w-4'>
										<span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60' />
										<span className='relative inline-flex h-4 w-4 rounded-full bg-emerald-400 ring-2 ring-[#111B21]' />
									</span>
								)}
							</div>

							{/* Quick status badge — sits at bottom-right of avatar row on desktop */}
							<div className='flex-1 min-w-0 mb-1.5 hidden sm:block'>
								<div className='flex justify-end'>
									<div className='inline-flex items-center gap-2 px-2.5 py-1 bg-[#202C33] ring-1 ring-[#374248] rounded-full'>
										<span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-[#8696A0]"}`} />
										<span className={`text-[11px] font-medium ${isOnline ? "text-emerald-400" : "text-[#8696A0]"}`}>
											{isOnline ? "Online" : "Offline"}
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Identity */}
						<div className='min-w-0'>
							<h1 className='text-2xl sm:text-[28px] font-bold text-[#E9EDEF] leading-tight truncate'>
								{user.fullName || "Unknown user"}
							</h1>
							{user.username && (
								<p className='text-[#8696A0] text-sm mt-0.5 inline-flex items-center gap-1'>
									<FaAt className='text-[10px] opacity-60' />
									{user.username}
								</p>
							)}

							{/* Mobile status pill */}
							<div className='mt-3 sm:hidden'>
								<div className='inline-flex items-center gap-2 px-2.5 py-1 bg-[#202C33] ring-1 ring-[#374248] rounded-full'>
									<span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-[#8696A0]"}`} />
									<span className={`text-[11px] font-medium ${isOnline ? "text-emerald-400" : "text-[#8696A0]"}`}>
										{isOnline ? "Online" : "Offline"}
									</span>
								</div>
							</div>

							{user.bio && (
								<p className='mt-4 text-[#D1D7DB] text-[15px] leading-relaxed whitespace-pre-wrap'>
									{user.bio}
								</p>
							)}
						</div>

						{/* Actions */}
						{!isSelf && (
							<div className='mt-6'>
								<button
									onClick={openChat}
									className='w-full flex items-center justify-center gap-2 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm transition-colors shadow-md shadow-emerald-900/30'
								>
									<FaPaperPlane className='text-xs' />
									Message
								</button>
							</div>
						)}
					</div>
				</div>

				{/* Stats grid */}
				<div className='grid grid-cols-2 gap-3 mt-3'>
					<Stat
						label='Joined'
						value={formatJoinedShort(user.createdAt)}
						icon={FaCalendar}
						accent='text-emerald-400'
					/>
					<Stat
						label='Status'
						value={isOnline ? "Active now" : "Away"}
						icon={() => (
							<span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-[#8696A0]"}`} />
						)}
					/>
				</div>

				{/* About */}
				<div className='mt-3 bg-[#111B21] ring-1 ring-[#222D34] rounded-2xl p-5'>
					<p className='text-[10px] uppercase tracking-wider text-[#8696A0] font-medium mb-3'>About</p>
					<div className='space-y-3'>
						<Row icon={FaUser} label='Full name' value={user.fullName || "—"} />
						{user.username && <Row icon={FaAt} label='Username' value={user.username} />}
						<Row icon={FaCalendar} label='Member since' value={formatJoined(user.createdAt)} />
					</div>
				</div>

				{/* Contact */}
				{user.email && (
					<div className='mt-3 bg-[#111B21] ring-1 ring-[#222D34] rounded-2xl p-5'>
						<p className='text-[10px] uppercase tracking-wider text-[#8696A0] font-medium mb-3'>Contact</p>
						<div className='flex items-center gap-3'>
							<div className='w-10 h-10 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0'>
								<FaEnvelope />
							</div>
							<div className='min-w-0 flex-1'>
								<p className='text-[11px] text-[#8696A0]'>Email</p>
								<a
									href={`mailto:${user.email}`}
									className='text-sm text-[#E9EDEF] hover:text-emerald-400 transition-colors truncate block'
								>
									{user.email}
								</a>
							</div>
							<button
								onClick={handleCopyEmail}
								className='flex items-center gap-1.5 px-3 py-1.5 bg-[#202C33] hover:bg-[#2A3942] text-[#D1D7DB] rounded-lg text-xs font-medium transition-colors flex-shrink-0'
								title='Copy email'
							>
								{emailCopied ? (
									<>
										<FaCheckCircle className='text-emerald-400' />
										Copied
									</>
								) : (
									<>
										<FaCopy />
										Copy
									</>
								)}
							</button>
						</div>
					</div>
				)}

				{isSelf && (
					<p className='text-center text-[11px] text-[#54656F] mt-6'>
						This is how others see your profile.
					</p>
				)}
			</div>
		</div>
	);
};

const Row = ({ icon: Icon, label, value }) => (
	<div className='flex items-center gap-3'>
		<div className='w-8 h-8 rounded-lg bg-[#202C33] flex items-center justify-center text-[#8696A0] flex-shrink-0'>
			<Icon className='text-xs' />
		</div>
		<div className='min-w-0 flex-1'>
			<p className='text-[11px] text-[#8696A0]'>{label}</p>
			<p className='text-sm text-[#E9EDEF] truncate'>{value}</p>
		</div>
	</div>
);

export default UserProfile;
