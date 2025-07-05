import { useState, useEffect } from "react";
import { FaTrash, FaEye, FaDownload, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";

const BackgroundImageManager = ({ onClose }) => {
	const [backgroundImages, setBackgroundImages] = useState([]);
	const [loading, setLoading] = useState(true);
	const [deletingImage, setDeletingImage] = useState(null);

	useEffect(() => {
		fetchBackgroundImages();
	}, []);

	const fetchBackgroundImages = async () => {
		try {
			const res = await fetch("/api/users/background-images", {
				credentials: "include",
			});
			const data = await res.json();
			
			if (data.error) {
				throw new Error(data.error);
			}
			
			setBackgroundImages(data.backgroundImages || []);
		} catch (error) {
			toast.error("Failed to fetch background images");
			console.error("Error fetching background images:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteImage = async (imageUrl, conversationId) => {
		if (!confirm("Are you sure you want to delete this background image? This action cannot be undone.")) {
			return;
		}

		setDeletingImage(imageUrl);
		try {
			const res = await fetch("/api/users/background-image", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ imageUrl, conversationId }),
			});
			
			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}
			
			toast.success("Background image deleted successfully");
			// Remove the image from the list
			setBackgroundImages(prev => prev.filter(img => img.url !== imageUrl));
		} catch (error) {
			toast.error(error.message);
		} finally {
			setDeletingImage(null);
		}
	};

	const handleDownloadImage = (imageUrl, type) => {
		const link = document.createElement('a');
		link.href = imageUrl;
		link.download = `background-${type}-${Date.now()}.jpg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handlePreviewImage = (imageUrl) => {
		window.open(imageUrl, '_blank');
	};

	if (loading) {
		return (
			<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
				<div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
					<div className="flex items-center justify-center p-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
						<span className="ml-3 text-white">Loading background images...</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-white/20">
					<h2 className="text-xl font-bold text-white">Background Image Manager</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors"
					>
						<FaTimes size={20} />
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					{backgroundImages.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-gray-400 text-lg">No background images found</p>
							<p className="text-gray-500 text-sm mt-2">
								Upload custom background images to see them here
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{backgroundImages.map((image, index) => (
								<div
									key={index}
									className="bg-white/5 rounded-lg border border-white/10 overflow-hidden"
								>
									{/* Image Preview */}
									<div className="relative h-32 bg-gray-800">
										<img
											src={image.url}
											alt={`Background ${index + 1}`}
											className="w-full h-full object-cover"
											onError={(e) => {
												e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzc0MTUxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2YzZjRmNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
											}}
										/>
										<div className="absolute top-2 left-2">
											<span className={`px-2 py-1 rounded-full text-xs font-medium ${
												image.type === 'default' 
													? 'bg-blue-500/80 text-white' 
													: 'bg-purple-500/80 text-white'
											}`}>
												{image.type === 'default' ? 'Default' : 'Conversation'}
											</span>
										</div>
									</div>

									{/* Image Info */}
									<div className="p-3">
										<div className="flex items-center justify-between mb-2">
											<span className="text-white text-sm font-medium">
												{image.type === 'default' ? 'Default Background' : 'Conversation Background'}
											</span>
											{image.createdAt && (
												<span className="text-gray-400 text-xs">
													{new Date(image.createdAt).toLocaleDateString()}
												</span>
											)}
										</div>

										{/* Actions */}
										<div className="flex items-center gap-2">
											<button
												onClick={() => handlePreviewImage(image.url)}
												className="flex-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded text-xs transition-colors flex items-center justify-center gap-1"
											>
												<FaEye size={10} />
												Preview
											</button>
											<button
												onClick={() => handleDownloadImage(image.url, image.type)}
												className="flex-1 px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 rounded text-xs transition-colors flex items-center justify-center gap-1"
											>
												<FaDownload size={10} />
												Download
											</button>
											<button
												onClick={() => handleDeleteImage(image.url, image.conversationId)}
												disabled={deletingImage === image.url}
												className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
											>
												{deletingImage === image.url ? (
													<div className="animate-spin rounded-full h-3 w-3 border-b border-red-400"></div>
												) : (
													<FaTrash size={10} />
												)}
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between p-6 border-t border-white/20">
					<div className="text-gray-400 text-sm">
						Total: {backgroundImages.length} image{backgroundImages.length !== 1 ? 's' : ''}
					</div>
					<button
						onClick={onClose}
						className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

export default BackgroundImageManager; 