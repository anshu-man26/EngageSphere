import React from 'react';
import { FaTools, FaTimes } from 'react-icons/fa';

const VideoCallMaintenanceNotice = ({ onClose }) => {
	return (
		<div className="fixed inset-0 bg-black/95 z-[10000] flex items-center justify-center p-4 animate-fadeIn">
			<div className="w-full max-w-md bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-slideUp">
				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
				>
					<FaTimes size={16} />
				</button>

				{/* Maintenance Icon */}
				<div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
					<FaTools className="w-10 h-10 text-yellow-400" />
				</div>

				{/* Content */}
				<div className="text-center">
					<h2 className="text-2xl font-bold text-white mb-4">Video Calling Under Maintenance</h2>
					
					<p className="text-gray-300 text-lg mb-6 leading-relaxed">
						We're currently performing maintenance on our video calling service to improve your experience.
					</p>
					
					<div className="bg-gray-800/50 rounded-lg p-4 mb-6">
						<p className="text-gray-400 text-sm">
							<strong>What's happening:</strong> Our team is working to enhance video call quality and reliability.
						</p>
						<p className="text-gray-400 text-sm mt-2">
							<strong>Estimated time:</strong> We'll be back online shortly. Thank you for your patience!
						</p>
					</div>

					{/* Action Buttons */}
					<div className="space-y-3">
						<button
							onClick={onClose}
							className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full py-3 px-6 font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
						>
							Got it, thanks!
						</button>
						
						<button
							onClick={() => {
								// You can add a "Report Issue" functionality here
								window.open('/complaint', '_blank');
							}}
							className="w-full bg-gray-600 hover:bg-gray-700 text-white rounded-full py-2 px-4 font-medium text-sm transition-all duration-200"
						>
							Report an Issue
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default VideoCallMaintenanceNotice; 