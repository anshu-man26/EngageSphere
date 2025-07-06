import { Navigate } from "react-router-dom";
import { useState } from "react";
import MessageContainer from "../../components/messages/MessageContainer";
import Sidebar from "../../components/sidebar/Sidebar";
import { useAuthContext } from "../../context/AuthContext";

const Home = () => {
	const { authUser, loading } = useAuthContext();
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);

	// Redirect to login if not authenticated
	if (!loading && !authUser) {
		return <Navigate to="/login" replace />;
	}

	// Show loading if still checking authentication
	if (loading) {
		return (
			<div className='flex h-screen items-center justify-center'>
				<div className='text-center'>
					<div className='w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
					</div>
					<p className='text-white text-lg'>Loading chat...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='flex h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 overflow-hidden'>
			<div className='flex w-full h-full overflow-hidden'>
				<Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
				<div className='flex-1 min-w-0 overflow-hidden'>
					<MessageContainer isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
				</div>
			</div>
		</div>
	);
};
export default Home;
