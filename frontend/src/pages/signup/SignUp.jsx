import { Link } from "react-router-dom";
import GenderCheckbox from "./GenderCheckbox";
import { useState } from "react";
import useSignup from "../../hooks/useSignup";
import useSendSignupOtp from "../../hooks/useSendSignupOtp";
import useVerifySignupOtp from "../../hooks/useVerifySignupOtp";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaUserCircle, FaCheckCircle, FaEnvelope, FaTimes } from "react-icons/fa";
import logo from '../../assets/images/logo.png';

const SignUp = () => {
	const [inputs, setInputs] = useState({
		fullName: "",
		email: "",
		password: "",
		confirmPassword: "",
		gender: "",
	});

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [errors, setErrors] = useState({});
	const [emailVerified, setEmailVerified] = useState(false);
	const [otp, setOtp] = useState("");
	const [showOtpInput, setShowOtpInput] = useState(false);
	const [otpError, setOtpError] = useState("");
	const [verifyError, setVerifyError] = useState("");

	const { loading, signup } = useSignup();
	const { loading: otpLoading, sendOtp } = useSendSignupOtp();
	const { loading: verifyLoading, verifyOtp } = useVerifySignupOtp();

	const handleCheckboxChange = (gender) => {
		setInputs({ ...inputs, gender });
		setErrors(prev => ({ ...prev, gender: "" }));
	};

	const validateForm = () => {
		const newErrors = {};

		if (!inputs.fullName.trim()) {
			newErrors.fullName = "Full name is required";
		} else if (inputs.fullName.trim().length < 2) {
			newErrors.fullName = "Full name must be at least 2 characters";
		}

		if (!inputs.email.trim()) {
			newErrors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputs.email.trim())) {
			newErrors.email = "Please enter a valid email address";
		}

		if (!emailVerified) {
			newErrors.email = "Please verify your email address";
		}

		if (!inputs.password) {
			newErrors.password = "Password is required";
		} else if (inputs.password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		}

		if (!inputs.confirmPassword) {
			newErrors.confirmPassword = "Please confirm your password";
		} else if (inputs.password !== inputs.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		if (!inputs.gender) {
			newErrors.gender = "Please select your gender";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (validateForm()) {
			await signup(inputs);
		}
	};

	const handleInputChange = (field, value) => {
		setInputs({ ...inputs, [field]: value });
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: "" }));
		}
	};

	const handleSendOtp = async () => {
		if (!inputs.email.trim()) {
			setErrors(prev => ({ ...prev, email: "Email is required" }));
			return;
		}
		
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(inputs.email.trim())) {
			setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
			return;
		}

		const result = await sendOtp(inputs.email.trim());
		if (result.success) {
			setShowOtpInput(true);
			setOtpError("");
			setVerifyError("");
		} else {
			setShowOtpInput(false);
			setVerifyError(result.error);
		}
	};

	const handleVerifyOtp = async () => {
		if (!otp || otp.length !== 6) {
			setOtpError("Please enter a valid 6-digit OTP");
			return;
		}

		const result = await verifyOtp(inputs.email.trim(), otp);
		if (result.success) {
			setEmailVerified(true);
			setShowOtpInput(false);
			setOtp("");
			setOtpError("");
		} else {
			setOtpError(result.error);
		}
	};

	const handleResendOtp = async () => {
		const result = await sendOtp(inputs.email.trim());
		if (result.success) {
			setOtp("");
			setOtpError("");
		}
	};

	return (
		<div className='flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 auth-page'>
			<div className='w-full max-w-md'>
				{/* Logo/Brand Section */}
				<div className='text-center mb-8'>
					<div className='flex items-center justify-center gap-3 mb-4'>
						<img src={logo} alt='EngageSphere Logo' className='h-10 w-10 object-contain' />
						<span className='text-4xl font-bold text-white'>EngageSphere</span>
					</div>
					<p className='text-gray-300 text-sm'>Create your account and start chatting</p>
				</div>

				{/* Sign Up Form */}
				<div className='bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8'>
					<form onSubmit={handleSubmit} className='space-y-6' autoComplete='on'>
						{/* Full Name Field */}
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-200'>
								Full Name
							</label>
							<div className='relative'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<FaUser className='h-5 w-5 text-gray-400' />
								</div>
								<input
									type='text'
									placeholder='John Doe'
									className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
										errors.fullName ? 'border-red-500' : 'border-gray-600'
									}`}
									value={inputs.fullName}
									onChange={(e) => handleInputChange('fullName', e.target.value)}
									required
									autoComplete='name'
									name='fullName'
								/>
							</div>
							{errors.fullName && (
								<p className='text-red-400 text-xs mt-1'>{errors.fullName}</p>
							)}
						</div>

						{/* Email Field */}
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
									placeholder='john@example.com'
									className={`w-full pl-10 pr-20 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
										errors.email ? 'border-red-500' : emailVerified ? 'border-green-500' : 'border-gray-600'
									}`}
									value={inputs.email}
									onChange={(e) => {
										handleInputChange('email', e.target.value);
										if (emailVerified) setEmailVerified(false);
										if (showOtpInput) setShowOtpInput(false);
									}}
									required
									autoComplete='email'
									name='email'
									disabled={emailVerified}
								/>
								{!emailVerified && (
									<button
										type='button'
										onClick={handleSendOtp}
										disabled={otpLoading || !inputs.email.trim()}
										className='absolute inset-y-0 right-0 px-3 flex items-center bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
									>
										{otpLoading ? (
											<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
										) : (
											'Verify'
										)}
									</button>
								)}
								{emailVerified && (
									<div className='absolute inset-y-0 right-0 px-3 flex items-center'>
										<FaCheckCircle className='h-5 w-5 text-green-400' />
									</div>
								)}
							</div>
							{errors.email && (
								<p className='text-red-400 text-xs mt-1'>{errors.email}</p>
							)}
							{verifyError && (
								<p className='text-red-400 text-xs mt-1'>{verifyError}</p>
							)}
						</div>

						{/* OTP Input */}
						{showOtpInput && !verifyError && !emailVerified && (
							<div className='space-y-2'>
								<label className='text-sm font-medium text-gray-200'>
									Enter OTP
								</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaLock className='h-5 w-5 text-gray-400' />
									</div>
									<input
										type='text'
										placeholder='Enter 6-digit OTP'
										maxLength={6}
										className='w-full pl-10 pr-20 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-lg tracking-widest'
										value={otp}
										onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
									/>
									<button
										type='button'
										onClick={handleVerifyOtp}
										disabled={verifyLoading || otp.length !== 6}
										className='absolute inset-y-0 right-0 px-3 flex items-center bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
									>
										{verifyLoading ? (
											<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
										) : (
											'Verify'
										)}
									</button>
								</div>
								{otpError && (
									<p className='text-red-400 text-xs mt-1'>{otpError}</p>
								)}
								<div className='flex justify-between items-center'>
									<p className='text-xs text-gray-400'>
										OTP sent to {inputs.email}
									</p>
									<button
										type='button'
										onClick={handleResendOtp}
										disabled={otpLoading}
										className='text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50'
									>
										Resend OTP
									</button>
								</div>
							</div>
						)}

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
									placeholder='Enter your password'
									className={`w-full pl-10 pr-12 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
										errors.password ? 'border-red-500' : 'border-gray-600'
									}`}
									value={inputs.password}
									onChange={(e) => handleInputChange('password', e.target.value)}
									required
									autoComplete='new-password'
									name='password'
								/>
								<button
									type='button'
									className='absolute inset-y-0 right-0 pr-3 flex items-center'
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? (
										<FaEyeSlash className='h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors' />
									) : (
										<FaEye className='h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors' />
									)}
								</button>
							</div>
							{errors.password && (
								<p className='text-red-400 text-xs mt-1'>{errors.password}</p>
							)}
						</div>

						{/* Confirm Password Field */}
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-200'>
								Confirm Password
							</label>
							<div className='relative'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<FaLock className='h-5 w-5 text-gray-400' />
								</div>
								<input
									type={showConfirmPassword ? 'text' : 'password'}
									placeholder='Confirm your password'
									className={`w-full pl-10 pr-12 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
										errors.confirmPassword ? 'border-red-500' : 'border-gray-600'
									}`}
									value={inputs.confirmPassword}
									onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
									required
									autoComplete='new-password'
									name='confirmPassword'
								/>
								<button
									type='button'
									className='absolute inset-y-0 right-0 pr-3 flex items-center'
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								>
									{showConfirmPassword ? (
										<FaEyeSlash className='h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors' />
									) : (
										<FaEye className='h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors' />
									)}
								</button>
							</div>
							{errors.confirmPassword && (
								<p className='text-red-400 text-xs mt-1'>{errors.confirmPassword}</p>
							)}
						</div>

						{/* Gender Selection */}
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-200'>
								Gender
							</label>
							<GenderCheckbox 
								onCheckboxChange={handleCheckboxChange} 
								selectedGender={inputs.gender} 
							/>
							{errors.gender && (
								<p className='text-red-400 text-xs mt-1'>{errors.gender}</p>
							)}
						</div>

						{/* Submit Button */}
						<button
							type='submit'
							disabled={loading || !emailVerified}
							className='w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg'
						>
							{loading ? (
								<div className='flex items-center justify-center'>
									<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
									Creating account...
								</div>
							) : !emailVerified ? (
								'Verify Email to Continue'
							) : (
								'Create Account'
							)}
						</button>

						{/* Login Link */}
						<div className='text-center'>
							<Link 
								to='/login' 
								className='text-sm text-gray-300 hover:text-purple-400 transition-colors duration-200 hover:underline'
							>
								Already have an account? <span className='font-semibold'>Sign in</span>
							</Link>
						</div>
					</form>
				</div>

				{/* Footer */}
				<div className='text-center mt-8'>
					<p className='text-gray-400 text-xs'>
						© 2024 EngageSphere. All rights reserved.
					</p>
				</div>
			</div>
		</div>
	);
};

export default SignUp;

// STARTER CODE FOR THE SIGNUP COMPONENT
// import GenderCheckbox from "./GenderCheckbox";

// const SignUp = () => {
// 	return (
// 		<div className='flex flex-col items-center justify-center min-w-96 mx-auto'>
// 			<div className='w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0'>
// 				<h1 className='text-3xl font-semibold text-center text-gray-300'>
// 					Sign Up <span className='text-blue-500'> ChatApp</span>
// 				</h1>

// 				<form>
// 					<div>
// 						<label className='label p-2'>
// 							<span className='text-base label-text'>Full Name</span>
// 						</label>
// 						<input type='text' placeholder='John Doe' className='w-full input input-bordered  h-10' />
// 					</div>

// 					<div>
// 						<label className='label p-2 '>
// 							<span className='text-base label-text'>Username</span>
// 						</label>
// 						<input type='text' placeholder='johndoe' className='w-full input input-bordered h-10' />
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

// 					<div>
// 						<label className='label'>
// 							<span className='text-base label-text'>Confirm Password</span>
// 						</label>
// 						<input
// 							type='password'
// 							placeholder='Confirm Password'
// 							className='w-full input input-bordered h-10'
// 						/>
// 					</div>

// 					<GenderCheckbox />

// 					<a className='text-sm hover:underline hover:text-blue-600 mt-2 inline-block' href='#'>
// 						Already have an account?
// 					</a>

// 					<div>
// 						<button className='btn btn-block btn-sm mt-2 border border-slate-700'>Sign Up</button>
// 					</div>
// 				</form>
// 			</div>
// 		</div>
// 	);
// };
// export default SignUp;
