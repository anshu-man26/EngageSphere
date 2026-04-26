import { Link } from "react-router-dom";
import { FaEnvelope, FaArrowLeft, FaCheckCircle, FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import useForgotPasswordForm from "../../hooks/useForgotPasswordForm";

const inputBase =
	"w-full pl-10 pr-4 py-3 bg-[#2A3942] border border-[#374248] rounded-xl text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/40 transition-colors";

const primaryBtn =
	"w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2";

const ForgotPassword = () => {
	const {
		email,
		otp,
		newPassword,
		confirmPassword,
		step,
		showPassword,
		showConfirmPassword,
		loading,
		handleEmailChange,
		handleOtpChange,
		handleNewPasswordChange,
		handleConfirmPasswordChange,
		togglePassword,
		toggleConfirmPassword,
		goBackToEmailStep,
		handleSendOTP,
		handleVerifyOTP,
		handleResetPassword,
	} = useForgotPasswordForm();

	if (step === "success") {
		return (
			<div className='flex flex-col items-center justify-center min-h-screen px-4 bg-[#0B141A] auth-page'>
				<div className='w-full max-w-md'>
					<div className='text-center mb-7'>
						<div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/40 mb-4'>
							<FaCheckCircle className='text-emerald-400 text-2xl' />
						</div>
						<h1 className='text-2xl font-bold text-[#E9EDEF] mb-1'>Password reset</h1>
						<p className='text-[#8696A0] text-sm'>You can now sign in with your new password.</p>
					</div>

					<div className='bg-[#111B21] ring-1 ring-[#222D34] rounded-2xl shadow-xl p-7 text-center'>
						<p className='text-[#D1D7DB] text-sm mb-6'>
							Your password has been updated successfully.
						</p>
						<Link to='/login' className={primaryBtn}>
							<FaArrowLeft className='text-sm' />
							Go to login
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='flex flex-col items-center justify-center min-h-screen px-4 bg-[#0B141A] auth-page'>
			<div className='w-full max-w-md'>
				<div className='text-center mb-7'>
					<div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30 mb-4'>
						<FaKey className='text-emerald-400 text-xl' />
					</div>
					<h1 className='text-2xl font-bold text-[#E9EDEF] mb-1'>Reset password</h1>
					<p className='text-[#8696A0] text-sm'>
						{step === "email" && "Enter your email to receive an OTP"}
						{step === "otp" && "Enter the 6-digit OTP sent to your email"}
						{step === "password" && "Set your new password"}
					</p>
				</div>

				<div className='bg-[#111B21] ring-1 ring-[#222D34] rounded-2xl shadow-xl p-7 relative'>
					<div className='absolute top-3 right-4'>
						<Link to='/login' className='inline-flex items-center gap-1.5 text-[#8696A0] hover:text-[#E9EDEF] transition-colors text-xs'>
							<FaArrowLeft className='text-[10px]' />
							Back to login
						</Link>
					</div>

					{step === "email" && (
						<form onSubmit={handleSendOTP} className='space-y-5 mt-4'>
							<div className='space-y-2'>
								<label className='text-xs font-medium text-[#8696A0] uppercase tracking-wider'>Email</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaEnvelope className='h-4 w-4 text-[#8696A0]' />
									</div>
									<input
										type='email'
										placeholder='you@example.com'
										className={inputBase}
										value={email}
										onChange={handleEmailChange}
										required
									/>
								</div>
								<p className='text-[11px] text-[#8696A0]'>We'll send you a 6-digit OTP.</p>
							</div>

							<button type='submit' disabled={loading} className={primaryBtn}>
								{loading ? (
									<div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent' />
								) : (
									<>
										<FaEnvelope />
										Send OTP
									</>
								)}
							</button>
						</form>
					)}

					{step === "otp" && (
						<form onSubmit={handleVerifyOTP} className='space-y-5 mt-4'>
							<div className='space-y-2'>
								<label className='text-xs font-medium text-[#8696A0] uppercase tracking-wider'>OTP code</label>
								<input
									type='text'
									placeholder='6-digit code'
									maxLength={6}
									className='w-full px-4 py-3 bg-[#2A3942] border border-[#374248] rounded-xl text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/40 transition-colors text-center text-2xl tracking-[0.5em]'
									value={otp}
									onChange={handleOtpChange}
									required
								/>
								<p className='text-[11px] text-[#8696A0]'>Sent to {email}</p>
							</div>

							<button type='submit' disabled={loading} className={primaryBtn}>
								{loading ? (
									<div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent' />
								) : (
									<>
										<FaKey />
										Verify OTP
									</>
								)}
							</button>

							<div className='text-center'>
								<button
									type='button'
									onClick={goBackToEmailStep}
									className='text-xs text-[#8696A0] hover:text-emerald-400 transition-colors'
								>
									Use different email
								</button>
							</div>
						</form>
					)}

					{step === "password" && (
						<form onSubmit={handleResetPassword} className='space-y-5 mt-4'>
							<div className='space-y-2'>
								<label className='text-xs font-medium text-[#8696A0] uppercase tracking-wider'>New password</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaKey className='h-4 w-4 text-[#8696A0]' />
									</div>
									<input
										type={showPassword ? "text" : "password"}
										placeholder='Enter new password'
										className={`${inputBase} pr-12`}
										value={newPassword}
										onChange={handleNewPasswordChange}
										required
									/>
									<button
										type='button'
										className='absolute inset-y-0 right-0 pr-3 flex items-center'
										onClick={togglePassword}
									>
										{showPassword ? (
											<FaEyeSlash className='h-4 w-4 text-[#8696A0] hover:text-[#D1D7DB]' />
										) : (
											<FaEye className='h-4 w-4 text-[#8696A0] hover:text-[#D1D7DB]' />
										)}
									</button>
								</div>
							</div>

							<div className='space-y-2'>
								<label className='text-xs font-medium text-[#8696A0] uppercase tracking-wider'>Confirm password</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaKey className='h-4 w-4 text-[#8696A0]' />
									</div>
									<input
										type={showConfirmPassword ? "text" : "password"}
										placeholder='Re-enter password'
										className={`${inputBase} pr-12`}
										value={confirmPassword}
										onChange={handleConfirmPasswordChange}
										required
									/>
									<button
										type='button'
										className='absolute inset-y-0 right-0 pr-3 flex items-center'
										onClick={toggleConfirmPassword}
									>
										{showConfirmPassword ? (
											<FaEyeSlash className='h-4 w-4 text-[#8696A0] hover:text-[#D1D7DB]' />
										) : (
											<FaEye className='h-4 w-4 text-[#8696A0] hover:text-[#D1D7DB]' />
										)}
									</button>
								</div>
							</div>

							<button type='submit' disabled={loading} className={primaryBtn}>
								{loading ? (
									<div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent' />
								) : (
									<>
										<FaKey />
										Reset password
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
