import { useState, useEffect } from 'react';

const useLoginStatus = () => {
	const [loginEnabled, setLoginEnabled] = useState(true);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const checkLoginStatus = async () => {
			try {
				setLoading(true);
				const res = await fetch('/api/admin/settings/public');
				const data = await res.json();
				
				if (data.error) {
					setError(data.error);
					return;
				}
				
				setLoginEnabled(data.userLogin !== false);
			} catch (error) {
				console.error('Error checking login status:', error);
				setError('Failed to check login status');
			} finally {
				setLoading(false);
			}
		};

		checkLoginStatus();

		// Listen for system settings updates
		const handleSettingsUpdate = (event) => {
			if (event.detail && typeof event.detail.userLogin !== 'undefined') {
				setLoginEnabled(event.detail.userLogin !== false);
			}
		};

		window.addEventListener('systemSettingsUpdated', handleSettingsUpdate);

		return () => {
			window.removeEventListener('systemSettingsUpdated', handleSettingsUpdate);
		};
	}, []);

	return { loginEnabled, loading, error };
};

export default useLoginStatus; 