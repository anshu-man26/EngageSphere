import { Link } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { FaCog } from "react-icons/fa";

const ProfileButton = () => {
	const { authUser } = useAuthContext();
	const initial = (authUser?.fullName || "U").charAt(0).toUpperCase();

	return (
		<Link
			to='/profile'
			className='flex items-center gap-3 p-2 rounded-lg hover:bg-[#202C33] transition-colors group'
		>
			<div className='relative flex-shrink-0'>
				<div className='w-10 h-10 rounded-full bg-[#2A3942] overflow-hidden flex items-center justify-center text-[#E9EDEF] font-semibold text-sm'>
					{authUser?.profilePic ? (
						<img
							src={authUser.profilePic}
							alt={authUser?.fullName || "Profile"}
							className='w-full h-full object-cover'
							onError={(e) => {
								e.currentTarget.style.display = "none";
							}}
						/>
					) : (
						initial
					)}
				</div>
				<span className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00A884] ring-2 ring-[#111B21] rounded-full' />
			</div>

			<div className='flex-1 min-w-0'>
				<p className='text-sm font-medium text-[#E9EDEF] truncate'>
					{authUser?.fullName || "User"}
				</p>
				<p className='text-xs text-[#8696A0] truncate'>
					{authUser?.username ? `@${authUser.username}` : "View profile"}
				</p>
			</div>

			<FaCog className='text-[#8696A0] group-hover:text-[#E9EDEF] transition-colors text-base' />
		</Link>
	);
};

export default ProfileButton;
