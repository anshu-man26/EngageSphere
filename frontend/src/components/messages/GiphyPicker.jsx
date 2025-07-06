import { useState, useRef, useEffect } from "react";
import { FaSearch, FaTimes, FaGift } from "react-icons/fa";
import { toast } from "react-hot-toast";

const GiphyPicker = ({ onGifSelect, onClose }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [gifs, setGifs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [trending, setTrending] = useState(true);
	const searchInputRef = useRef(null);
	const modalRef = useRef(null);

	// Giphy API key - you'll need to get a free API key from https://developers.giphy.com/
	const GIPHY_API_KEY = "GlVGYHkr3WSBnllca54iNt0yFbjz7L65"; // This is a public demo key, replace with your own

	const searchGifs = async (query) => {
		if (!query.trim()) {
			fetchTrendingGifs();
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(
				`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
			);
			const data = await response.json();
			
			if (data.data) {
				setGifs(data.data);
				setTrending(false);
			}
		} catch (error) {
			console.error("Error searching GIFs:", error);
			toast.error("Failed to search GIFs");
		} finally {
			setLoading(false);
		}
	};

	const fetchTrendingGifs = async () => {
		setLoading(true);
		try {
			const response = await fetch(
				`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
			);
			const data = await response.json();
			
			if (data.data) {
				setGifs(data.data);
				setTrending(true);
			}
		} catch (error) {
			console.error("Error fetching trending GIFs:", error);
			toast.error("Failed to load trending GIFs");
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (e) => {
		e.preventDefault();
		searchGifs(searchTerm);
	};

	const handleGifSelect = (gif) => {
		onGifSelect(gif.images.original.url, gif.title || "GIF");
		onClose();
	};

	useEffect(() => {
		fetchTrendingGifs();
		searchInputRef.current?.focus();
		
		// Ensure modal fits within chat container and stays centered
		const handleResize = () => {
			if (modalRef.current) {
				const modal = modalRef.current;
				const chatContainer = modal.closest('.flex-1'); // Find the chat container
				const containerHeight = chatContainer ? chatContainer.clientHeight : window.innerHeight;
				const containerWidth = chatContainer ? chatContainer.clientWidth : window.innerWidth;
				
				// Use 70% of container height for better fit within chat
				const maxHeight = Math.min(containerHeight * 0.7, 500);
				const maxWidth = Math.min(containerWidth * 0.9, 700);
				
				modal.style.maxHeight = `${maxHeight}px`;
				modal.style.maxWidth = `${maxWidth}px`;
			}
		};
		
		handleResize();
		window.addEventListener('resize', handleResize);
		
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	return (
		<div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
			<div ref={modalRef} className="bg-gray-900 rounded-2xl border border-gray-600 max-w-4xl w-full max-h-[70vh] flex flex-col shadow-2xl animate-scaleIn">
				{/* Header */}
				<div className="flex items-center justify-between p-2 sm:p-3 border-b border-gray-600">
					<div className="flex items-center gap-2">
						<FaGift className="text-purple-400 text-lg sm:text-xl" />
						<h2 className="text-lg sm:text-xl font-bold text-white">GIF Picker</h2>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors p-2"
					>
						<FaTimes size={18} className="sm:w-5 sm:h-5" />
					</button>
				</div>

				{/* Search Bar */}
				<div className="p-2 sm:p-3 border-b border-gray-600">
					<form onSubmit={handleSearch} className="flex gap-2">
						<div className="flex-1 relative">
							<input
								ref={searchInputRef}
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search GIFs..."
								className="w-full px-3 sm:px-4 py-2 pl-8 sm:pl-10 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
							/>
							<FaSearch className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
						</div>
						<button
							type="submit"
							className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm sm:text-base"
						>
							Search
						</button>
					</form>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-1 sm:p-2 min-h-0 giphy-picker-content">
					{loading ? (
						<div className="flex items-center justify-center py-4">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
							<span className="ml-2 text-white text-sm">Loading GIFs...</span>
						</div>
					) : (
						<>
							{trending && !searchTerm && (
								<div className="mb-2">
									<h3 className="text-base font-semibold text-white mb-1">Trending GIFs</h3>
								</div>
							)}
							{!trending && searchTerm && (
								<div className="mb-2">
									<h3 className="text-base font-semibold text-white mb-1">
										Search results for "{searchTerm}"
									</h3>
								</div>
							)}
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
								{gifs.map((gif) => (
									<div
										key={gif.id}
										onClick={() => handleGifSelect(gif)}
										className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-500 transition-all duration-200 hover:scale-105 bg-gray-800 flex items-center justify-center"
										style={{ aspectRatio: '1' }}
									>
										<img
											src={gif.images.fixed_height_small.url}
											alt={gif.title || "GIF"}
											className="w-full h-full object-contain p-1"
											loading="lazy"
										/>
										<div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
											<div className="opacity-0 hover:opacity-100 transition-opacity">
												<FaGift className="text-white text-xl" />
											</div>
										</div>
									</div>
								))}
							</div>
							{gifs.length === 0 && !loading && (
								<div className="text-center py-4">
									<p className="text-gray-400 text-sm">No GIFs found</p>
									<p className="text-gray-500 text-xs mt-1">Try a different search term</p>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default GiphyPicker; 