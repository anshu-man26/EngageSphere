import { IoClose } from "react-icons/io5";
import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import SearchInput from "./SearchInput";
import ProfileButton from "./ProfileButton";
import useListenConversations from "../../hooks/useListenConversations";
import logo from "../../assets/images/logo.png";

const Sidebar = ({ isOpen, setIsOpen }) => {
	useListenConversations();

	const handleConversationSelect = () => {
		if (window.innerWidth < 1024) setIsOpen(false);
	};

	return (
		<>
			<aside
				className={`
					${isOpen ? "translate-x-0" : "-translate-x-full"}
					lg:translate-x-0
					fixed lg:relative
					top-0 left-0
					w-80 sm:w-96 lg:w-80 xl:w-96 h-full
					bg-[#111B21] border-r border-[#222D34]
					flex flex-col
					transition-transform duration-300 ease-in-out
					z-[9999]
					sidebar-mobile lg:sidebar-desktop
				`}
			>
				{/* Header */}
				<div className='flex items-center justify-between px-4 h-14 bg-[#202C33]'>
					<div className='flex items-center gap-2'>
						<img src={logo} alt='EngageSphere' className='h-7 w-7 object-contain' />
						<h1 className='text-base font-semibold text-[#E9EDEF] tracking-tight'>EngageSphere</h1>
					</div>
					<button
						onClick={() => setIsOpen(false)}
						className='lg:hidden w-8 h-8 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-white/5 flex items-center justify-center transition-colors'
						aria-label='Close sidebar'
					>
						<IoClose size={20} />
					</button>
				</div>

				{/* Search */}
				<div className='px-3 py-2 bg-[#111B21]'>
					<SearchInput />
				</div>

				{/* Conversations */}
				<div className='flex-1 min-h-0 overflow-hidden'>
					<Conversations onConversationSelect={handleConversationSelect} />
				</div>

				{/* Footer */}
				<div className='border-t border-[#222D34] p-2 space-y-1'>
					<ProfileButton />
					<LogoutButton />
				</div>
			</aside>

			{isOpen && (
				<div
					className='lg:hidden fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm'
					onClick={() => setIsOpen(false)}
				/>
			)}
		</>
	);
};

export default Sidebar;
