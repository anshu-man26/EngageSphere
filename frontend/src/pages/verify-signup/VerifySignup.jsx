import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";
import useVerifySignupForm from "../../hooks/useVerifySignupForm";

const VerifySignup = () => {
	const navigate = useNavigate();
	const { otp, error, email, loading, handleOtpChange, handleSubmit, handleResendOTP, goSignup } =
		useVerifySignupForm();

	if (!email) {
		return (
			<div className='flex flex-col items-center justify-center min-h-screen bg-[#0B141A] px-4'>
				<div className='bg-[#111B21] ring-1 ring-[#222D34] p-7 rounded-2xl w-full max-w-md text-center'>
					<h1 className='text-xl font-semibold text-[#E9EDEF] mb-2'>Email verification</h1>
					<p className='text-[#8696A0] text-sm mb-5'>No email found. Please sign up again.</p>
					<button
						onClick={goSignup}
						className='w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg font-medium transition-colors'
					>
						Go to signup
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className='flex flex-col items-center justify-center min-h-screen bg-[#0B141A] px-4'>
			<div className='w-full max-w-md'>
				<div className='text-center mb-7'>
					<div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30 mb-4'>
						<FaEnvelope className='text-emerald-400 text-xl' />
					</div>
					<h1 className='text-2xl font-bold text-[#E9EDEF] mb-1'>Verify your email</h1>
					<p className='text-[#8696A0] text-sm'>
						Code sent to <span className='text-[#E9EDEF] font-medium'>{email}</span>
					</p>
				</div>

				<div className='bg-[#111B21] ring-1 ring-[#222D34] rounded-2xl shadow-xl p-7'>
					<form onSubmit={handleSubmit} className='space-y-5'>
						<div className='space-y-2'>
							<label className='text-xs font-medium text-[#8696A0] uppercase tracking-wider'>OTP</label>
							<input
								type='text'
								value={otp}
								onChange={handleOtpChange}
								placeholder='6-digit code'
								className='w-full px-4 py-3 bg-[#2A3942] border border-[#374248] rounded-xl text-[#E9EDEF] placeholder-[#8696A0] text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/40 transition-colors'
								maxLength={6}
								required
							/>
						</div>

						{error && <div className='text-red-400 text-xs text-center'>{error}</div>}

						<button
							type='submit'
							disabled={loading || otp.length !== 6}
							className='w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/30'
						>
							{loading ? "Verifying…" : "Verify email"}
						</button>
					</form>

					<div className='mt-5 text-center'>
						<p className='text-xs text-[#8696A0] mb-1'>Didn't receive the code?</p>
						<button
							onClick={handleResendOTP}
							disabled={loading}
							className='text-emerald-400 hover:text-emerald-300 text-xs font-medium disabled:opacity-50'
						>
							Resend OTP
						</button>
					</div>
				</div>

				<div className='mt-5 text-center'>
					<button
						onClick={() => navigate("/login")}
						className='inline-flex items-center gap-1.5 text-[#8696A0] hover:text-[#D1D7DB] text-xs transition-colors'
					>
						<FaArrowLeft className='text-[10px]' />
						Back to login
					</button>
				</div>
			</div>
		</div>
	);
};

export default VerifySignup;
