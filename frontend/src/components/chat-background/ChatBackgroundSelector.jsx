import { useState, useRef } from "react";
import { FaImage, FaUpload, FaTimes, FaCheck } from "react-icons/fa";
import useChatBackground from "../../hooks/useChatBackground";
import { toast } from "react-hot-toast";

const ChatBackgroundSelector = ({ conversationId, currentBackground, onClose, onBackgroundChange }) => {
	const [selectedBackground, setSelectedBackground] = useState(currentBackground || "");
	const [customImage, setCustomImage] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [uploadingImage, setUploadingImage] = useState(false);
	const fileInputRef = useRef(null);
	const { loading, updateChatBackground } = useChatBackground();

	// Preset background options
	const presetBackgrounds = [
		{ name: "Default", url: "" },
		{ name: "Gradient Blue", url: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
		{ name: "Gradient Purple", url: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" },
		{ name: "Gradient Sunset", url: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)" },
		{ name: "Gradient Ocean", url: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)" },
		{ name: "Gradient Forest", url: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
		{ name: "Gradient Warm", url: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
		{ name: "Solid Dark", url: "#1a1a1a" },
		{ name: "Solid Light", url: "#f8f9fa" },
	];

	const handleFileSelect = (file) => {
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error("Please select an image file");
			return;
		}

		// Validate file size (5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error("File size must be less than 5MB");
			return;
		}

		setCustomImage(file);
		const reader = new FileReader();
		reader.onload = (e) => {
			setPreviewUrl(e.target.result);
		};
		reader.readAsDataURL(file);
	};

	const handleFileInputChange = (e) => {
		const file = e.target.files[0];
		handleFileSelect(file);
	};

	const handleBackgroundSelect = (background) => {
		setSelectedBackground(background.url);
		setCustomImage(null);
		setPreviewUrl(null);
	};

	const handleSave = async () => {
		let finalBackground = selectedBackground;
		// If custom image is selected, upload it first
		if (customImage) {
			setUploadingImage(true);
			try {
				const formData = new FormData();
				formData.append('backgroundImage', customImage);
				const res = await fetch("/api/users/upload-background", {
					method: "POST",
					credentials: "include",
					body: formData,
				});
				const data = await res.json();
				if (data.error) {
					throw new Error(data.error);
				}
				finalBackground = data.backgroundUrl;
			} catch (error) {
				toast.error("Failed to upload background image");
				setUploadingImage(false);
				return;
			} finally {
				setUploadingImage(false);
			}
		}
		if (!conversationId) {
			// User mode: just call onBackgroundChange
			onBackgroundChange(finalBackground);
			onClose();
			return;
		}
		// Conversation mode
		const success = await updateChatBackground(conversationId, finalBackground);
		if (success) {
			onBackgroundChange(finalBackground);
			onClose();
		}
	};

	const handleRemoveBackground = async () => {
		if (!conversationId) {
			onBackgroundChange("");
			onClose();
			return;
		}
		const success = await updateChatBackground(conversationId, "");
		if (success) {
			onBackgroundChange("");
			onClose();
		}
	};

	return (
		<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 chat-background-modal">
			<div className="bg-gray-900 rounded-2xl border border-gray-600 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl backdrop-blur-sm">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-600">
					<h2 className="text-xl font-bold text-white">Chat Background</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors"
					>
						<FaTimes size={20} />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6 bg-gray-900">
					{/* Preset Backgrounds */}
					<div>
						<h3 className="text-lg font-semibold text-white mb-4">Preset Backgrounds</h3>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
							{presetBackgrounds.map((bg, index) => (
								<div
									key={index}
									onClick={() => handleBackgroundSelect(bg)}
									className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
										selectedBackground === bg.url && !customImage
											? 'border-purple-500 scale-105'
											: 'border-white/20 hover:border-white/40'
									}`}
								>
									<div
										className="h-20 w-full"
										style={{
											background: bg.url || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
										}}
									>
										{bg.url === "" && (
											<div className="h-full w-full bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
												<span className="text-white text-xs font-medium">Default</span>
											</div>
										)}
									</div>
									{selectedBackground === bg.url && !customImage && (
										<div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
											<FaCheck className="text-white text-xs" />
										</div>
									)}
									<div className="p-2 bg-black/50">
										<p className="text-white text-xs text-center truncate">{bg.name}</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Custom Background Upload */}
					<div>
						<h3 className="text-lg font-semibold text-white mb-4">Custom Background</h3>
						<div className="space-y-4">
							{/* File Upload */}
							<div
								onClick={() => !uploadingImage && fileInputRef.current?.click()}
								className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
									uploadingImage 
										? 'border-gray-500 cursor-not-allowed' 
										: 'border-gray-600 cursor-pointer hover:border-gray-500'
								}`}
							>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleFileInputChange}
									disabled={uploadingImage}
								/>
								{uploadingImage ? (
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
								) : (
									<FaUpload className="mx-auto text-gray-400 text-2xl mb-2" />
								)}
								<p className="text-gray-300 text-sm">
									{uploadingImage 
										? 'Uploading image...' 
										: previewUrl 
											? 'Click to change image' 
											: 'Click to upload custom background'
									}
								</p>
								<p className="text-gray-400 text-xs mt-1">
									{uploadingImage ? 'Please wait...' : 'Supports: JPG, PNG, GIF (max 5MB)'}
								</p>
							</div>

							{/* Preview */}
							{previewUrl && (
								<div className="relative">
									<img
										src={previewUrl}
										alt="Background preview"
										className="w-full h-32 object-cover rounded-lg"
									/>
									<button
										onClick={() => {
											setCustomImage(null);
											setPreviewUrl(null);
											setSelectedBackground("");
										}}
										className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
									>
										<FaTimes className="text-white text-xs" />
									</button>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-t border-gray-600">
					<button
						onClick={handleRemoveBackground}
						className="w-full sm:w-auto px-4 py-2 text-red-400 hover:text-red-300 transition-colors text-sm sm:text-base"
					>
						Remove Background
					</button>
					<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
						<button
							onClick={onClose}
							className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm sm:text-base"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							disabled={loading || uploadingImage}
							className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm sm:text-base"
						>
							{(loading || uploadingImage) ? (
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
							) : (
								<>
									<FaCheck className="text-sm" />
									Save
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ChatBackgroundSelector; 