import { useEffect, useRef, useState } from "react";
import { BsSend } from "react-icons/bs";
import { FaPaperclip, FaImage, FaFile, FaGift } from "react-icons/fa";
import useSendMessage from "../../hooks/useSendMessage";
import useUploadFile from "../../hooks/useUploadFile";
import useSendGif from "../../hooks/useSendGif";
import useConversation from "../../zustand/useConversation";

const MessageInput = ({ onGifPickerToggle }) => {
	const [message, setMessage] = useState("");
	const [showFileMenu, setShowFileMenu] = useState(false);
	const fileInputRef = useRef(null);

	const { loading, sendMessage } = useSendMessage();
	const { loading: uploadLoading, uploadFile } = useUploadFile();
	const { loading: gifLoading } = useSendGif();
	const { selectedConversation } = useConversation();

	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	const busy = loading || uploadLoading || gifLoading;
	const disabled = busy || !selectedConversation;

	useEffect(() => {
		const onClickOutside = (e) => {
			if (showFileMenu && !e.target.closest(".file-menu-container")) {
				setShowFileMenu(false);
			}
		};
		document.addEventListener("mousedown", onClickOutside);
		document.addEventListener("touchstart", onClickOutside);
		return () => {
			document.removeEventListener("mousedown", onClickOutside);
			document.removeEventListener("touchstart", onClickOutside);
		};
	}, [showFileMenu]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!message.trim() || disabled) return;
		await sendMessage(message);
		setMessage("");
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	const handleFileSelect = async (e) => {
		const file = e.target.files[0];
		setShowFileMenu(false);
		if (file) {
			try {
				await uploadFile(file, message);
				setMessage("");
			} catch (err) {
				console.error("File upload error:", err);
			}
		}
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleFileUpload = () => {
		if (isMobile) setTimeout(() => fileInputRef.current?.click(), 100);
		else fileInputRef.current?.click();
	};

	const canSend = message.trim().length > 0 && !disabled;

	return (
		<div className='px-3 py-2 sm:px-4 bg-[#202C33] mobile-input-container'>
			<form onSubmit={handleSubmit} className='flex items-center gap-2'>
				{/* Attach button + menu */}
				<div className='relative file-menu-container flex-shrink-0'>
					<button
						type='button'
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							setShowFileMenu((v) => !v);
						}}
						disabled={disabled}
						className='w-10 h-10 rounded-full text-[#8696A0] hover:text-[#E9EDEF] hover:bg-white/5 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
						aria-label='Attach'
					>
						<FaPaperclip className='text-xl rotate-45' />
					</button>

					{showFileMenu && (
						<div className='absolute bottom-full left-0 mb-2 bg-[#233138] ring-1 ring-black/30 rounded-xl shadow-2xl p-1.5 min-w-[180px] z-50'>
							<button
								type='button'
								onClick={handleFileUpload}
								className='w-full flex items-center gap-3 px-3 py-2 text-[#E9EDEF] hover:bg-[#2A3942] rounded-lg text-sm transition-colors'
							>
								<span className='w-8 h-8 rounded-full bg-[#BF59CF] flex items-center justify-center text-white'>
									<FaImage className='text-sm' />
								</span>
								<span>Photo</span>
							</button>
							<button
								type='button'
								onClick={handleFileUpload}
								className='w-full flex items-center gap-3 px-3 py-2 text-[#E9EDEF] hover:bg-[#2A3942] rounded-lg text-sm transition-colors'
							>
								<span className='w-8 h-8 rounded-full bg-[#5F66CD] flex items-center justify-center text-white'>
									<FaFile className='text-sm' />
								</span>
								<span>Document</span>
							</button>
							<button
								type='button'
								onClick={() => {
									setShowFileMenu(false);
									onGifPickerToggle(true);
								}}
								className='w-full flex items-center gap-3 px-3 py-2 text-[#E9EDEF] hover:bg-[#2A3942] rounded-lg text-sm transition-colors'
							>
								<span className='w-8 h-8 rounded-full bg-[#D3396D] flex items-center justify-center text-white'>
									<FaGift className='text-sm' />
								</span>
								<span>GIF</span>
							</button>
						</div>
					)}

					<input
						ref={fileInputRef}
						type='file'
						accept='image/*,.pdf,.doc,.docx,.txt'
						className='hidden'
						onChange={handleFileSelect}
					/>
				</div>

				{/* Text input pill */}
				<div className='flex-1 min-w-0'>
					<input
						type='text'
						className='w-full h-11 px-4 bg-[#2A3942] rounded-lg text-[15px] text-[#E9EDEF] placeholder-[#8696A0] outline-none disabled:opacity-50'
						placeholder={selectedConversation ? "Type a message" : "Select a conversation"}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyPress={handleKeyPress}
						disabled={disabled}
					/>
				</div>

				{/* Send button */}
				<button
					type='submit'
					disabled={!canSend}
					className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
						canSend
							? "bg-[#00A884] hover:bg-[#06CF9C] text-white"
							: "text-[#8696A0]"
					}`}
					aria-label='Send'
				>
					{busy ? (
						<div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent' />
					) : (
						<BsSend className='text-lg' />
					)}
				</button>
			</form>
		</div>
	);
};

export default MessageInput;
