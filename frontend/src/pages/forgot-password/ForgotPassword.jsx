import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaArrowLeft, FaCheckCircle, FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-hot-toast";

const ForgotPassword = () => {
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [step, setStep] = useState("email"); // "email", "otp", "password", "success"
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const handleSendOTP = async (e) => {
		e.preventDefault();
		
		if (!email.trim()) {
			toast.error("Please enter your email address");
			return;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			toast.error("Please enter a valid email address");
			return;
		}

		setLoading(true);
		try {
			const res = await fetch("/api/auth/send-otp", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email: email.trim() }),
			});

			const data = await res.json();

			if (data.error) {
				throw new Error(data.error);
			}

			setStep("otp");
			toast.success("OTP sent successfully!");
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyOTP = async (e) => {
		e.preventDefault();
		
		if (!otp.trim()) {
			toast.error("Please enter the OTP");
			return;
		}

		if (otp.trim().length !== 6) {
			toast.error("OTP must be 6 digits");
			return;
		}

		setLoading(true);
		try {
			const res = await fetch("/api/auth/verify-otp", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
			});

			const data = await res.json();

			if (data.error) {
				throw new Error(data.error);
			}

			setStep("password");
			toast.success("OTP verified successfully!");
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleResetPassword = async (e) => {
		e.preventDefault();
		
		if (!newPassword || !confirmPassword) {
			toast.error("Please fill in all fields");
			return;
		}

		if (newPassword.length < 6) {
			toast.error("Password must be at least 6 characters");
			return;
		}

		if (newPassword !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		setLoading(true);
		try {
			const res = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ 
					email: email.trim(), 
					newPassword 
				}),
			});

			const data = await res.json();

			if (data.error) {
				throw new Error(data.error);
			}

			setStep("success");
			toast.success("Password reset successfully!");
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	if (step === "success") {
		return (
			<div className='flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 auth-page'>
				<div className='w-full max-w-md'>
					{/* Header */}
					<div className='text-center mb-8'>
						<div className='inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4 shadow-lg'>
							<FaCheckCircle className='text-white text-2xl' />
						</div>
						<h1 className='text-4xl font-bold text-white mb-2'>
							Password Reset!
						</h1>
						<p className='text-gray-300 text-sm'>
							Your password has been successfully reset
						</p>
					</div>

					{/* Success Message */}
					<div className='bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 relative'>
						<div className='text-center space-y-4'>
							<p className='text-gray-200 text-lg'>
								Your password has been updated successfully. You can now log in with your new password.
							</p>
							<div className='pt-4'>
								<Link 
									to="/login" 
									className='inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg'
								>
									<FaArrowLeft className='text-sm' />
									Go to Login
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 auth-page'>
			<div className='w-full max-w-md'>
				{/* Header */}
				<div className='text-center mb-8'>
					<div className='inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4 shadow-lg'>
						<FaKey className='text-white text-2xl' />
					</div>
					<h1 className='text-4xl font-bold text-white mb-2'>
						Reset Password
					</h1>
					<p className='text-gray-300 text-sm'>
						{step === "email" && "Enter your email to receive OTP"}
						{step === "otp" && "Enter the OTP sent to your email"}
						{step === "password" && "Enter your new password"}
					</p>
				</div>

				{/* Form */}
				<div className='bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 relative'>
					{/* Back Button */}
					<div className='absolute top-4 right-4'>
						<Link 
							to="/login" 
							className='inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm'
						>
							<FaArrowLeft className='text-xs' />
							Back to Login
						</Link>
					</div>

					{/* Email Step */}
					{step === "email" && (
						<form onSubmit={handleSendOTP} className='space-y-6'>
							<div className='space-y-2'>
								<label className='text-sm font-medium text-gray-200'>
									Email Address
								</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaEnvelope className='h-5 w-5 text-gray-400' />
									</div>
									<input
										type='email'
										placeholder='Enter your email address'
										className='w-full pl-10 pr-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200'
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
									/>
								</div>
								<p className='text-xs text-gray-400 mt-1'>
									We'll send you a 6-digit OTP to reset your password
								</p>
							</div>

							<button 
								type='submit' 
								className='w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-2'
								disabled={loading}
							>
								{loading ? (
									<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
								) : (
									<>
										<FaEnvelope className='text-lg' />
										Send OTP
									</>
								)}
							</button>
						</form>
					)}

					{/* OTP Step */}
					{step === "otp" && (
						<form onSubmit={handleVerifyOTP} className='space-y-6'>
							<div className='space-y-2'>
								<label className='text-sm font-medium text-gray-200'>
									Enter OTP
								</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaKey className='h-5 w-5 text-gray-400' />
									</div>
									<input
										type='text'
										placeholder='Enter 6-digit OTP'
										maxLength={6}
										className='w-full pl-10 pr-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest'
										value={otp}
										onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
										required
									/>
								</div>
								<p className='text-xs text-gray-400 mt-1'>
									OTP sent to {email}
								</p>
							</div>

							<button 
								type='submit' 
								className='w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-2'
								disabled={loading}
							>
								{loading ? (
									<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
								) : (
									<>
										<FaKey className='text-lg' />
										Verify OTP
									</>
								)}
							</button>

							<div className='text-center'>
								<button
									type='button'
									onClick={() => setStep("email")}
									className='text-sm text-gray-400 hover:text-purple-400 transition-colors'
								>
									Use different email
								</button>
							</div>
						</form>
					)}

					{/* Password Step */}
					{step === "password" && (
						<form onSubmit={handleResetPassword} className='space-y-6'>
							<div className='space-y-2'>
								<label className='text-sm font-medium text-gray-200'>
									New Password
								</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaKey className='h-5 w-5 text-gray-400' />
									</div>
									<input
										type={showPassword ? 'text' : 'password'}
										placeholder='Enter your new password'
										className='w-full pl-10 pr-12 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200'
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										required
									/>
									<button
										type='button'
										className='absolute inset-y-0 right-0 pr-3 flex items-center'
										onClick={() => setShowPassword(!showPassword)}
									>
										{showPassword ? (
											<FaEyeSlash className='h-5 w-5 text-gray-400' />
										) : (
											<FaEye className='h-5 w-5 text-gray-400' />
										)}
									</button>
								</div>
							</div>

							<div className='space-y-2'>
								<label className='text-sm font-medium text-gray-200'>
									Confirm New Password
								</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaKey className='h-5 w-5 text-gray-400' />
									</div>
									<input
										type={showConfirmPassword ? 'text' : 'password'}
										placeholder='Confirm your new password'
										className='w-full pl-10 pr-12 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200'
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										required
									/>
									<button
										type='button'
										className='absolute inset-y-0 right-0 pr-3 flex items-center'
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									>
										{showConfirmPassword ? (
											<FaEyeSlash className='h-5 w-5 text-gray-400' />
										) : (
											<FaEye className='h-5 w-5 text-gray-400' />
										)}
									</button>
								</div>
							</div>

							<button 
								type='submit' 
								className='w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-2'
								disabled={loading}
							>
								{loading ? (
									<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
								) : (
									<>
										<FaKey className='text-lg' />
										Reset Password
									</>
								)}
							</button>
						</form>
					)}
				</div>
			</div>
		</div>
	);
};

export default ForgotPassword; 