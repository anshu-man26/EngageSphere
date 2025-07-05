import { useAuthContext } from "../../context/AuthContext";
import { FaUser, FaCog } from "react-icons/fa";
import { Link } from "react-router-dom";

const ProfileButton = () => {
	const { authUser } = useAuthContext();

	return (
		<Link 
			to="/profile"
			className='flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-white/10 border border-transparent hover:border-white/20'
		>
			{/* Avatar */}
			<div className='relative'>
				<div className='w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden'>
					<img 
						src={authUser?.profilePic || 'https://cdn0.iconfinder.com/data/icons/communication-line-10/24/account_profile_user_contact_person_avatar_placeholder-512.png'} 
						alt={`${authUser?.fullName || 'User'} avatar`}
						className='w-12 h-12 rounded-full object-cover'
						onError={(e) => {
							e.target.src = 'https://cdn0.iconfinder.com/data/icons/communication-line-10/24/account_profile_user_contact_person_avatar_placeholder-512.png';
						}}
					/>
				</div>
				<div className='absolute -bottom-1 -right-1 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center'>
					<FaCog className='text-white text-xs' />
				</div>
			</div>

			{/* User info */}
			<div className='flex-1 min-w-0'>
				<div className='flex items-center justify-between'>
					<h3 className='font-semibold text-white truncate'>
						{authUser?.fullName || 'Unknown User'}
					</h3>
				</div>
				<div className='flex items-center gap-2 mt-1'>
					<div className='w-2 h-2 bg-green-500 rounded-full'></div>
					<span className='text-xs text-gray-400'>
						Edit Profile
					</span>
				</div>
			</div>
		</Link>
	);
};

export default ProfileButton; 