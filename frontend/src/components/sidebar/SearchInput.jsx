import { IoSearchOutline, IoClose } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";

const SearchInput = () => {
	const { searchTerm, setSearchTerm, clearSearch } = useConversation();

	const handleSearchChange = (e) => {
		const value = e.target.value;
		setSearchTerm(value);
	};

	const handleClearSearch = () => {
		clearSearch();
	};

	return (
		<div className='relative'>
			<div className='absolute inset-y-0 left-0 pl-2 lg:pl-3 flex items-center pointer-events-none'>
				<IoSearchOutline className='h-4 w-4 lg:h-5 lg:w-5 text-gray-400' />
			</div>
			<input
				type='text'
				placeholder='Search users...'
				className='w-full pl-8 lg:pl-10 pr-10 lg:pr-12 py-2 lg:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm lg:text-base'
				value={searchTerm}
				onChange={handleSearchChange}
			/>
			{searchTerm.trim() && (
				<button
					type='button'
					onClick={handleClearSearch}
					className='absolute inset-y-0 right-0 px-2 lg:px-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200'
				>
					<IoClose className='h-4 w-4 lg:h-5 lg:w-5' />
				</button>
			)}
		</div>
	);
};
export default SearchInput;

// STARTER CODE SNIPPET
// import { IoSearchSharp } from "react-icons/io5";

// const SearchInput = () => {
// 	return (
// 		<form className='flex items-center gap-2'>
// 			<input type='text' placeholder='Search…' className='input input-bordered rounded-full' />
// 			<button type='submit' className='btn btn-circle bg-sky-500 text-white'>
// 				<IoSearchSharp className='w-6 h-6 outline-none' />
// 			</button>
// 		</form>
// 	);
// };
// export default SearchInput;
