import { useState } from "react";
import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import SearchInput from "./SearchInput";
import ProfileButton from "./ProfileButton";
import { IoMenu, IoClose, IoChevronBack } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";
import useListenConversations from "../../hooks/useListenConversations";
import logo from '../../assets/images/logo.png';

const Sidebar = ({ isOpen, setIsOpen }) => {
	const { selectedConversation } = useConversation();
	
	// Listen for conversation updates
	useListenConversations();

	// Auto-close sidebar when conversation is selected on mobile
	const handleConversationSelect = () => {
		if (window.innerWidth < 1024) {
			setIsOpen(false);
		}
	};

	return (
		<>

			{/* Sidebar */}
			<div className={`
				${isOpen ? 'translate-x-0' : '-translate-x-full'} 
				lg:translate-x-0
				fixed lg:relative 
				top-0 left-0 
				w-80 sm:w-96 lg:w-80 xl:w-96 h-full 
				bg-gray-800 border-r border-gray-600 
				pt-20 lg:pt-6 p-4 lg:p-6 
				flex flex-col 
				transition-transform duration-300 ease-in-out 
				z-[9999]
				overflow-hidden
				sidebar-mobile lg:sidebar-desktop
				min-w-0
			`}>
				{/* Header */}
				<div className='flex items-center justify-between mb-4'>
					<div className='flex items-center gap-2'>
						<img src={logo} alt='EngageSphere Logo' className='h-8 w-8 object-contain' />
						<h1 className='text-xl lg:text-2xl font-bold text-white'>EngageSphere</h1>
					</div>
					{/* Close Button - Inside sidebar */}
					<button
						onClick={() => setIsOpen(false)}
						className='lg:hidden p-2 bg-gray-700 rounded-lg border border-gray-600 text-white hover:bg-gray-600 transition-colors'
					>
						<IoClose size={20} />
					</button>
				</div>
				
				<SearchInput />
				<div className='divider my-4 border-white/20'></div>
				<Conversations onConversationSelect={handleConversationSelect} />
				
				{/* Profile and Logout Section */}
				<div className='mt-auto space-y-2'>
					<ProfileButton />
					<LogoutButton />
				</div>
			</div>

			{/* Mobile Overlay - Less dimmed for better visibility */}
			{isOpen && (
				<div 
					className='lg:hidden fixed inset-0 bg-black/20 z-[9998]'
					onClick={() => setIsOpen(false)}
				/>
			)}
		</>
	);
};
export default Sidebar;

// STARTER CODE FOR THIS FILE
// import Conversations from "./Conversations";
// import LogoutButton from "./LogoutButton";
// import SearchInput from "./SearchInput";

// const Sidebar = () => {
// 	return (
// 		<div className='border-r border-slate-500 p-4 flex flex-col'>
// 			<SearchInput />
// 			<div className='divider px-3'></div>
// 			<Conversations />
// 			<LogoutButton />
// 		</div>
// 	);
// };
// export default Sidebar;
