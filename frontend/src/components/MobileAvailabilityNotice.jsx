import useSystemSettings from "../hooks/useSystemSettings";
import { useAuthContext } from "../context/AuthContext";

const MobileAvailabilityNotice = () => {
	const { isMobileDisabled, getMobileMessage, loading } = useSystemSettings();
	const { authUser } = useAuthContext();

	if (loading) {
		return null; // Don't show anything while loading
	}

	// Don't show notice if mobile is enabled or if user is admin
	if (!isMobileDisabled || authUser?.isAdmin) {
		return null;
	}

	return (
		<div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
			<div className="bg-gray-800 border border-red-500 rounded-lg p-8 max-w-md w-full text-center">
				{/* Icon */}
				<div className="mb-6">
					<svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
				</div>

				{/* Title */}
				<h2 className="text-2xl font-bold text-white mb-4">
					Mobile Access Disabled
				</h2>

				{/* Message */}
				<p className="text-gray-300 mb-6 leading-relaxed">
					{getMobileMessage()}
				</p>

				{/* Additional Info */}
				<div className="bg-gray-700 rounded-lg p-4 mb-6">
					<div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span>Please use a desktop or laptop computer to access the website.</span>
					</div>
				</div>

				{/* Contact Info */}
				<div className="text-xs text-gray-500">
					<p>If you believe this is an error, please contact support.</p>
				</div>
			</div>
		</div>
	);
};

export default MobileAvailabilityNotice; 