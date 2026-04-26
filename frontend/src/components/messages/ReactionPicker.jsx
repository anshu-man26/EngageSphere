// Instagram-style quick-reaction pill.
//
// 6 preset emojis in a horizontal pill above the message bubble. Tap one
// to react. Tap a reaction the user already gave to remove it (handled by
// the parent's `onReactionSelect` which toggles add/remove).
//
// We dropped the heavyweight emoji-picker-react full picker — most chats
// use ~6 reactions, the full picker felt like opening a settings panel.

import { useEffect } from "react";

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "🙏", "👍"];

const ReactionPicker = ({ onReactionSelect, onClose, isOpen = false }) => {
	useEffect(() => {
		if (!isOpen) return;
		const onKey = (e) => {
			if (e.key === "Escape") onClose?.();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			className='reaction-picker flex items-center gap-1 px-2 py-1.5 bg-[#233138] ring-1 ring-black/40 rounded-full shadow-2xl animate-fadeIn'
			onClick={(e) => e.stopPropagation()}
		>
			{QUICK_REACTIONS.map((emoji) => (
				<button
					key={emoji}
					onClick={() => onReactionSelect(emoji)}
					className='w-9 h-9 rounded-full hover:bg-white/10 active:scale-90 transition-all flex items-center justify-center text-xl'
					aria-label={`React with ${emoji}`}
				>
					{emoji}
				</button>
			))}
		</div>
	);
};

export default ReactionPicker;
