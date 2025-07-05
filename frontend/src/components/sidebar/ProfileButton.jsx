import { useAuthContext } from "../../context/AuthContext";
import { FaUser, FaCog } from "react-icons/fa";
import { Link } from "react-router-dom";

const ProfileButton = () => {
	const { authUser } = useAuthContext();

	return (
		<Link 
			to="/profile"
			className='flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-white/10 border border-transparent hover:border-white/20 sidebar-button sidebar-profile-button'
		>
			{/* Avatar */}
			<div className='relative flex-shrink-0'>
				<div className='w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden'>
					<img 
						src={authUser?.profilePic || 'https://cdn0.iconfinder.com/data/icons/communication-line-10/24/account_profile_user_contact_person_avatar_placeholder-512.png'} 
						alt={`${authUser?.fullName || 'User'} avatar`}
						className='w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover'
						onError={(e) => {
							e.target.src = 'https://cdn0.iconfinder.com/data/icons/communication-line-10/24/account_profile_user_contact_person_avatar_placeholder-512.png';
						}}
					/>
				</div>
				<div className='absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-purple-600 rounded-full flex items-center justify-center'>
					<FaCog className='text-white text-xs' />
				</div>
			</div>

			{/* User info */}
			<div className='flex-1 min-w-0'>
				<div className='flex items-center justify-between'>
					<h3 className='font-semibold text-white truncate text-sm sm:text-base sidebar-text-truncate'>
						{authUser?.fullName || 'Unknown User'}
					</h3>
				</div>
				<div className='flex items-center gap-1 sm:gap-2 mt-1'>
					<div className='w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full'></div>
					<span className='text-xs text-gray-400 truncate sidebar-text-truncate'>
						<span className="hidden sm:inline">Edit Profile</span>
						<span className="sm:hidden">Profile</span>
					</span>
				</div>
			</div>
		</Link>
	);
};

export default ProfileButton; 