import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { FaArrowLeft, FaUser, FaCalendar, FaEnvelope, FaEdit } from "react-icons/fa";
import { toast } from "react-hot-toast";

const UserProfile = () => {
	const { userId } = useParams();
	const { authUser } = useAuthContext();
	const navigate = useNavigate();
	
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchUserProfile = async () => {
			try {
				setLoading(true);
				const res = await fetch(`/api/users/profile/${userId}`, {
					credentials: "include",
				});

				const data = await res.json();
				if (data.error) {
					setError(data.error);
					return;
				}

				setUser(data.user);
			} catch (error) {
				setError("Failed to load user profile");
			} finally {
				setLoading(false);
			}
		};

		if (userId) {
			fetchUserProfile();
		}
	}, [userId]);

	// Format date for "Member since"
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { 
			year: 'numeric', 
			month: 'long' 
		});
	};

	if (loading) {
		return (
			<div className='h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center'>
				<div className='text-center'>
					<div className='w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
					</div>
					<p className='text-white text-lg'>Loading profile...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center'>
				<div className='text-center'>
					<div className='w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center'>
						<FaUser className='text-white text-2xl' />
					</div>
					<h2 className='text-2xl font-bold text-white mb-2'>Profile Not Found</h2>
					<p className='text-gray-300 mb-6'>{error}</p>
					<Link 
						to="/" 
						className='inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-all duration-200'
					>
						<FaArrowLeft className='text-sm' />
						Back to Chat
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className='h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-y-auto'>
			<div className='max-w-2xl mx-auto px-4 py-8'>
				{/* Header with back button */}
				<div className='flex items-center justify-between mb-8'>
					<button
						onClick={() => navigate(-1)}
						className='inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200'
					>
						<FaArrowLeft className='text-sm' />
						Back
					</button>
					{user?._id === authUser?._id && (
						<Link 
							to="/profile" 
							className='inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200'
						>
							<FaEdit className='text-sm' />
							Edit Profile
						</Link>
					)}
				</div>

				{/* Profile Header - Instagram Style */}
				<div className='bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-white/20'>
					<div className='flex flex-col md:flex-row items-center md:items-start gap-6'>
						{/* Profile Picture */}
						<div className='relative'>
							<div className='w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden shadow-2xl'>
								<img 
									src={user?.profilePic || 'https://cdn0.iconfinder.com/data/icons/communication-line-10/24/account_profile_user_contact_person_avatar_placeholder-512.png'} 
									alt={`${user?.fullName || 'User'} profile`}
									className='w-full h-full object-cover'
									onError={(e) => {
										e.target.src = 'https://cdn0.iconfinder.com/data/icons/communication-line-10/24/account_profile_user_contact_person_avatar_placeholder-512.png';
									}}
								/>
							</div>
						</div>

						{/* Profile Info */}
						<div className='flex-1 text-center md:text-left'>
							{/* Username and Name */}
							<div className='mb-4'>
								<h1 className='text-2xl md:text-3xl font-bold text-white mb-2'>
									{user?.fullName || 'Unknown User'}
								</h1>
								{user?.username && (
									<p className='text-gray-300 text-lg'>@{user.username}</p>
								)}
							</div>

							{/* Bio */}
							<div className='mb-4'>
								<p className='text-white text-sm md:text-base leading-relaxed'>
									{user?.bio || "Hey there! I'm using EngageSphere"}
								</p>
							</div>

							{/* Member Since */}
							<div className='flex items-center justify-center md:justify-start gap-2 text-gray-300 text-sm'>
								<FaCalendar className='text-gray-400' />
								<span>Member since {formatDate(user?.createdAt)}</span>
							</div>
						</div>
					</div>
				</div>



				{/* Additional Info */}
				<div className='bg-white/10 backdrop-blur-lg rounded-2xl p-6 mt-6 border border-white/20'>
					<h3 className='text-lg font-semibold text-white mb-4'>Profile Information</h3>
					<div className='space-y-3'>
						<div className='flex items-center gap-3 text-gray-300'>
							<FaUser className='text-gray-400' />
							<span>Full Name: {user?.fullName || 'Not provided'}</span>
						</div>
						{user?.username && (
							<div className='flex items-center gap-3 text-gray-300'>
								<FaUser className='text-gray-400' />
								<span>Username: @{user.username}</span>
							</div>
						)}
						<div className='flex items-center gap-3 text-gray-300'>
							<FaCalendar className='text-gray-400' />
							<span>Joined: {formatDate(user?.createdAt)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default UserProfile; 