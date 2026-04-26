import { IoSearchOutline, IoClose } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";

const SearchInput = () => {
	const { searchTerm, setSearchTerm, clearSearch } = useConversation();

	return (
		<div className='relative'>
			<IoSearchOutline className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8696A0] pointer-events-none' />
			<input
				type='text'
				placeholder='Search or start a new chat'
				className='w-full h-9 pl-10 pr-9 bg-[#202C33] hover:bg-[#202C33] focus:bg-[#202C33] rounded-lg text-sm text-[#E9EDEF] placeholder-[#8696A0] outline-none transition-colors'
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
			/>
			{searchTerm.trim() && (
				<button
					type='button'
					onClick={clearSearch}
					className='absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-white/5 flex items-center justify-center transition-colors'
					aria-label='Clear search'
				>
					<IoClose className='h-4 w-4' />
				</button>
			)}
		</div>
	);
};

export default SearchInput;
