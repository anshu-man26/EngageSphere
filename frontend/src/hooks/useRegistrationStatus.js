import { useState, useEffect } from 'react';

const useRegistrationStatus = () => {
	const [registrationEnabled, setRegistrationEnabled] = useState(true);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const checkRegistrationStatus = async () => {
			try {
				setLoading(true);
				const res = await fetch('/api/admin/settings/public');
				const data = await res.json();
				
				if (data.error) {
					setError(data.error);
					return;
				}
				
				setRegistrationEnabled(data.userRegistration !== false);
			} catch (error) {
				console.error('Error checking registration status:', error);
				setError('Failed to check registration status');
			} finally {
				setLoading(false);
			}
		};

		checkRegistrationStatus();

		// Listen for system settings updates
		const handleSettingsUpdate = (event) => {
			if (event.detail && typeof event.detail.userRegistration !== 'undefined') {
				setRegistrationEnabled(event.detail.userRegistration !== false);
			}
		};

		window.addEventListener('systemSettingsUpdated', handleSettingsUpdate);

		return () => {
			window.removeEventListener('systemSettingsUpdated', handleSettingsUpdate);
		};
	}, []);

	return { registrationEnabled, loading, error };
};

export default useRegistrationStatus; 