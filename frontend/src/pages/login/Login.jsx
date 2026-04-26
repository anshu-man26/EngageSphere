import { Link } from "react-router-dom";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaAt, FaExclamationTriangle } from "react-icons/fa";
import logo from "../../assets/images/logo.png";
import ComplaintModal from "../../components/ComplaintModal";
import useLoginForm from "../../hooks/useLoginForm";

const Login = () => {
	const {
		inputs,
		otp,
		needsOTP,
		showPassword,
		showComplaintModal,
		isEmail,
		loading,
		loginEnabled,
		loginStatusLoading,
		handleUsernameChange,
		handlePasswordChange,
		handleOtpChange,
		togglePassword,
		openComplaint,
		closeComplaint,
		handleSubmit,
		handleResendOTP,
	} = useLoginForm();

	const inputBase =
		"w-full pl-10 pr-4 py-3 bg-[#2A3942] border border-[#374248] rounded-xl text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/40 transition-colors";

	return (
		<div className='flex flex-col items-center justify-center min-h-screen px-4 bg-[#0B141A] auth-page'>
			<div className='w-full max-w-md'>
				{/* Brand */}
				<div className='text-center mb-8'>
					<div className='flex items-center justify-center gap-2.5 mb-3'>
						<img src={logo} alt='EngageSphere Logo' className='h-9 w-9 object-contain' />
						<span className='text-3xl font-bold text-[#E9EDEF] tracking-tight'>EngageSphere</span>
					</div>
					<p className='text-[#8696A0] text-sm'>Welcome back. Sign in to continue.</p>
				</div>

				{/* Card */}
				<div className='bg-[#111B21] ring-1 ring-[#222D34] rounded-2xl shadow-xl p-7'>
					{loginStatusLoading ? (
						<div className='flex items-center justify-center py-8'>
							<div className='animate-spin rounded-full h-7 w-7 border-2 border-emerald-500 border-t-transparent' />
							<span className='ml-3 text-[#8696A0] text-sm'>Checking login status…</span>
						</div>
					) : !loginEnabled ? (
						<div className='text-center py-6'>
							<div className='w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/30 flex items-center justify-center'>
								<FaExclamationTriangle className='h-6 w-6 text-amber-400' />
							</div>
							<h3 className='text-lg font-semibold text-[#E9EDEF] mb-1'>Login temporarily disabled</h3>
							<p className='text-[#8696A0] text-sm mb-6'>
								User login is currently disabled by the administrator. Please check back later.
							</p>
							<button
								onClick={openComplaint}
								className='inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors'
							>
								<FaExclamationTriangle className='h-4 w-4' />
								Report an Issue
							</button>
						</div>
					) : (
						<form onSubmit={handleSubmit} className='space-y-5' autoComplete='on' method='post'>
							<div className='space-y-2'>
								<label className='text-xs font-medium text-[#8696A0] uppercase tracking-wider'>
									{isEmail ? "Email" : "Username"}
								</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										{isEmail ? <FaUser className='h-4 w-4 text-[#667781]' /> : <FaAt className='h-4 w-4 text-[#667781]' />}
									</div>
									<input
										type={isEmail ? "email" : "text"}
										id='username'
										placeholder={isEmail ? "you@example.com" : "your_username"}
										className={inputBase}
										value={inputs.username}
										onChange={handleUsernameChange}
										required
										autoComplete='email'
										name='username'
									/>
								</div>
								<p className='text-[11px] text-[#667781] mt-1'>
									Sign in with your email or username.
								</p>
							</div>

							<div className='space-y-2'>
								<label className='text-xs font-medium text-[#8696A0] uppercase tracking-wider'>Password</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaLock className='h-4 w-4 text-[#667781]' />
									</div>
									<input
										type={showPassword ? "text" : "password"}
										id='password'
										placeholder='Enter your password'
										className={`${inputBase} pr-12`}
										value={inputs.password}
										onChange={handlePasswordChange}
										required
										disabled={needsOTP}
										autoComplete='current-password'
										name='password'
									/>
									<button
										type='button'
										className='absolute inset-y-0 right-0 pr-3 flex items-center'
										onClick={togglePassword}
										disabled={needsOTP}
									>
										{showPassword ? (
											<FaEyeSlash className='h-4 w-4 text-[#667781] hover:text-[#D1D7DB] transition-colors' />
										) : (
											<FaEye className='h-4 w-4 text-[#667781] hover:text-[#D1D7DB] transition-colors' />
										)}
									</button>
								</div>
								{!needsOTP && (
									<div className='flex justify-end'>
										<Link
											to='/forgot-password'
											className='text-xs text-[#8696A0] hover:text-emerald-400 transition-colors'
										>
											Forgot password?
										</Link>
									</div>
								)}
							</div>

							{needsOTP && (
								<div className='space-y-2'>
									<label className='text-xs font-medium text-[#8696A0] uppercase tracking-wider flex items-center gap-2'>
										<FaShieldAlt className='h-3.5 w-3.5' />
										2FA Code
									</label>
									<input
										type='text'
										placeholder='6-digit code'
										className='w-full px-4 py-3 bg-[#2A3942] border border-[#374248] rounded-xl text-[#E9EDEF] placeholder-[#8696A0] tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/40 transition-colors'
										value={otp}
										onChange={handleOtpChange}
										maxLength={6}
										required
									/>
									<div className='flex justify-between items-center'>
										<p className='text-[11px] text-[#667781]'>Sent to your email</p>
										<button
											type='button'
											onClick={handleResendOTP}
											className='text-xs text-emerald-400 hover:text-emerald-300 transition-colors'
										>
											Resend
										</button>
									</div>
								</div>
							)}

							<button
								type='submit'
								disabled={loading}
								className='w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/30'
							>
								{loading ? (
									<div className='flex items-center justify-center'>
										<div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2' />
										{needsOTP ? "Verifying…" : "Signing in…"}
									</div>
								) : needsOTP ? (
									"Verify & Sign in"
								) : (
									"Sign in"
								)}
							</button>

							<div className='text-center pt-1'>
								<Link
									to='/signup'
									className='text-sm text-[#8696A0] hover:text-emerald-400 transition-colors'
								>
									Don't have an account? <span className='font-semibold text-[#E9EDEF]'>Sign up</span>
								</Link>
							</div>
						</form>
					)}
				</div>

				<div className='text-center mt-7'>
					<p className='text-[#54656F] text-[11px]'>© 2024 EngageSphere. All rights reserved.</p>
					<div className='mt-3 flex items-center justify-center gap-4'>
						<button
							onClick={openComplaint}
							className='text-[11px] text-[#667781] hover:text-emerald-400 transition-colors flex items-center gap-1'
						>
							<FaExclamationTriangle className='h-3 w-3' />
							Report an issue
						</button>
						<span className='text-[#374248]'>•</span>
						<Link
							to='/admin/login'
							className='text-[11px] text-[#667781] hover:text-[#D1D7DB] transition-colors'
						>
							Admin
						</Link>
					</div>
				</div>
			</div>

			<ComplaintModal isOpen={showComplaintModal} onClose={closeComplaint} pageSubmitted='login' />
		</div>
	);
};

export default Login;
