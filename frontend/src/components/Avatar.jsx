// Single source of truth for user avatars.
//
// - Renders the profile picture if `src` is present and loads successfully.
// - Falls back to a generic person icon when there's no src OR the URL
//   fails to load (broken / expired Cloudinary links etc).
// - Resets its error state when `src` changes (so a fresh URL gets a
//   fresh chance to load).

import { useEffect, useState } from "react";
import { FaUser } from "react-icons/fa";

const Avatar = ({
	src,
	alt = "",
	size = 48,
	iconSize,
	className = "",
	onClick,
	title,
	bg = "bg-[#2A3942]",
	iconColor = "text-[#8696A0]",
}) => {
	const [errored, setErrored] = useState(false);

	useEffect(() => {
		setErrored(false);
	}, [src]);

	const computedIconSize = iconSize ?? Math.round(size * 0.45);

	return (
		<div
			onClick={onClick}
			title={title}
			style={{ width: size, height: size }}
			className={`rounded-full ${bg} overflow-hidden flex items-center justify-center flex-shrink-0 ${className}`}
		>
			{src && !errored ? (
				<img
					src={src}
					alt={alt}
					className='w-full h-full object-cover'
					onError={() => setErrored(true)}
				/>
			) : (
				<FaUser style={{ fontSize: computedIconSize }} className={iconColor} />
			)}
		</div>
	);
};

export default Avatar;
