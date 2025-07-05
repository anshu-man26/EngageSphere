import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext.jsx";

const VerifySignup = () => {
	const [otp, setOtp] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const navigate = useNavigate();
	const location = useLocation();
	const { setAuthUser } = useAuthContext();

	// Get email from location state or query params
	const email = location.state?.email || new URLSearchParams(location.search).get("email");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/auth/verify-signup-otp", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, otp }),
			});

			const data = await res.json();

			if (data.error) {
				setError(data.error);
				return;
			}

			// Set user in context
			setAuthUser(data.user);

			// Redirect to home
			navigate("/");
		} catch (error) {
			setError("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleResendOTP = async () => {
		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/auth/send-otp", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			});

			const data = await res.json();

			if (data.error) {
				setError(data.error);
				return;
			}

			alert("OTP resent successfully! Please check your email.");
		} catch (error) {
			setError("Failed to resend OTP. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	if (!email) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
				<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
					<h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
						Email Verification
					</h1>
					<p className="text-center text-gray-600 mb-4">
						No email found. Please sign up again.
					</p>
					<button
						onClick={() => navigate("/signup")}
						className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors"
					>
						Go to Signup
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
			<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
				<h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
					Verify Your Email
				</h1>
				<p className="text-center text-gray-600 mb-6">
					We've sent a verification code to <strong>{email}</strong>
				</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
							Enter OTP
						</label>
						<input
							type="text"
							id="otp"
							value={otp}
							onChange={(e) => setOtp(e.target.value)}
							placeholder="Enter 6-digit OTP"
							className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							maxLength={6}
							required
						/>
					</div>

					{error && (
						<div className="text-red-500 text-sm text-center">{error}</div>
					)}

					<button
						type="submit"
						disabled={loading || otp.length !== 6}
						className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? "Verifying..." : "Verify Email"}
					</button>
				</form>

				<div className="mt-6 text-center">
					<p className="text-sm text-gray-600 mb-2">
						Didn't receive the code?
					</p>
					<button
						onClick={handleResendOTP}
						disabled={loading}
						className="text-blue-500 hover:text-blue-600 text-sm font-medium disabled:opacity-50"
					>
						Resend OTP
					</button>
				</div>

				<div className="mt-6 text-center">
					<button
						onClick={() => navigate("/login")}
						className="text-gray-500 hover:text-gray-600 text-sm"
					>
						Back to Login
					</button>
				</div>
			</div>
		</div>
	);
};

export default VerifySignup; 