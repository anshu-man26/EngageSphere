import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import SignUp from "./pages/signup/SignUp";
import VerifySignup from "./pages/verify-signup/VerifySignup";
import Profile from "./pages/profile/Profile";
import UserProfile from "./pages/user-profile/UserProfile";
import ForgotPassword from "./pages/forgot-password/ForgotPassword";
import PageTransition from "./components/PageTransition";
import { Toaster } from "react-hot-toast";
import { useAuthContext } from "./context/AuthContext";

function App() {
	const { authUser, loading } = useAuthContext();

	// Show loading screen while checking authentication
	if (loading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center'>
				<div className='text-center'>
					<div className='w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
					</div>
					<p className='text-white text-lg'>Loading...</p>
				</div>
			</div>
		);
	}



	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900'>
			<PageTransition>
				<Routes>
					<Route path='/' element={authUser ? <Home /> : <Navigate to="/login" replace />} />
					<Route path='/login' element={authUser ? <Navigate to="/" replace /> : <Login />} />
					<Route path='/signup' element={authUser ? <Navigate to="/" replace /> : <SignUp />} />
					<Route path='/verify-signup' element={authUser ? <Navigate to="/" replace /> : <VerifySignup />} />
					<Route path='/profile' element={authUser ? <Profile /> : <Navigate to="/login" replace />} />
					<Route path='/user/:userId' element={authUser ? <UserProfile /> : <Navigate to="/login" replace />} />
					<Route path='/forgot-password' element={authUser ? <Navigate to="/" replace /> : <ForgotPassword />} />
				</Routes>
			</PageTransition>
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
