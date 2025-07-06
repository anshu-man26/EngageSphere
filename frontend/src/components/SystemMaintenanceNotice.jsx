import useSystemSettings from "../hooks/useSystemSettings";
import { useAuthContext } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

const SystemMaintenanceNotice = () => {
	const { isMaintenanceMode, getMaintenanceMessage, loading } = useSystemSettings();
	const location = useLocation();

	if (loading) return null;

	// Don't show notice on admin routes (login, dashboard, etc.)
	if (!isMaintenanceMode || location.pathname.startsWith("/admin")) {
		return null;
	}

	return (
		<div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
			<div className="bg-gray-800 border border-yellow-500 rounded-lg p-8 max-w-md w-full text-center">
				{/* Icon */}
				<div className="mb-6">
					<svg className="w-16 h-16 text-yellow-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</div>

				{/* Title */}
				<h2 className="text-2xl font-bold text-white mb-4">
					System Maintenance
				</h2>

				{/* Message */}
				<p className="text-gray-300 mb-6 leading-relaxed">
					{getMaintenanceMessage()}
				</p>

				{/* Additional Info */}
				<div className="bg-gray-700 rounded-lg p-4 mb-6">
					<div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span>We're working to improve your experience. Please check back soon.</span>
					</div>
				</div>

				{/* Contact Info */}
				<div className="text-xs text-gray-500">
					<p>Thank you for your patience.</p>
				</div>
			</div>
		</div>
	);
};

export default SystemMaintenanceNotice; 