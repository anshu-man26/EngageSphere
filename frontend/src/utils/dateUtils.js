// Format date for message timestamps
export const formatMessageTime = (timestamp) => {
	if (!timestamp) return '';
	
	const date = new Date(timestamp);
	const now = new Date();
	const diffInMinutes = (now - date) / (1000 * 60);
	
	if (diffInMinutes < 1) {
		return 'Just now';
	} else {
		return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
	}
};

// Format date for date separators (WhatsApp style)
export const formatDateSeparator = (timestamp) => {
	if (!timestamp) return '';
	
	const date = new Date(timestamp);
	const now = new Date();
	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);
	
	// Check if it's today
	if (date.toDateString() === now.toDateString()) {
		return 'Today';
	}
	
	// Check if it's yesterday
	if (date.toDateString() === yesterday.toDateString()) {
		return 'Yesterday';
	}
	
	// Check if it's this week (within last 7 days)
	const diffInDays = (now - date) / (1000 * 60 * 60 * 24);
	if (diffInDays < 7) {
		return date.toLocaleDateString('en-US', { weekday: 'long' });
	}
	
	// Check if it's this year
	if (date.getFullYear() === now.getFullYear()) {
		return date.toLocaleDateString('en-US', { 
			month: 'long', 
			day: 'numeric' 
		});
	}
	
	// Different year
	return date.toLocaleDateString('en-US', { 
		year: 'numeric',
		month: 'long', 
		day: 'numeric' 
	});
};

// Check if two timestamps are on different days
export const isDifferentDay = (timestamp1, timestamp2) => {
	if (!timestamp1 || !timestamp2) return false;
	
	const date1 = new Date(timestamp1);
	const date2 = new Date(timestamp2);
	
	return date1.toDateString() !== date2.toDateString();
};

// Get the start of day for a timestamp
export const getStartOfDay = (timestamp) => {
	const date = new Date(timestamp);
	date.setHours(0, 0, 0, 0);
	return date;
}; 