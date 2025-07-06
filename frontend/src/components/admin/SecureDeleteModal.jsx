import { useState, useEffect } from "react";
import { FaExclamationTriangle, FaKey, FaSpinner, FaTimes, FaCheck, FaShieldAlt, FaEnvelope } from "react-icons/fa";

const SecureDeleteModal = ({ 
	isOpen, 
	onClose, 
	selectedUsers, 
	onDeleteSuccess 
}) => {
	const [step, setStep] = useState("warning"); // warning, otp, final
	const [otp, setOtp] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [userDetails, setUserDetails] = useState([]);

	useEffect(() => {
		if (!isOpen) {
			setStep("warning");
			setOtp("");
			setError("");
			setMessage("");
			setUserDetails([]);
		}
	}, [isOpen]);

	const handleProceedToOtp = async () => {
		setLoading(true);
		setError("");

		try {
			const res = await fetch("http://localhost:5000/api/admin/request-delete-otp", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userIds: selectedUsers }),
				credentials: "include",
			});

			const data = await res.json();

			if (res.ok) {
				setMessage(data.message);
				setUserDetails(data.users || []);
				setStep("otp");
			} else {
				setError(data.error);
			}
		} catch (error) {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyOtp = async () => {
		setLoading(true);
		setError("");

		try {
			const res = await fetch("http://localhost:5000/api/admin/verify-delete-otp", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ otp }),
				credentials: "include",
			});

			const data = await res.json();

			if (res.ok) {
				setMessage(data.message);
				setUserDetails(data.users || []);
				setStep("final");
			} else {
				setError(data.error);
			}
		} catch (error) {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleFinalConfirm = async () => {
		setLoading(true);
		setError("");

		try {
			const res = await fetch("http://localhost:5000/api/admin/confirm-delete", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userIds: selectedUsers }),
				credentials: "include",
			});

			const data = await res.json();

			if (res.ok) {
				setMessage(data.message);
				// Close modal after 2 seconds and refresh
				setTimeout(() => {
					onDeleteSuccess();
					onClose();
				}, 2000);
			} else {
				setError(data.error);
			}
		} catch (error) {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
			<div className="bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-700">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-700">
					<div className="flex items-center space-x-3">
						<div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
							<FaShieldAlt className="text-white text-xl" />
						</div>
						<div>
							<h2 className="text-2xl font-bold text-white">Secure Delete</h2>
							<p className="text-sm text-gray-400">Multi-layer protection system</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
					>
						<FaTimes className="text-lg" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					{/* Step 1: Warning */}
					{step === "warning" && (
						<div className="space-y-6">
							<div className="bg-gradient-to-r from-red-900 to-red-800 border border-red-600 rounded-xl p-6">
								<div className="flex items-center space-x-3 mb-4">
									<FaExclamationTriangle className="text-red-300 text-2xl" />
									<h3 className="text-xl font-bold text-red-200">
										⚠️ Final Warning
									</h3>
								</div>
								<p className="text-red-100 text-lg mb-4">
									You are about to permanently delete <strong className="text-white">{selectedUsers.length} user account(s)</strong>.
								</p>
								<div className="bg-red-800 border border-red-600 rounded-lg p-4">
									<h4 className="text-red-200 font-semibold mb-2">⚠️ This action is IRREVERSIBLE!</h4>
									<ul className="text-red-100 text-sm space-y-1">
										<li>• All user data will be permanently deleted</li>
										<li>• Messages, conversations, and files will be lost</li>
										<li>• This action cannot be undone</li>
									</ul>
								</div>
							</div>

							<div className="bg-blue-900 border border-blue-600 rounded-xl p-4">
								<div className="flex items-center space-x-3 mb-2">
									<FaEnvelope className="text-blue-300" />
									<h4 className="text-blue-200 font-semibold">Next Step</h4>
								</div>
								<p className="text-blue-100 text-sm">
									An OTP will be sent to your admin email for verification
								</p>
							</div>

							{error && (
								<div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-lg">
									{error}
								</div>
							)}

							<div className="flex space-x-3">
								<button
									onClick={onClose}
									className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
								>
									Cancel
								</button>
								<button
									onClick={handleProceedToOtp}
									disabled={loading}
									className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
								>
									{loading ? (
										<>
											<FaSpinner className="animate-spin mr-2" />
											Sending OTP...
										</>
									) : (
										"Proceed to OTP"
									)}
								</button>
							</div>
						</div>
					)}

					{/* Step 2: OTP Verification */}
					{step === "otp" && (
						<div className="space-y-6">
							<div className="bg-gradient-to-r from-blue-900 to-blue-800 border border-blue-600 rounded-xl p-6">
								<div className="flex items-center space-x-3 mb-4">
									<FaEnvelope className="text-blue-300 text-2xl" />
									<h3 className="text-xl font-bold text-blue-200">
										📧 OTP Verification
									</h3>
								</div>
								<p className="text-blue-100 text-lg mb-4">
									An OTP has been sent to your admin email. Please check your inbox and enter the 6-digit code below.
								</p>
							</div>

							{userDetails.length > 0 && (
								<div className="bg-gray-800 border border-gray-600 rounded-xl p-4">
									<h4 className="text-gray-300 font-semibold mb-3">Accounts to be deleted:</h4>
									<div className="space-y-2">
										{userDetails.map((user, index) => (
											<div key={index} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
												<div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
													<span className="text-white text-sm font-bold">{index + 1}</span>
												</div>
												<div>
													<div className="text-white font-medium">{user.fullName}</div>
													<div className="text-gray-400 text-sm">@{user.username}</div>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-3">
									Enter 6-digit OTP
								</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
										<FaKey className="h-5 w-5 text-gray-400" />
									</div>
									<input
										type="text"
										value={otp}
										onChange={(e) => setOtp(e.target.value)}
										className="block w-full pl-12 pr-4 py-4 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl tracking-widest font-mono"
										placeholder="000000"
										maxLength={6}
										disabled={loading}
									/>
								</div>
							</div>

							{error && (
								<div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-lg">
									{error}
								</div>
							)}

							{message && (
								<div className="bg-green-900 border border-green-600 text-green-200 px-4 py-3 rounded-lg">
									{message}
								</div>
							)}

							<div className="flex space-x-3">
								<button
									onClick={onClose}
									className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
									disabled={loading}
								>
									Cancel
								</button>
								<button
									onClick={handleVerifyOtp}
									disabled={otp.length !== 6 || loading}
									className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
								>
									{loading ? (
										<>
											<FaSpinner className="animate-spin mr-2" />
											Verifying...
										</>
									) : (
										"Verify OTP"
									)}
								</button>
							</div>
						</div>
					)}

					{/* Step 3: Final Confirmation */}
					{step === "final" && (
						<div className="space-y-6">
							<div className="bg-gradient-to-r from-red-900 to-red-800 border border-red-600 rounded-xl p-6">
								<div className="flex items-center space-x-3 mb-4">
									<FaExclamationTriangle className="text-red-300 text-2xl" />
									<h3 className="text-xl font-bold text-red-200">
										🚨 Final Confirmation
									</h3>
								</div>
								<p className="text-red-100 text-lg mb-4">
									OTP verified successfully. This is your last chance to cancel the deletion.
								</p>
							</div>

							{userDetails.length > 0 && (
								<div className="bg-gray-800 border border-gray-600 rounded-xl p-4">
									<h4 className="text-gray-300 font-semibold mb-3">Final list of accounts to be deleted:</h4>
									<div className="space-y-2">
										{userDetails.map((user, index) => (
											<div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
												<div className="flex items-center space-x-3">
													<div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
														<span className="text-white text-sm font-bold">{index + 1}</span>
													</div>
													<div>
														<div className="text-white font-medium">{user.fullName}</div>
														<div className="text-gray-400 text-sm">@{user.username}</div>
													</div>
												</div>
												<div className="text-gray-400 text-sm">{user.email}</div>
											</div>
										))}
									</div>
								</div>
							)}

							{error && (
								<div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-lg">
									{error}
								</div>
							)}

							{message && (
								<div className="bg-green-900 border border-green-600 text-green-200 px-4 py-3 rounded-lg">
									{message}
								</div>
							)}

							<div className="flex space-x-3">
								<button
									onClick={onClose}
									className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
									disabled={loading}
								>
									Cancel
								</button>
								<button
									onClick={handleFinalConfirm}
									disabled={loading}
									className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
								>
									{loading ? (
										<>
											<FaSpinner className="animate-spin mr-2" />
											Deleting...
										</>
									) : (
										<>
											<FaCheck className="mr-2" />
											Confirm Deletion
										</>
									)}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SecureDeleteModal; 