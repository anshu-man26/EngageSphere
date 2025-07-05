import useLogout from "../../hooks/useLogout";
import { FaSignOutAlt } from "react-icons/fa";

const LogoutButton = () => {
	const { loading, logout } = useLogout();

	return (
		<div className='mt-auto pt-2 sm:pt-4'>
			<button
				onClick={logout}
				disabled={loading}
				className='w-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base sidebar-button sidebar-logout-button'
			>
				{loading ? (
					<div className='animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-red-400'></div>
				) : (
					<FaSignOutAlt className='text-base sm:text-lg' />
				)}
				<span className='font-medium truncate'>
					{loading ? (
						<span className="hidden sm:inline">Signing out...</span>
					) : (
						<span className="hidden sm:inline">Sign Out</span>
					)}
					<span className="sm:hidden">
						{loading ? 'Signing out...' : 'Sign Out'}
					</span>
				</span>
			</button>
		</div>
	);
};
export default LogoutButton;
