import { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaEnvelope, FaSpinner } from "react-icons/fa";

const AdminForgotPassword = () => {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [emailSent, setEmailSent] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setMessage("");

		try {
			const res = await fetch("/api/admin/forgot-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			});

			const data = await res.json();

			if (res.ok) {
				setMessage(data.message);
				setEmailSent(true);
			} else {
				setError(data.error);
			}
		} catch (error) {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
			<div className="max-w-md w-full space-y-8">
				<div className="bg-white rounded-lg shadow-xl p-8">
					{/* Header */}
					<div className="text-center mb-8">
						<Link
							to="/admin/login"
							className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
						>
							<FaArrowLeft className="mr-2" />
							Back to Login
						</Link>
						<h2 className="text-3xl font-bold text-gray-900 mb-2">
							Admin Password Recovery
						</h2>
						<p className="text-gray-600">
							Enter your admin email to receive a password reset OTP
						</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
								Admin Email
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FaEnvelope className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="email"
									name="email"
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
									placeholder="Enter your admin email"
									disabled={loading}
								/>
							</div>
						</div>

						{/* Error Message */}
						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
								{error}
							</div>
						)}

						{/* Success Message */}
						{message && (
							<div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
								{message}
							</div>
						)}

						{/* Submit Button */}
						<button
							type="submit"
							disabled={loading}
							className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							{loading ? (
								<>
									<FaSpinner className="animate-spin mr-2" />
									Sending OTP...
								</>
							) : (
								"Send Password Reset OTP"
							)}
						</button>
					</form>

					{/* Next Steps */}
					{emailSent && (
						<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<h3 className="text-sm font-medium text-blue-800 mb-2">Next Steps:</h3>
							<ol className="text-sm text-blue-700 space-y-1">
								<li>1. Check your email for the OTP</li>
								<li>2. Click the link below to verify the OTP</li>
								<li>3. Set your new password</li>
							</ol>
							<div className="mt-4">
								<Link
									to="/admin/verify-otp"
									state={{ email }}
									className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
								>
									Verify OTP
								</Link>
							</div>
						</div>
					)}

					{/* Footer */}
					<div className="mt-8 text-center">
						<p className="text-sm text-gray-600">
							Remember your password?{" "}
							<Link
								to="/admin/login"
								className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
							>
								Sign in here
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AdminForgotPassword; 