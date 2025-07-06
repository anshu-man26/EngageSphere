import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext.jsx";

const AdminProfile = () => {
	const [profileData, setProfileData] = useState({
		username: "",
		email: ""
	});
	const [passwordData, setPasswordData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: ""
	});
	const [loading, setLoading] = useState(false);
	const [profileLoading, setProfileLoading] = useState(false);
	const [passwordLoading, setPasswordLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const navigate = useNavigate();
	const { admin, setAdmin } = useAuthContext();

	useEffect(() => {
		if (!admin) {
			navigate("/admin/login");
			return;
		}
		fetchAdminProfile();
	}, [admin]);

	const fetchAdminProfile = async () => {
		try {
			const res = await fetch("/api/admin/profile", {
				credentials: "include",
			});
			const data = await res.json();
			if (data.error) {
				setError(data.error);
				return;
			}
			setProfileData({
				username: data.username,
				email: data.email
			});
		} catch (error) {
			setError("Failed to fetch profile data");
		}
	};

	const handleProfileUpdate = async (e) => {
		e.preventDefault();
		setProfileLoading(true);
		setError("");
		setSuccess("");

		try {
			const res = await fetch("/api/admin/profile", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(profileData),
				credentials: "include",
			});

			const data = await res.json();

			if (data.error) {
				setError(data.error);
				return;
			}

			setSuccess("Profile updated successfully!");
			setAdmin(data.admin);
		} catch (error) {
			setError("Failed to update profile");
		} finally {
			setProfileLoading(false);
		}
	};

	const handlePasswordChange = async (e) => {
		e.preventDefault();
		setPasswordLoading(true);
		setError("");
		setSuccess("");

		if (passwordData.newPassword !== passwordData.confirmPassword) {
			setError("New passwords do not match");
			setPasswordLoading(false);
			return;
		}

		if (passwordData.newPassword.length < 6) {
			setError("New password must be at least 6 characters long");
			setPasswordLoading(false);
			return;
		}

		try {
			const res = await fetch("/api/admin/password", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					currentPassword: passwordData.currentPassword,
					newPassword: passwordData.newPassword
				}),
				credentials: "include",
			});

			const data = await res.json();

			if (data.error) {
				setError(data.error);
				return;
			}

			setSuccess("Password changed successfully!");
			setPasswordData({
				currentPassword: "",
				newPassword: "",
				confirmPassword: ""
			});
		} catch (error) {
			setError("Failed to change password");
		} finally {
			setPasswordLoading(false);
		}
	};

	const handleLogout = async () => {
		try {
			await fetch("/api/admin/logout", {
				method: "POST",
				credentials: "include",
			});
			setAdmin(null);
			navigate("/admin/login");
		} catch (error) {
			console.error("Error logging out:", error);
		}
	};

	if (!admin) return null;

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			{/* Header */}
			<header className="bg-gray-800 border-b border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center">
							<h1 className="text-2xl font-bold text-red-500">Admin Profile</h1>
						</div>
						<div className="flex items-center space-x-4">
							<button
								onClick={() => navigate("/admin/dashboard")}
								className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-sm font-medium"
							>
								Dashboard
							</button>
							<button
								onClick={handleLogout}
								className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium"
							>
								Logout
							</button>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Success/Error Messages */}
				{success && (
					<div className="mb-6 bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded relative">
						{success}
					</div>
				)}
				{error && (
					<div className="mb-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative">
						{error}
					</div>
				)}

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Profile Settings */}
					<div className="bg-gray-800 rounded-lg border border-gray-700">
						<div className="px-6 py-4 border-b border-gray-700">
							<h2 className="text-xl font-semibold">Profile Settings</h2>
						</div>
						<div className="p-6">
							<form onSubmit={handleProfileUpdate} className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Username
									</label>
									<input
										type="text"
										value={profileData.username}
										onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
										className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Email
									</label>
									<input
										type="email"
										value={profileData.email}
										onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
										className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
										required
									/>
								</div>
								<button
									type="submit"
									disabled={profileLoading}
									className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{profileLoading ? "Updating..." : "Update Profile"}
								</button>
							</form>
						</div>
					</div>

					{/* Password Change */}
					<div className="bg-gray-800 rounded-lg border border-gray-700">
						<div className="px-6 py-4 border-b border-gray-700">
							<h2 className="text-xl font-semibold">Change Password</h2>
						</div>
						<div className="p-6">
							<form onSubmit={handlePasswordChange} className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Current Password
									</label>
									<input
										type="password"
										value={passwordData.currentPassword}
										onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
										className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										New Password
									</label>
									<input
										type="password"
										value={passwordData.newPassword}
										onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
										className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
										required
										minLength={6}
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Confirm New Password
									</label>
									<input
										type="password"
										value={passwordData.confirmPassword}
										onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
										className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
										required
									/>
								</div>
								<button
									type="submit"
									disabled={passwordLoading}
									className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{passwordLoading ? "Changing..." : "Change Password"}
								</button>
							</form>
						</div>
					</div>
				</div>

				{/* Admin Info */}
				<div className="mt-8 bg-gray-800 rounded-lg border border-gray-700">
					<div className="px-6 py-4 border-b border-gray-700">
						<h2 className="text-xl font-semibold">Account Information</h2>
					</div>
					<div className="p-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-gray-400">Role</p>
								<p className="text-white font-medium">{admin.role}</p>
							</div>
							<div>
								<p className="text-sm text-gray-400">Last Login</p>
								<p className="text-white font-medium">
									{admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : "Never"}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-400">Account Status</p>
								<p className="text-green-400 font-medium">Active</p>
							</div>
							<div>
								<p className="text-sm text-gray-400">Permissions</p>
								<div className="flex flex-wrap gap-2 mt-1">
									{Object.entries(admin.permissions).map(([permission, hasPermission]) => (
										<span
											key={permission}
											className={`px-2 py-1 text-xs rounded-full ${
												hasPermission
													? "bg-green-900 text-green-200"
													: "bg-gray-700 text-gray-300"
											}`}
										>
											{permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
										</span>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AdminProfile; 