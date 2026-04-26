import { useState, useRef, useEffect } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";

const GIPHY_API_KEY = "GlVGYHkr3WSBnllca54iNt0yFbjz7L65";
const QUICK_TAGS = ["happy", "sad", "love", "angry", "wow", "lol", "thanks"];

const GiphyPicker = ({ onGifSelect, onClose }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [gifs, setGifs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [trending, setTrending] = useState(true);
	const searchInputRef = useRef(null);
	const modalRef = useRef(null);

	const searchGifs = async (query) => {
		if (!query.trim()) {
			fetchTrendingGifs();
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(
				`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=g`
			);
			const data = await res.json();
			if (data.data) {
				setGifs(data.data);
				setTrending(false);
			}
		} catch (error) {
			toast.error("Failed to search GIFs");
		} finally {
			setLoading(false);
		}
	};

	const fetchTrendingGifs = async () => {
		setLoading(true);
		try {
			const res = await fetch(
				`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=24&rating=g`
			);
			const data = await res.json();
			if (data.data) {
				setGifs(data.data);
				setTrending(true);
			}
		} catch (error) {
			toast.error("Failed to load trending GIFs");
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (e) => {
		e.preventDefault();
		searchGifs(searchTerm);
	};

	const handleQuickTag = (tag) => {
		setSearchTerm(tag);
		searchGifs(tag);
	};

	const handleGifSelect = (gif) => {
		onGifSelect(gif.images.original.url, gif.title || "GIF");
		onClose();
	};

	useEffect(() => {
		fetchTrendingGifs();
		searchInputRef.current?.focus();

		const handleResize = () => {
			if (modalRef.current) {
				const modal = modalRef.current;
				const chatContainer = modal.closest(".flex-1");
				const containerHeight = chatContainer ? chatContainer.clientHeight : window.innerHeight;
				const containerWidth = chatContainer ? chatContainer.clientWidth : window.innerWidth;
				const maxHeight = Math.min(containerHeight * 0.75, 540);
				const maxWidth = Math.min(containerWidth * 0.92, 720);
				modal.style.maxHeight = `${maxHeight}px`;
				modal.style.maxWidth = `${maxWidth}px`;
			}
		};
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return (
		<div
			className='absolute inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[10000] p-3 sm:p-4 animate-fadeIn'
			onClick={onClose}
		>
			<div
				ref={modalRef}
				onClick={(e) => e.stopPropagation()}
				className='bg-[#111B21] rounded-2xl w-full flex flex-col overflow-hidden shadow-2xl animate-scaleIn'
			>
				{/* Header — search bar + close, no border */}
				<div className='flex items-center gap-2 px-3 pt-3 pb-2'>
					<form onSubmit={handleSearch} className='flex-1'>
						<div className='relative'>
							<FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0] text-sm pointer-events-none' />
							<input
								ref={searchInputRef}
								type='text'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder='Search GIPHY'
								className='w-full pl-10 pr-9 py-2.5 bg-[#2A3942] rounded-full text-[#E9EDEF] placeholder-[#8696A0] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition'
							/>
							{searchTerm && (
								<button
									type='button'
									onClick={() => {
										setSearchTerm("");
										fetchTrendingGifs();
									}}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-[#8696A0] hover:text-[#E9EDEF] text-xs'
								>
									<FaTimes />
								</button>
							)}
						</div>
					</form>
					<button
						onClick={onClose}
						className='w-9 h-9 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33] flex items-center justify-center transition-colors flex-shrink-0'
					>
						<FaTimes size={16} />
					</button>
				</div>

				{/* Quick tags row */}
				<div className='px-3 pb-2'>
					<div className='flex gap-1.5 overflow-x-auto no-scrollbar'>
						<button
							onClick={() => {
								setSearchTerm("");
								fetchTrendingGifs();
							}}
							className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
								trending && !searchTerm
									? "bg-emerald-500/20 text-emerald-300"
									: "bg-[#202C33] text-[#8696A0] hover:text-[#E9EDEF]"
							}`}
						>
							Trending
						</button>
						{QUICK_TAGS.map((tag) => (
							<button
								key={tag}
								onClick={() => handleQuickTag(tag)}
								className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap capitalize transition-colors ${
									searchTerm === tag
										? "bg-emerald-500/20 text-emerald-300"
										: "bg-[#202C33] text-[#8696A0] hover:text-[#E9EDEF]"
								}`}
							>
								{tag}
							</button>
						))}
					</div>
				</div>

				{/* Content — masonry via CSS columns so each GIF keeps its native aspect ratio */}
				<div className='flex-1 overflow-y-auto px-3 pb-3 min-h-0 giphy-picker-content'>
					{loading ? (
						<div className='flex items-center justify-center py-10'>
							<div className='animate-spin rounded-full h-7 w-7 border-2 border-emerald-500 border-t-transparent' />
						</div>
					) : gifs.length === 0 ? (
						<div className='text-center py-10'>
							<p className='text-[#E9EDEF] text-sm font-medium'>No GIFs found</p>
							<p className='text-[#8696A0] text-xs mt-1'>Try a different search term</p>
						</div>
					) : (
						<div className='columns-2 sm:columns-3 md:columns-4 gap-1.5'>
							{gifs.map((gif) => {
								const img = gif.images.fixed_width;
								return (
									<button
										key={gif.id}
										onClick={() => handleGifSelect(gif)}
										className='block w-full mb-1.5 relative overflow-hidden rounded-lg bg-[#202C33] hover:opacity-90 transition-opacity break-inside-avoid'
									>
										<img
											src={img.url}
											alt={gif.title || "GIF"}
											width={img.width}
											height={img.height}
											loading='lazy'
											className='w-full h-auto block'
										/>
									</button>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default GiphyPicker;
