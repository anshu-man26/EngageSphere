import { useState, useRef } from "react";
import { BsSend } from "react-icons/bs";
import { FaPaperclip, FaImage, FaFile, FaGift } from "react-icons/fa";
import useSendMessage from "../../hooks/useSendMessage";
import useUploadFile from "../../hooks/useUploadFile";
import useSendGif from "../../hooks/useSendGif";
import useConversation from "../../zustand/useConversation";
import { useSocketContext } from "../../context/SocketContext";
import GiphyPicker from "./GiphyPicker";


const MessageInput = ({ onGifPickerToggle }) => {
	const [message, setMessage] = useState("");
	const [showFileMenu, setShowFileMenu] = useState(false);
	const fileInputRef = useRef(null);
	const { loading, sendMessage } = useSendMessage();
	const { loading: uploadLoading, uploadFile } = useUploadFile();
	const { loading: gifLoading, sendGif } = useSendGif();
	const { selectedConversation } = useConversation();
	const { socket } = useSocketContext();

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!message.trim() || loading || !selectedConversation) return;
		
		await sendMessage(message);
		setMessage("");
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	const handleFileSelect = async (e) => {
		const file = e.target.files[0];
		// Close the menu immediately when a file is selected
		setShowFileMenu(false);
		
		if (file) {
			await uploadFile(file, message);
			setMessage("");
		}
		
		// Clear the input value to allow selecting the same file again
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleFileUpload = () => {
		fileInputRef.current?.click();
	};

	const handleGifSelect = async (gifUrl, gifTitle) => {
		await sendGif(gifUrl, gifTitle);
	};

	return (
		<div className='p-3 lg:p-4 bg-white/10 backdrop-blur-lg lg:border-t lg:border-white/20 shadow-lg mobile-input-container'>

			
			<form onSubmit={handleSubmit} className='flex gap-1'>
				{/* File Upload Button */}
				<div className='relative'>
					<button
						type='button'
						onClick={() => setShowFileMenu(!showFileMenu)}
						className='px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
						disabled={loading || uploadLoading || !selectedConversation}
					>
						<FaPaperclip className='text-base lg:text-lg' />
					</button>
					
					{/* File Menu Dropdown */}
					{showFileMenu && (
						<div className='absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-2 min-w-[120px]'>
							<button
								type='button'
								onClick={handleFileUpload}
								className='w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-gray-700 rounded transition-colors'
							>
								<FaImage className='text-blue-400' />
								<span className='text-sm'>Image</span>
							</button>
							<button
								type='button'
								onClick={handleFileUpload}
								className='w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-gray-700 rounded transition-colors'
							>
								<FaFile className='text-green-400' />
								<span className='text-sm'>Document</span>
							</button>
							<button
								type='button'
								onClick={() => {
									setShowFileMenu(false);
									onGifPickerToggle(true);
								}}
								className='w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-gray-700 rounded transition-colors'
							>
								<FaGift className='text-purple-400' />
								<span className='text-sm'>GIF</span>
							</button>
						</div>
					)}
					
					{/* Hidden File Input */}
					<input
						ref={fileInputRef}
						type='file'
						accept='image/*,.pdf,.doc,.docx,.txt'
						className='hidden'
						onChange={handleFileSelect}
					/>
				</div>

				<div className='flex-1 relative'>
					<input
						type='text'
						className='w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm'
						placeholder={selectedConversation ? 'Type your message...' : 'Select a conversation to start messaging'}
						value={message}
						onChange={(e) => {
							setMessage(e.target.value);
							// Emit user activity for online status
							if (socket && socket.connected) {
								socket.emit("userActivity");
							}
						}}
						onKeyPress={handleKeyPress}
						disabled={loading || uploadLoading || !selectedConversation}
					/>
				</div>
				<button 
					type='submit' 
					className='px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center gap-1'
					disabled={loading || uploadLoading || gifLoading || !selectedConversation || !message.trim()}
				>
					{loading || uploadLoading || gifLoading ? (
						<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
					) : (
						<>
							<BsSend className='text-base' />
							<span className='hidden sm:inline text-sm'>Send</span>
						</>
					)}
				</button>
			</form>
			
			{/* Click outside to close file menu */}
			{showFileMenu && (
				<div 
					className='fixed inset-0 z-10' 
					onClick={() => setShowFileMenu(false)}
				/>
			)}

		</div>
	);
};
export default MessageInput;

// STARTER CODE SNIPPET
// import { BsSend } from "react-icons/bs";

// const MessageInput = () => {
// 	return (
// 		<form className='px-4 my-3'>
// 			<div className='w-full'>
// 				<input
// 					type='text'
// 					className='border text-sm rounded-lg block w-full p-2.5  bg-gray-700 border-gray-600 text-white'
// 					placeholder='Send a message'
// 				/>
// 				<button type='submit' className='absolute inset-y-0 end-0 flex items-center pe-3'>
// 					<BsSend />
// 				</button>
// 			</div>
// 		</form>
// 	);
// };
// export default MessageInput;
