export function extractTime(dateString) {
	try {
		if (!dateString) return "00:00";
		
		const date = new Date(dateString);
		
		// Check if date is valid
		if (isNaN(date.getTime())) {
			return "00:00";
		}
		
		const hours = padZero(date.getHours());
		const minutes = padZero(date.getMinutes());
		return `${hours}:${minutes}`;
	} catch (error) {
		console.error("Error extracting time:", error);
		return "00:00";
	}
}

// Helper function to pad single-digit numbers with a leading zero
function padZero(number) {
	return number.toString().padStart(2, "0");
}
