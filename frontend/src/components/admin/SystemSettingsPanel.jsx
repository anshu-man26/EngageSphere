import { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";

const SystemSettingsPanel = () => {
	const [settings, setSettings] = useState(null);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const { admin } = useAuthContext();

	// Form state
	const [formData, setFormData] = useState({
		mobileAvailability: {
			enabled: true,
			message: ""
		},
		maintenanceMode: {
			enabled: false,
			message: ""
		},
		features: {
			userRegistration: true,
			userLogin: true,
			fileUpload: true,
			videoCalls: true,
			notifications: true
		}
	});

	useEffect(() => {
		fetchSettings();
	}, []);

	const fetchSettings = async () => {
		if (!admin) return;

		setLoading(true);
		setError(null);
		
		try {
			const res = await fetch("/api/admin/settings", {
				credentials: "include"
			});
			
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}
			
			const data = await res.json();
			setSettings(data);
			setFormData({
				mobileAvailability: data.mobileAvailability || { enabled: true, message: "" },
				maintenanceMode: data.maintenanceMode || { enabled: false, message: "" },
				features: data.features || {
					userRegistration: true,
					userLogin: true,
					fileUpload: true,
					videoCalls: true,
					notifications: true
				}
			});
		} catch (error) {
			console.error("Error fetching system settings:", error);
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		if (!admin) return;

		setSaving(true);
		setError(null);
		setSuccess(null);
		
		try {
			const res = await fetch("/api/admin/settings", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json"
				},
				credentials: "include",
				body: JSON.stringify(formData)
			});
			
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}
			
			const data = await res.json();
			setSettings(data.settings);
			setSuccess("System settings updated successfully!");
			
			// Clear success message after 3 seconds
			setTimeout(() => setSuccess(null), 3000);
		} catch (error) {
			console.error("Error updating system settings:", error);
			setError(error.message);
		} finally {
			setSaving(false);
		}
	};

	const handleToggle = (section, field) => {
		setFormData(prev => ({
			...prev,
			[section]: {
				...prev[section],
				[field]: !prev[section][field]
			}
		}));
	};

	const handleMessageChange = (section, value) => {
		setFormData(prev => ({
			...prev,
			[section]: {
				...prev[section],
				message: value
			}
		}));
	};

	const handleFeatureToggle = (feature) => {
		setFormData(prev => ({
			...prev,
			features: {
				...prev.features,
				[feature]: !prev.features[feature]
			}
		}));
	};

	if (loading) {
		return (
			<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
				<div className="flex items-center justify-center">
					<svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					<span className="ml-2 text-gray-300">Loading system settings...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-gray-800 rounded-lg border border-gray-700">
			{/* Header */}
			<div className="px-6 py-4 border-b border-gray-700">
				<div className="flex justify-between items-center">
					<h2 className="text-xl font-semibold text-white">System Settings</h2>
					<button
						onClick={handleSave}
						disabled={saving}
						className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
					>
						{saving ? (
							<svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						) : (
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						)}
						<span>{saving ? "Saving..." : "Save Settings"}</span>
					</button>
				</div>
			</div>

			<div className="p-6">
				{/* Success/Error Messages */}
				{success && (
					<div className="mb-6 bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded relative">
						{success}
					</div>
				)}
				{error && (
					<div className="mb-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative">
						{error}
					</div>
				)}

				<div className="space-y-6">
					{/* Mobile Availability Settings */}
					<div className="bg-gray-700 p-6 rounded-lg">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center space-x-3">
								<svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
								</svg>
								<h3 className="text-lg font-semibold text-white">Mobile Availability</h3>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									checked={formData.mobileAvailability.enabled}
									onChange={() => handleToggle('mobileAvailability', 'enabled')}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
							</label>
						</div>
						
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Message for Mobile Users (when disabled)
								</label>
								<textarea
									value={formData.mobileAvailability.message}
									onChange={(e) => handleMessageChange('mobileAvailability', e.target.value)}
									placeholder="Website is currently unavailable for mobile users. Please use a desktop device."
									className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
									rows="3"
								/>
							</div>
							
							<div className="flex items-center space-x-2 text-sm">
								<div className={`w-3 h-3 rounded-full ${formData.mobileAvailability.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
								<span className="text-gray-300">
									{formData.mobileAvailability.enabled ? 'Mobile users can access the website' : 'Mobile users will see the unavailable message'}
								</span>
							</div>
						</div>
					</div>

					{/* Maintenance Mode Settings */}
					<div className="bg-gray-700 p-6 rounded-lg">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center space-x-3">
								<svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
								</svg>
								<h3 className="text-lg font-semibold text-white">Maintenance Mode</h3>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									checked={formData.maintenanceMode.enabled}
									onChange={() => handleToggle('maintenanceMode', 'enabled')}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
							</label>
						</div>
						
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Maintenance Message
								</label>
								<textarea
									value={formData.maintenanceMode.message}
									onChange={(e) => handleMessageChange('maintenanceMode', e.target.value)}
									placeholder="System is under maintenance. Please try again later."
									className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
									rows="3"
								/>
							</div>
							
							<div className="flex items-center space-x-2 text-sm">
								<div className={`w-3 h-3 rounded-full ${formData.maintenanceMode.enabled ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
								<span className="text-gray-300">
									{formData.maintenanceMode.enabled ? 'Maintenance mode is active' : 'System is running normally'}
								</span>
							</div>
						</div>
					</div>

					{/* Feature Toggles */}
					<div className="bg-gray-700 p-6 rounded-lg">
						<h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-3">
							<svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							<span>Feature Toggles</span>
						</h3>
						
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{Object.entries(formData.features).map(([feature, enabled]) => (
								<div key={feature} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
									<div>
										<p className="text-white font-medium capitalize">
											{feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
										</p>
										<p className="text-gray-400 text-sm">
											{enabled ? 'Feature is enabled' : 'Feature is disabled'}
										</p>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											checked={enabled}
											onChange={() => handleFeatureToggle(feature)}
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-500 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
									</label>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SystemSettingsPanel; 