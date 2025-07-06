import { useState, useEffect } from 'react';

const useVideoCallStatus = () => {
	const [isVideoCallEnabled, setIsVideoCallEnabled] = useState(true);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkVideoCallStatus = async () => {
			try {
				const response = await fetch('/api/admin/settings/public', {
					method: 'GET',
					credentials: 'include'
				});

				if (response.ok) {
					const data = await response.json();
					setIsVideoCallEnabled(data.videoCalls !== false); // Default to true if not specified
				} else {
					// If we can't fetch settings, assume video calls are enabled
					setIsVideoCallEnabled(true);
				}
			} catch (error) {
				console.error('Error checking video call status:', error);
				// Default to enabled if there's an error
				setIsVideoCallEnabled(true);
			} finally {
				setLoading(false);
			}
		};

		checkVideoCallStatus();

		// Listen for system settings updates
		const handleSettingsUpdate = (event) => {
			if (event.detail && typeof event.detail.videoCalls !== 'undefined') {
				setIsVideoCallEnabled(event.detail.videoCalls !== false);
			}
		};

		window.addEventListener('systemSettingsUpdated', handleSettingsUpdate);

		return () => {
			window.removeEventListener('systemSettingsUpdated', handleSettingsUpdate);
		};
	}, []);

	return { isVideoCallEnabled, loading };
};

export default useVideoCallStatus; 