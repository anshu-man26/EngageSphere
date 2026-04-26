import { Link } from "react-router-dom";
import { FaArrowLeft, FaKey, FaSpinner, FaEye, FaEyeSlash } from "react-icons/fa";
import useAdminVerifyOtpForm from "../../hooks/useAdminVerifyOtpForm";

const AdminVerifyOtp = () => {
	const {
		email,
		otp,
		newPassword,
		confirmPassword,
		showPassword,
		showConfirmPassword,
		message,
		error,
		step,
		loading,
		handleOtpChange,
		handleNewPasswordChange,
		handleConfirmPasswordChange,
		togglePassword,
		toggleConfirmPassword,
		handleVerifyOtp,
		handleResetPassword,
	} = useAdminVerifyOtpForm();

	if (step === "verify") {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4'>
				<div className='max-w-md w-full space-y-8'>
					<div className='bg-white rounded-lg shadow-xl p-8'>
						<div className='text-center mb-8'>
							<Link
								to='/admin/forgot-password'
								className='inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors'
							>
								<FaArrowLeft className='mr-2' />
								Back to Forgot Password
							</Link>
							<h2 className='text-3xl font-bold text-gray-900 mb-2'>Verify OTP</h2>
							<p className='text-gray-600'>Enter the 6-digit OTP sent to {email}</p>
						</div>

						<form onSubmit={handleVerifyOtp} className='space-y-6'>
							<div>
								<label htmlFor='otp' className='block text-sm font-medium text-gray-700 mb-2'>
									OTP Code
								</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaKey className='h-5 w-5 text-gray-400' />
									</div>
									<input
										id='otp'
										name='otp'
										type='text'
										required
										value={otp}
										onChange={handleOtpChange}
										className='block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-center text-lg tracking-widest'
										placeholder='000000'
										maxLength={6}
										disabled={loading}
									/>
								</div>
							</div>

							{error && <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>{error}</div>}

							<button
								type='submit'
								disabled={loading}
								className='w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
							>
								{loading ? (
									<>
										<FaSpinner className='animate-spin mr-2' />
										Verifying...
									</>
								) : (
									"Verify OTP"
								)}
							</button>
						</form>

						<div className='mt-8 text-center'>
							<p className='text-sm text-gray-600'>
								Didn't receive the OTP?{" "}
								<Link to='/admin/forgot-password' className='font-medium text-purple-600 hover:text-purple-500 transition-colors'>
									Request again
								</Link>
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Reset Password Step
	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4'>
			<div className='max-w-md w-full space-y-8'>
				<div className='bg-white rounded-lg shadow-xl p-8'>
					<div className='text-center mb-8'>
						<h2 className='text-3xl font-bold text-gray-900 mb-2'>Set New Password</h2>
						<p className='text-gray-600'>Create a new secure password for your admin account</p>
					</div>

					<form onSubmit={handleResetPassword} className='space-y-6'>
						<div>
							<label htmlFor='newPassword' className='block text-sm font-medium text-gray-700 mb-2'>
								New Password
							</label>
							<div className='relative'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<FaKey className='h-5 w-5 text-gray-400' />
								</div>
								<input
									id='newPassword'
									name='newPassword'
									type={showPassword ? "text" : "password"}
									required
									value={newPassword}
									onChange={handleNewPasswordChange}
									className='block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all'
									placeholder='Enter new password'
									disabled={loading}
								/>
								<button type='button' onClick={togglePassword} className='absolute inset-y-0 right-0 pr-3 flex items-center'>
									{showPassword ? <FaEyeSlash className='h-5 w-5 text-gray-400' /> : <FaEye className='h-5 w-5 text-gray-400' />}
								</button>
							</div>
						</div>

						<div>
							<label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700 mb-2'>
								Confirm New Password
							</label>
							<div className='relative'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<FaKey className='h-5 w-5 text-gray-400' />
								</div>
								<input
									id='confirmPassword'
									name='confirmPassword'
									type={showConfirmPassword ? "text" : "password"}
									required
									value={confirmPassword}
									onChange={handleConfirmPasswordChange}
									className='block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all'
									placeholder='Confirm new password'
									disabled={loading}
								/>
								<button type='button' onClick={toggleConfirmPassword} className='absolute inset-y-0 right-0 pr-3 flex items-center'>
									{showConfirmPassword ? <FaEyeSlash className='h-5 w-5 text-gray-400' /> : <FaEye className='h-5 w-5 text-gray-400' />}
								</button>
							</div>
						</div>

						{error && <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>{error}</div>}
						{message && <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg'>{message}</div>}

						<button
							type='submit'
							disabled={loading}
							className='w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
						>
							{loading ? (
								<>
									<FaSpinner className='animate-spin mr-2' />
									Resetting Password...
								</>
							) : (
								"Reset Password"
							)}
						</button>
					</form>

					<div className='mt-8 text-center'>
						<p className='text-sm text-gray-600'>
							Remember your password?{" "}
							<Link to='/admin/login' className='font-medium text-purple-600 hover:text-purple-500 transition-colors'>
								Sign in here
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AdminVerifyOtp;
