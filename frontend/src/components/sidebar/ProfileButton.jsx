import { Link } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { FaCog } from "react-icons/fa";
import Avatar from "../Avatar";

const ProfileButton = () => {
	const { authUser } = useAuthContext();

	return (
		<Link
			to='/profile'
			className='flex items-center gap-3 p-2 rounded-lg hover:bg-[#202C33] transition-colors group'
		>
			<div className='relative flex-shrink-0'>
				<Avatar src={authUser?.profilePic} alt={authUser?.fullName} size={40} />
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
