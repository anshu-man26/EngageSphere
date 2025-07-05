import useLogout from "../../hooks/useLogout";
import { FaSignOutAlt } from "react-icons/fa";

const LogoutButton = () => {
	const { loading, logout } = useLogout();

	return (
		<div className='mt-auto pt-4'>
			<button
				onClick={logout}
				disabled={loading}
				className='w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
			>
				{loading ? (
					<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-red-400'></div>
				) : (
					<FaSignOutAlt className='text-lg' />
				)}
				<span className='font-medium'>{loading ? 'Signing out...' : 'Sign Out'}</span>
			</button>
		</div>
	);
};
export default LogoutButton;
