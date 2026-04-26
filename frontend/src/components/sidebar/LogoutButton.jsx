import { FaSignOutAlt } from "react-icons/fa";
import useLogout from "../../hooks/useLogout";

const LogoutButton = () => {
	const { loading, logout } = useLogout();

	return (
		<button
			onClick={logout}
			disabled={loading}
			className='w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[#8696A0] hover:text-[#F15C6D] hover:bg-[#202C33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium'
		>
			{loading ? (
				<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-[#F15C6D]' />
			) : (
				<FaSignOutAlt />
			)}
			<span>{loading ? "Signing out…" : "Sign out"}</span>
		</button>
	);
};

export default LogoutButton;
