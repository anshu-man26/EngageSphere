const MessageSkeleton = () => {
	return (
		<div className='flex gap-2 mb-0'>
			{/* Avatar skeleton */}
			<div className='w-8 h-8 bg-gray-700 rounded-full animate-pulse'></div>
			
			{/* Message skeleton */}
			<div className='flex-1'>
				<div className='bg-gray-700 rounded-2xl rounded-bl-md px-4 py-2 w-3/4'>
					<div className='h-4 bg-gray-600 rounded mb-2 animate-pulse'></div>
					<div className='h-3 bg-gray-600 rounded w-1/4 animate-pulse'></div>
				</div>
			</div>
		</div>
	);
};

export default MessageSkeleton;

