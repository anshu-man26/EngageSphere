import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import SignUp from "./pages/signup/SignUp";
import VerifySignup from "./pages/verify-signup/VerifySignup";
import Profile from "./pages/profile/Profile";
import UserProfile from "./pages/user-profile/UserProfile";
import ForgotPassword from "./pages/forgot-password/ForgotPassword";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminForgotPassword from "./pages/admin/AdminForgotPassword";
import AdminVerifyOtp from "./pages/admin/AdminVerifyOtp";
import MobileAvailabilityNotice from "./components/MobileAvailabilityNotice";
import SystemMaintenanceNotice from "./components/SystemMaintenanceNotice";

import { Toaster } from "react-hot-toast";
import { useAuthContext } from "./context/AuthContext";

function App() {
	const { authUser, admin, loading } = useAuthContext();

	// Show loading screen while checking authentication
	if (loading) {
		return (
			<div className='min-h-screen bg-[#0B141A] flex items-center justify-center'>
				<div className='text-center'>
					<div className='w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30 flex items-center justify-center'>
						<div className='animate-spin rounded-full h-7 w-7 border-2 border-emerald-500 border-t-transparent' />
					</div>
					<p className='text-[#8696A0] text-sm'>Loading…</p>
				</div>
			</div>
		);
	}



	return (
		<div className='min-h-screen bg-[#0B141A]'>
			{/* System Notices */}
			<SystemMaintenanceNotice />
			<MobileAvailabilityNotice />
			
			<Routes>
					{/* Admin Routes */}
					<Route path='/admin/login' element={admin ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />} />
					<Route path='/admin/forgot-password' element={<AdminForgotPassword />} />
					<Route path='/admin/verify-otp' element={<AdminVerifyOtp />} />
					<Route path='/admin/dashboard' element={admin ? <AdminDashboard /> : <Navigate to="/admin/login" replace />} />
					<Route path='/admin/profile' element={admin ? <AdminProfile /> : <Navigate to="/admin/login" replace />} />
					
					{/* User Routes */}
					<Route path='/' element={authUser ? <Home /> : <Navigate to="/login" replace />} />
					<Route path='/login' element={authUser ? <Navigate to="/" replace /> : <Login />} />
					<Route path='/signup' element={authUser ? <Navigate to="/" replace /> : <SignUp />} />
					<Route path='/verify-signup' element={authUser ? <Navigate to="/" replace /> : <VerifySignup />} />
					<Route path='/profile' element={authUser ? <Profile /> : <Navigate to="/login" replace />} />
					<Route path='/user/:userId' element={authUser ? <UserProfile /> : <Navigate to="/login" replace />} />
					<Route path='/forgot-password' element={authUser ? <Navigate to="/" replace /> : <ForgotPassword />} />
				</Routes>
			<Toaster 
				position="top-right"
				toastOptions={{
					duration: 4000,
					style: {
						background: '#1f2937',
						color: '#fff',
						border: '1px solid #374151',
					},
				}}
			/>
		</div>
	);
}

export default App;
