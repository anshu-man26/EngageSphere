import { Link } from "react-router-dom";
import GenderCheckbox from "./GenderCheckbox";
import { useState } from "react";
import useSignup from "../../hooks/useSignup";
import useSendSignupOtp from "../../hooks/useSendSignupOtp";
import useVerifySignupOtp from "../../hooks/useVerifySignupOtp";
import useRegistrationStatus from "../../hooks/useRegistrationStatus";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaEnvelope, FaExclamationTriangle } from "react-icons/fa";
import logo from "../../assets/images/logo.png";
import ComplaintModal from "../../components/ComplaintModal";

const inputBase =
	"w-full pl-10 pr-4 py-3 bg-[#2A3942] border rounded-xl text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/40 transition-colors";

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
	const [showComplaintModal, setShowComplaintModal] = useState(false);

	const { loading, signup } = useSignup();
	const { loading: otpLoading, sendOtp } = useSendSignupOtp();
	const { loading: verifyLoading, verifyOtp } = useVerifySignupOtp();
	const { registrationEnabled, loading: registrationLoading } = useRegistrationStatus();

	const handleCheckboxChange = (gender) => {
		setInputs({ ...inputs, gender });
		setErrors((prev) => ({ ...prev, gender: "" }));
	};

	const validateForm = () => {
		const newErrors = {};

		if (!inputs.fullName.trim()) newErrors.fullName = "Full name is required";
		else if (inputs.fullName.trim().length < 2) newErrors.fullName = "Full name must be at least 2 characters";

		if (!inputs.email.trim()) newErrors.email = "Email is required";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputs.email.trim())) newErrors.email = "Please enter a valid email address";

		if (!emailVerified) newErrors.email = "Please verify your email address";

		if (!inputs.password) newErrors.password = "Password is required";
		else if (inputs.password.length < 6) newErrors.password = "Password must be at least 6 characters";

		if (!inputs.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
		else if (inputs.password !== inputs.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

		if (!inputs.gender) newErrors.gender = "Please select your gender";

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (validateForm()) await signup(inputs);
	};

	const handleInputChange = (field, value) => {
		setInputs({ ...inputs, [field]: value });
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
	};

	const handleSendOtp = async () => {
		if (!inputs.email.trim()) {
			setErrors((prev) => ({ ...prev, email: "Email is required" }));
			return;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(inputs.email.trim())) {
			setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
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
		<div className='flex flex-col items-center justify-center min-h-screen px-4 py-10 bg-[#0B141A] auth-page'>
			<div className='w-full max-w-md'>
				{/* Brand */}
				<div className='text-center mb-7'>
					<div className='flex items-center justify-center gap-2.5 mb-3'>
						<img src={logo} alt='EngageSphere Logo' className='h-9 w-9 object-contain' />
						<span className='text-3xl font-bold text-[#E9EDEF] tracking-tight'>EngageSphere</span>
					</div>
					<p className='text-[#8696A0] text-sm'>Create your account to start chatting.</p>
				</div>

				{/* Card */}
				<div className='bg-[#111B21] ring-1 ring-[#222D34] rounded-2xl shadow-xl p-7'>
					{registrationLoading ? (
						<div className='flex items-center justify-center py-8'>
							<div className='animate-spin rounded-full h-7 w-7 border-2 border-emerald-500 border-t-transparent' />
							<span className='ml-3 text-[#8696A0] text-sm'>Checking registration status…</span>
						</div>
					) : !registrationEnabled ? (
						<div className='text-center py-6'>
							<div className='w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/30 flex items-center justify-center'>
								<FaExclamationTriangle className='h-6 w-6 text-amber-400' />
							</div>
							<h3 className='text-lg font-semibold text-[#E9EDEF] mb-1'>Registration disabled</h3>
							<p className='text-[#8696A0] text-sm mb-6'>
								New user registration is currently disabled. Please check back later.
							</p>
							<div className='flex items-center justify-center gap-2'>
								<Link
									to='/login'
									className='inline-flex items-center px-4 py-2 bg-[#202C33] hover:bg-[#2A3942] text-[#E9EDEF] text-sm font-medium rounded-lg transition-colors'
								>
									Back to login
								</Link>
								<button
									onClick={() => setShowComplaintModal(true)}
									className='inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors'
								>
									<FaExclamationTriangle className='h-4 w-4' />
									Report an issue
								</button>
							</div>
						</div>
					) : (
						<form onSubmit={handleSubmit} className='space-y-5' autoComplete='on'>
							{/* Full Name */}
							<div className='space-y-2'>
								<label className='text-xs font-medium text-[#8696A0] uppercase tracking-wider'>Full name</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaUser className='h-4 w-4 text-[#8696A0]' />
									</div>
									<input
										type='text'
										placeholder='John Doe'
										className={`${inputBase} ${errors.fullName ? "border-red-500/60" : "border-[#374248]"}`}
										value={inputs.fullName}
										onChange={(e) => handleInputChange("fullName", e.target.value)}
										required
										autoComplete='name'
										name='fullName'
									/>
								</div>
								{errors.fullName && <p className='text-red-400 text-xs mt-1'>{errors.fullName}</p>}
							</div>

							{/* Email */}
							<div className='space-y-2'>
								<label className='text-xs font-medium text-[#8696A0] uppercase tracking-wider'>Email</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaEnvelope className='h-4 w-4 text-[#8696A0]' />
									</div>
									<input
										type='email'
										placeholder='you@example.com'
										className={`${inputBase} pr-24 ${
											errors.email ? "border-red-500/60" : emailVerified ? "border-emerald-500/60" : "border-[#374248]"
										}`}
										value={inputs.email}
										onChange={(e) => {
											handleInputChange("email", e.target.value);
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
											className='absolute inset-y-1 right-1 px-3 flex items-center bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
										>
											{otpLoading ? (
												<div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent' />
											) : (
												"Verify"
											)}
										</button>
									)}
									{emailVerified && (
										<div className='absolute inset-y-0 right-0 px-3 flex items-center'>
											<FaCheckCircle className='h-5 w-5 text-emerald-400' />
										</div>
									)}
								</div>
								{errors.email && <p className='text-red-400 text-xs mt-1'>{errors.email}</p>}
								{verifyError && <p className='text-red-400 text-xs mt-1'>{verifyError}</p>}
							</div>

							{/* OTP */}
							{showOtpInput && !verifyError && !emailVerified && (
								<div className='space-y-2 bg-[#202C33] ring-1 ring-[#2A3942] rounded-xl p-4'>
									<label className='text-xs font-medium text-[#8696A0] uppercase tracking-wider'>Enter OTP</label>
									<div className='relative'>
										<input
											type='text'
											placeholder='6-digit code'
											maxLength={6}
											className='w-full px-4 py-3 bg-[#111B21] border border-[#374248] rounded-lg text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/40 transition-colors text-center text-lg tracking-[0.5em] pr-20'
											value={otp}
											onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
										/>
										<button
											type='button'
											onClick={handleVerifyOtp}
											disabled={verifyLoading || otp.length !== 6}
											className='absolute inset-y-1 right-1 px-3 flex items-center bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
										>
											{verifyLoading ? (
												<div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent' />
											) : (
												"Confirm"
											)}
										</button>
									</div>
									{otpError && <p className='text-red-400 text-xs'>{otpError}</p>}
									<div className='flex justify-between items-center'>
										<p className='text-[11px] text-[#8696A0]'>Sent to {inputs.email}</p>
										<button
											type='button'
											onClick={handleResendOtp}
											disabled={otpLoading}
											className='text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50'
										>
											Resend
										</button>
									</div>
								</div>
							)}

							{/* Password */}
							<div className='space-y-2'>
								<label className='text-xs font-medium text-[#8696A0] uppercase tracking-wider'>Password</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaLock className='h-4 w-4 text-[#8696A0]' />
									</div>
									<input
										type={showPassword ? "text" : "password"}
										placeholder='At least 6 characters'
										className={`${inputBase} pr-12 ${errors.password ? "border-red-500/60" : "border-[#374248]"}`}
										value={inputs.password}
										onChange={(e) => handleInputChange("password", e.target.value)}
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
											<FaEyeSlash className='h-4 w-4 text-[#8696A0] hover:text-[#D1D7DB] transition-colors' />
										) : (
											<FaEye className='h-4 w-4 text-[#8696A0] hover:text-[#D1D7DB] transition-colors' />
										)}
									</button>
								</div>
								{errors.password && <p className='text-red-400 text-xs mt-1'>{errors.password}</p>}
							</div>

							{/* Confirm Password */}
							<div className='space-y-2'>
								<label className='text-xs font-medium text-[#8696A0] uppercase tracking-wider'>Confirm password</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaLock className='h-4 w-4 text-[#8696A0]' />
									</div>
									<input
										type={showConfirmPassword ? "text" : "password"}
										placeholder='Re-enter password'
										className={`${inputBase} pr-12 ${errors.confirmPassword ? "border-red-500/60" : "border-[#374248]"}`}
										value={inputs.confirmPassword}
										onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
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
											<FaEyeSlash className='h-4 w-4 text-[#8696A0] hover:text-[#D1D7DB] transition-colors' />
										) : (
											<FaEye className='h-4 w-4 text-[#8696A0] hover:text-[#D1D7DB] transition-colors' />
										)}
									</button>
								</div>
								{errors.confirmPassword && <p className='text-red-400 text-xs mt-1'>{errors.confirmPassword}</p>}
							</div>

							{/* Gender */}
							<div className='space-y-2'>
								<label className='text-xs font-medium text-[#8696A0] uppercase tracking-wider'>Gender</label>
								<GenderCheckbox onCheckboxChange={handleCheckboxChange} selectedGender={inputs.gender} />
								{errors.gender && <p className='text-red-400 text-xs mt-1'>{errors.gender}</p>}
							</div>

							{/* Submit */}
							<button
								type='submit'
								disabled={loading || !emailVerified || !registrationEnabled}
								className='w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/30'
							>
								{loading ? (
									<div className='flex items-center justify-center'>
										<div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2' />
										Creating account…
									</div>
								) : !emailVerified ? (
									"Verify email to continue"
								) : (
									"Create account"
								)}
							</button>

							<div className='text-center pt-1'>
								<Link
									to='/login'
									className='text-sm text-[#8696A0] hover:text-emerald-400 transition-colors'
								>
									Already have an account? <span className='font-semibold text-[#E9EDEF]'>Sign in</span>
								</Link>
							</div>
						</form>
					)}
				</div>

				<div className='text-center mt-7'>
					<p className='text-[#54656F] text-[11px]'>© 2024 EngageSphere. All rights reserved.</p>
					<div className='mt-3'>
						<button
							onClick={() => setShowComplaintModal(true)}
							className='text-[11px] text-[#8696A0] hover:text-emerald-400 transition-colors flex items-center justify-center gap-1 mx-auto'
						>
							<FaExclamationTriangle className='h-3 w-3' />
							Report an issue
						</button>
					</div>
				</div>
			</div>

			<ComplaintModal
				isOpen={showComplaintModal}
				onClose={() => setShowComplaintModal(false)}
				pageSubmitted='signup'
			/>
		</div>
	);
};

export default SignUp;
