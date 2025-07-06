import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext.jsx";

const AdminLogin = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [otp, setOtp] = useState("");
	const [loading, setLoading] = useState(false);
	const [otpLoading, setOtpLoading] = useState(false);
	const [error, setError] = useState("");
	const [showOtpInput, setShowOtpInput] = useState(false);
	const [email, setEmail] = useState("");
	const navigate = useNavigate();
	const { setAdmin } = useAuthContext();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/admin/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, password }),
				credentials: "include",
			});

			const data = await res.json();

			if (data.error) {
				setError(data.error);
				return;
			}

			if (data.requiresOtp) {
				setShowOtpInput(true);
				setEmail(data.email);
				setError("");
			} else {
				setAdmin(data);
				navigate("/admin/dashboard");
			}
		} catch (error) {
			setError("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleOtpSubmit = async (e) => {
		e.preventDefault();
		setOtpLoading(true);
		setError("");

		try {
			const res = await fetch("/api/admin/verify-login-otp", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, otp }),
				credentials: "include",
			});

			const data = await res.json();

			if (data.error) {
				setError(data.error);
				return;
			}

			setAdmin(data);
			navigate("/admin/dashboard");
		} catch (error) {
			setError("An error occurred. Please try again.");
		} finally {
			setOtpLoading(false);
		}
	};

	const handleBackToLogin = () => {
		setShowOtpInput(false);
		setOtp("");
		setError("");
	};

	return (
		<div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<div className="mx-auto h-12 w-12 bg-red-600 rounded-full flex items-center justify-center">
						<svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-white">
						{showOtpInput ? "Verify OTP" : "Admin Access"}
					</h2>
					<p className="mt-2 text-center text-sm text-gray-400">
						{showOtpInput 
							? `Enter the OTP sent to ${email}` 
							: "Enter your admin credentials to continue"
						}
					</p>
				</div>

				{!showOtpInput ? (
					<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
						<div className="rounded-md shadow-sm -space-y-px">
							<div>
								<label htmlFor="username" className="sr-only">
									Username or Email
								</label>
								<input
									id="username"
									name="username"
									type="text"
									required
									className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
									placeholder="Username or Email"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
								/>
							</div>
							<div>
								<label htmlFor="password" className="sr-only">
									Password
								</label>
								<input
									id="password"
									name="password"
									type="password"
									required
									className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
									placeholder="Password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
							</div>
						</div>

						{error && (
							<div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative">
								{error}
							</div>
						)}

						<div>
							<button
								type="submit"
								disabled={loading}
								className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{loading ? (
									<div className="flex items-center">
										<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Sending OTP...
									</div>
								) : (
									"Send OTP"
								)}
							</button>
						</div>

						<div className="text-center space-y-2">
							<button
								type="button"
								onClick={() => navigate("/")}
								className="text-gray-400 hover:text-white text-sm block w-full"
							>
								← Back to main site
							</button>
							<button
								type="button"
								onClick={() => navigate("/admin/forgot-password")}
								className="text-gray-400 hover:text-white text-sm block w-full"
							>
								Forgot Password?
							</button>
						</div>
					</form>
				) : (
					<form className="mt-8 space-y-6" onSubmit={handleOtpSubmit}>
						<div>
							<label htmlFor="otp" className="sr-only">
								OTP
							</label>
							<input
								id="otp"
								name="otp"
								type="text"
								required
								maxLength="6"
								className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm text-center text-2xl tracking-widest"
								placeholder="000000"
								value={otp}
								onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
							/>
						</div>

						{error && (
							<div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative">
								{error}
							</div>
						)}

						<div>
							<button
								type="submit"
								disabled={otpLoading}
								className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{otpLoading ? (
									<div className="flex items-center">
										<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Verifying...
									</div>
								) : (
									"Verify OTP"
								)}
							</button>
						</div>

						<div className="text-center">
							<button
								type="button"
								onClick={handleBackToLogin}
								className="text-gray-400 hover:text-white text-sm"
							>
								← Back to login
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};

export default AdminLogin; 