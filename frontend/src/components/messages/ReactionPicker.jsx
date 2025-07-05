import { useEffect } from "react";
import EmojiPicker from 'emoji-picker-react';
import useConversation from "../../zustand/useConversation";

const ReactionPicker = ({ onReactionSelect, onClose, isOpen = false, messageId }) => {
	const { clearActiveEmojiPicker } = useConversation();

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (!event.target.closest('.reaction-picker')) {
				if (onClose) onClose();
				clearActiveEmojiPicker();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [onClose, clearActiveEmojiPicker]);

	const handleEmojiClick = (emojiObject) => {
		onReactionSelect(emojiObject.emoji);
		if (onClose) onClose();
		clearActiveEmojiPicker();
	};

	if (!isOpen) return null;

	// Calculate responsive dimensions
	const windowWidth = window.innerWidth;
	const windowHeight = window.innerHeight;
	
	// Responsive width and height - made smaller
	const pickerWidth = Math.min(280, windowWidth * 0.8);
	const pickerHeight = Math.min(400, windowHeight * 0.8);

	return (
		<div className="reaction-picker z-20 animate-fadeIn">
			<EmojiPicker
				onEmojiClick={handleEmojiClick}
				autoFocusSearch={false}
				searchDisabled={false}
				skinTonesDisabled={true}
				width={pickerWidth}
				height={pickerHeight}
				lazyLoadEmojis={true}
			/>
		</div>
	);
};

export default ReactionPicker; 