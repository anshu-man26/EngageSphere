import { useState, useEffect } from "react";

const useSystemSettings = () => {
	const [systemSettings, setSystemSettings] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchSystemSettings();
		
		// Set up polling to refresh settings every 3 seconds for real-time updates
		const interval = setInterval(() => {
			fetchSystemSettings();
		}, 3000);

		// Listen for real-time system settings updates via socket
		const handleSystemSettingsUpdate = (event) => {
			console.log("🔄 Received system settings update:", event.detail);
			setSystemSettings(event.detail);
		};

		window.addEventListener('systemSettingsUpdated', handleSystemSettingsUpdate);

		// Cleanup interval and event listener on unmount
		return () => {
			clearInterval(interval);
			window.removeEventListener('systemSettingsUpdated', handleSystemSettingsUpdate);
		};
	}, []);

	const fetchSystemSettings = async () => {
		try {
			const res = await fetch("/api/admin/settings/public");
			
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}
			
			const data = await res.json();
			setSystemSettings(data);
		} catch (error) {
			console.error("Error fetching system settings:", error);
			setError(error.message);
			// Default to enabled if there's an error
			setSystemSettings({
				mobileAvailability: { enabled: true, message: "" },
				maintenanceMode: { enabled: false, message: "" }
			});
		} finally {
			setLoading(false);
		}
	};

	const isMobileDevice = () => {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	};

	const isMobileDisabled = isMobileDevice() && systemSettings?.mobileAvailability && !systemSettings.mobileAvailability.enabled;
	const isMaintenanceMode = systemSettings?.maintenanceMode && systemSettings.maintenanceMode.enabled;

	const getMobileMessage = () => {
		return systemSettings?.mobileAvailability?.message || "Website is currently unavailable for mobile users. Please use a desktop device.";
	};

	const getMaintenanceMessage = () => {
		return systemSettings?.maintenanceMode?.message || "System is currently under maintenance. Please try again later.";
	};

	return {
		systemSettings,
		loading,
		error,
		isMobileDevice: isMobileDevice(),
		isMobileDisabled,
		isMaintenanceMode,
		getMobileMessage,
		getMaintenanceMessage,
		refreshSettings: fetchSystemSettings
	};
};

export default useSystemSettings; 