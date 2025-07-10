import { useState } from "react";
import { Link } from "react-router-dom";
import useLogin from "../../hooks/useLogin";
import useLoginStatus from "../../hooks/useLoginStatus";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaAt, FaExclamationTriangle } from "react-icons/fa";
import logo from '../../assets/images/logo.png';
import ComplaintModal from "../../components/ComplaintModal";

const Login = () => {
	const [inputs, setInputs] = useState({
		username: "",
		password: "",
	});
	const [otp, setOtp] = useState("");
	const [needsOTP, setNeedsOTP] = useState(false);
	const [otpSent, setOtpSent] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState({});
	const [showComplaintModal, setShowComplaintModal] = useState(false);

	const { loading, login } = useLogin();
	const { loginEnabled, loading: loginStatusLoading } = useLoginStatus();

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (needsOTP) {
			await login(inputs.username, inputs.password, otp);
		} else {
			const result = await login(inputs.username, inputs.password);
			if (result && result.needsOTP) {
				setNeedsOTP(true);
				setOtpSent(true);
			}
		}
	};

	const handleResendOTP = async () => {
		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ 
					email: inputs.username.includes('@') ? inputs.username : undefined,
					username: inputs.username.includes('@') ? undefined : inputs.username,
					password 
				}),
			});

			const data = await res.json();
			if (data.needsOTP) {
				setOtpSent(true);
			}
		} catch (error) {
			console.error("Error resending OTP:", error);
		}
	};

	// Determine if identifier looks like an email
	const isEmail = inputs.username.includes('@');

	return (
		<div className='flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 auth-page'>
			<div className='w-full max-w-md'>
				{/* Logo/Brand Section */}
				<div className='text-center mb-8'>
					<div className='flex items-center justify-center gap-3 mb-4'>
						<img src={logo} alt='EngageSphere Logo' className='h-10 w-10 object-contain' />
						<span className='text-4xl font-bold text-white'>EngageSphere</span>
					</div>
					<p className='text-gray-300 text-sm'>Sign in to your account</p>
				</div>

				{/* Login Form */}
				<div className='bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8'>
					{loginStatusLoading ? (
						<div className='flex items-center justify-center py-8'>
							<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
							<span className='ml-3 text-gray-300'>Checking login status...</span>
						</div>
					) : !loginEnabled ? (
						<div className='text-center py-8'>
							<div className='flex items-center justify-center mb-4'>
								<FaExclamationTriangle className='h-12 w-12 text-yellow-400' />
							</div>
							<h3 className='text-xl font-semibold text-white mb-2'>Login Temporarily Disabled</h3>
							<p className='text-gray-300 mb-6'>
								User login is currently disabled by the administrator. 
								Please check back later or contact support for assistance.
							</p>
							<button
								onClick={() => setShowComplaintModal(true)}
								className='inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200'
							>
								<FaExclamationTriangle className='h-4 w-4 mr-2' />
								Report an Issue
							</button>
						</div>
					) : (
					<form onSubmit={handleSubmit} className='space-y-6' autoComplete='on' method='post'>
						{/* Email/Username Field */}
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-200'>
								{isEmail ? 'Email Address' : 'Username'}
							</label>
							<div className='relative'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									{isEmail ? <FaUser className='h-5 w-5 text-gray-400' /> : <FaAt className='h-5 w-5 text-gray-400' />}
								</div>
								<input
									type={isEmail ? 'email' : 'text'}
										id='username'
									placeholder={isEmail ? 'Enter your email address' : 'Enter your username'}
									className='w-full pl-10 pr-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
										value={inputs.username}
										onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
									required
									autoComplete='email'
										name='username'
								/>
							</div>
							<p className='text-xs text-gray-400 mt-1'>
								You can login with your email address or username
							</p>
						</div>

						{/* Password Field */}
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-200'>
								Password
							</label>
							<div className='relative'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<FaLock className='h-5 w-5 text-gray-400' />
								</div>
								<input
									type={showPassword ? 'text' : 'password'}
									id='password'
									placeholder='Enter your password'
									className='w-full pl-10 pr-12 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
										value={inputs.password}
										onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
									required
									disabled={needsOTP}
									autoComplete='current-password'
									name='password'
								/>
								<button
									type='button'
									className='absolute inset-y-0 right-0 pr-3 flex items-center'
									onClick={() => setShowPassword(!showPassword)}
									disabled={needsOTP}
								>
									{showPassword ? (
										<FaEyeSlash className='h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors' />
									) : (
										<FaEye className='h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors' />
									)}
								</button>
							</div>
							{!needsOTP && (
								<div className='flex justify-end'>
									<Link 
										to='/forgot-password' 
										className='text-xs text-gray-400 hover:text-blue-400 transition-colors duration-200 hover:underline'
									>
										Forgot Password?
									</Link>
								</div>
							)}
						</div>

						{/* OTP Field - Show when 2FA is required */}
						{needsOTP && (
							<div className='space-y-2'>
								<label className='text-sm font-medium text-gray-200 flex items-center gap-2'>
									<FaShieldAlt className='h-4 w-4' />
									2FA Code
								</label>
								<div className='relative'>
									<input
										type='text'
										placeholder='Enter 6-digit OTP'
										className='w-full pl-4 pr-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
										value={otp}
										onChange={(e) => setOtp(e.target.value)}
										maxLength={6}
										required
									/>
								</div>
								<div className='flex justify-between items-center'>
									<p className='text-xs text-gray-400'>
										Enter the 6-digit code sent to your email
									</p>
									<button
										type='button'
										onClick={handleResendOTP}
										className='text-xs text-blue-400 hover:text-blue-300 transition-colors duration-200 hover:underline'
									>
										Resend OTP
									</button>
								</div>
							</div>
						)}

						{/* Submit Button */}
						<button
							type='submit'
							disabled={loading}
							className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg'
						>
							{loading ? (
								<div className='flex items-center justify-center'>
									<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
									{needsOTP ? 'Verifying...' : 'Signing in...'}
								</div>
							) : (
								needsOTP ? 'Verify & Sign In' : 'Sign In'
							)}
						</button>

						{/* Sign Up Link */}
						<div className='text-center'>
							<Link 
								to='/signup' 
								className='text-sm text-gray-300 hover:text-blue-400 transition-colors duration-200 hover:underline'
							>
								Don't have an account? <span className='font-semibold'>Sign up</span>
							</Link>
						</div>
					</form>
					)}
				</div>

				{/* Footer */}
				<div className='text-center mt-8'>
					<p className='text-gray-400 text-xs'>
						© 2024 EngageSphere. All rights reserved.
					</p>
					<div className='mt-2 space-y-2'>
						<button
							onClick={() => setShowComplaintModal(true)}
							className='text-xs text-gray-500 hover:text-purple-400 transition-colors duration-200 flex items-center justify-center gap-1 mx-auto'
						>
							<FaExclamationTriangle className='h-3 w-3' />
							Report an Issue
						</button>
						<Link 
							to='/admin/login' 
							className='text-xs text-gray-500 hover:text-red-400 transition-colors duration-200 block'
						>
							Admin Access
						</Link>
					</div>
				</div>
			</div>

			{/* Complaint Modal */}
			<ComplaintModal 
				isOpen={showComplaintModal} 
				onClose={() => setShowComplaintModal(false)}
				pageSubmitted="login"
			/>
		</div>
	);
};

export default Login;

// STARTER CODE FOR THIS FILE
// const Login = () => {
// 	return (
// 		<div className='flex flex-col items-center justify-center min-w-96 mx-auto'>
// 			<div className='w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0'>
// 				<h1 className='text-3xl font-semibold text-center text-gray-300'>
// 					Login
// 					<span className='text-blue-500'> ChatApp</span>
// 				</h1>

// 				<form>
// 					<div>
// 						<label className='label p-2'>
// 							<span className='text-base label-text'>Username</span>
// 						</label>
// 						<input type='text' placeholder='Enter username' className='w-full input input-bordered h-10' />
// 					</div>

// 					<div>
// 						<label className='label'>
// 							<span className='text-base label-text'>Password</span>
// 						</label>
// 						<input
// 							type='password'
// 							placeholder='Enter Password'
// 							className='w-full input input-bordered h-10'
// 						/>
// 					</div>
// 					<a href='#' className='text-sm  hover:underline hover:text-blue-600 mt-2 inline-block'>
// 						{"Don't"} have an account?
// 					</a>

// 					<div>
// 						<button className='btn btn-block btn-sm mt-2'>Login</button>
// 					</div>
// 				</form>
// 			</div>
// 		</div>
// 	);
// };
// export default Login;
