import { Navigate } from "react-router-dom";
import { useState } from "react";
import MessageContainer from "../../components/messages/MessageContainer";
import Sidebar from "../../components/sidebar/Sidebar";
import { useAuthContext } from "../../context/AuthContext";

const Home = () => {
	const { authUser, loading } = useAuthContext();
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);

	if (!loading && !authUser) {
		return <Navigate to='/login' replace />;
	}

	if (loading) {
		return (
			<div className='flex h-screen items-center justify-center bg-[#0B141A]'>
				<div className='animate-spin rounded-full h-8 w-8 border-2 border-[#00A884] border-t-transparent' />
			</div>
		);
	}

	return (
		<div className='flex h-screen bg-[#0B141A] overflow-hidden mobile-chat-container'>
			<div className='flex w-full h-full overflow-hidden mobile-chat-main'>
				<Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
				<main className='flex-1 min-w-0 overflow-hidden'>
					<MessageContainer isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
				</main>
			</div>
		</div>
	);
};

export default Home;
