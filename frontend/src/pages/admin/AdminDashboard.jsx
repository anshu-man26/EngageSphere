import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { useSocketContext } from "../../context/SocketContext.jsx";
import SecureDeleteModal from "../../components/admin/SecureDeleteModal.jsx";
import SystemHealthPanel from "../../components/admin/SystemHealthPanel.jsx";
import SystemSettingsPanel from "../../components/admin/SystemSettingsPanel.jsx";

const AdminDashboard = () => {
	const [users, setUsers] = useState([]);
	const [stats, setStats] = useState({});
	const [loading, setLoading] = useState(true);
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [showSecureDelete, setShowSecureDelete] = useState(false);
	const [statsUpdating, setStatsUpdating] = useState(false);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const [showOnlyOnline, setShowOnlyOnline] = useState(false);
	const navigate = useNavigate();
	const { admin, setAdmin } = useAuthContext();
	const { socket } = useSocketContext();

	useEffect(() => {
		if (!admin) {
			navigate("/admin/login");
			return;
		}
		fetchUsers();
		fetchStats();
	}, [admin, currentPage, searchTerm]);

	// Real-time stats updates
	useEffect(() => {
		if (!socket) return;

		// Listen for real-time stats updates
		socket.on("adminStatsUpdate", (newStats) => {
			setStats(newStats);
			setStatsUpdating(false);
		});

		// Listen for online users updates
		socket.on("getOnlineUsers", (onlineUserIds) => {
			setOnlineUsers(onlineUserIds);
		});

		// Request initial stats update
		socket.emit("requestAdminStats");

		return () => {
			socket.off("adminStatsUpdate");
			socket.off("getOnlineUsers");
		};
	}, [socket]);

	const fetchUsers = async () => {
		try {
			const res = await fetch(`/api/admin/users?page=${currentPage}&search=${searchTerm}`, {
				credentials: "include",
			});
			const data = await res.json();
			if (data.error) {
				console.error(data.error);
				return;
			}
			setUsers(data.users);
			setTotalPages(data.totalPages);
		} catch (error) {
			console.error("Error fetching users:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchStats = async () => {
		try {
			const res = await fetch("/api/admin/stats", {
				credentials: "include",
			});
			const data = await res.json();
			if (data.error) {
				console.error(data.error);
				return;
			}
			setStats(data);
		} catch (error) {
			console.error("Error fetching stats:", error);
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

	const handleDeleteUser = (userId) => {
		setSelectedUsers([userId]);
		setShowSecureDelete(true);
	};

	const handleDeleteMultipleUsers = () => {
		setShowSecureDelete(true);
	};

	const handleDeleteSuccess = () => {
		setSelectedUsers([]);
		fetchUsers();
		fetchStats();
	};

	const handleRefreshStats = () => {
		setStatsUpdating(true);
		if (socket) {
			socket.emit("requestAdminStats");
		} else {
			fetchStats();
		}
	};

	const isUserOnline = (userId) => {
		return onlineUsers.includes(userId);
	};

	const filteredUsers = showOnlyOnline 
		? users.filter(user => isUserOnline(user._id))
		: users;

	const toggleUserSelection = (userId) => {
		setSelectedUsers(prev => 
			prev.includes(userId) 
				? prev.filter(id => id !== userId)
				: [...prev, userId]
		);
	};

	const toggleSelectAll = () => {
		if (selectedUsers.length === filteredUsers.length) {
			setSelectedUsers([]);
		} else {
			setSelectedUsers(filteredUsers.map(user => user._id));
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
							<h1 className="text-2xl font-bold text-red-500">Admin Panel</h1>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-gray-300">Welcome, {admin.username}</span>
							<button
								onClick={() => navigate("/admin/profile")}
								className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-sm font-medium"
							>
								Profile
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

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Stats Header with Refresh Button */}
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-2xl font-bold text-white">System Statistics</h2>
					<button
						onClick={handleRefreshStats}
						disabled={statsUpdating}
						className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
					>
						{statsUpdating ? (
							<svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						) : (
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
						)}
						<span>{statsUpdating ? "Updating..." : "Refresh Stats"}</span>
					</button>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
						<div className="flex items-center">
							<div className="p-2 bg-blue-600 rounded-lg">
								<svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-400">Total Users</p>
								<p className="text-2xl font-semibold text-white">{stats.totalUsers || 0}</p>
							</div>
						</div>
					</div>

					<div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
						<div className="flex items-center">
							<div className="p-2 bg-green-600 rounded-lg">
								<svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-400">Verified Users</p>
								<p className="text-2xl font-semibold text-white">{stats.verifiedUsers || 0}</p>
							</div>
						</div>
					</div>

					<div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
						<div className="flex items-center">
							<div className="p-2 bg-green-500 rounded-lg">
								<svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-400">Online Users</p>
								<p className="text-2xl font-semibold text-white">{stats.onlineUsers || 0}</p>
							</div>
						</div>
					</div>

					<div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
						<div className="flex items-center">
							<div className="p-2 bg-purple-600 rounded-lg">
								<svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-400">Verification Rate</p>
								<p className="text-2xl font-semibold text-white">{stats.verificationRate || 0}%</p>
							</div>
						</div>
					</div>
				</div>

				{/* Login Statistics Section */}
				<div className="mb-8">
					<h3 className="text-xl font-semibold text-white mb-4">Login Statistics</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
						<div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
							<div className="flex items-center">
								<div className="p-2 bg-blue-500 rounded-lg">
									<svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-400">Last 24 Hours</p>
									<p className="text-2xl font-semibold text-white">{stats.loginStats?.recentLogins24h || 0}</p>
								</div>
							</div>
						</div>

						<div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
							<div className="flex items-center">
								<div className="p-2 bg-green-500 rounded-lg">
									<svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-400">Last 7 Days</p>
									<p className="text-2xl font-semibold text-white">{stats.loginStats?.recentLogins7d || 0}</p>
								</div>
							</div>
						</div>

						<div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
							<div className="flex items-center">
								<div className="p-2 bg-yellow-500 rounded-lg">
									<svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-400">Never Logged In</p>
									<p className="text-2xl font-semibold text-white">{stats.loginStats?.neverLoggedIn || 0}</p>
								</div>
							</div>
						</div>

						<div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
							<div className="flex items-center">
								<div className="p-2 bg-purple-500 rounded-lg">
									<svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
									</svg>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-400">Avg Logins/User</p>
									<p className="text-2xl font-semibold text-white">{stats.loginStats?.avgLoginCount || 0}</p>
								</div>
							</div>
						</div>
					</div>

					{/* Most Active Users */}
					{stats.loginStats?.mostActiveUsers && stats.loginStats.mostActiveUsers.length > 0 && (
						<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
							<h4 className="text-lg font-semibold text-white mb-4">Most Active Users</h4>
							<div className="space-y-3">
								{stats.loginStats.mostActiveUsers.map((user, index) => (
									<div key={user._id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
										<div className="flex items-center">
											<span className="text-lg font-bold text-yellow-400 mr-3">#{index + 1}</span>
											<div>
												<p className="text-white font-medium">{user.fullName}</p>
												<p className="text-gray-400 text-sm">@{user.username}</p>
											</div>
										</div>
										<div className="text-right">
											<p className="text-white font-semibold">{user.loginCount} logins</p>
											<p className="text-gray-400 text-sm">
												Last: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* System Health Panel */}
				<div className="mb-8">
					<SystemHealthPanel />
				</div>

				{/* System Settings Panel */}
				<div className="mb-8">
					<SystemSettingsPanel />
				</div>

				{/* User Management */}
				<div className="bg-gray-800 rounded-lg border border-gray-700">
					<div className="px-6 py-4 border-b border-gray-700">
						<div className="flex justify-between items-center">
							<h2 className="text-xl font-semibold">User Management</h2>
							<div className="flex space-x-2">
								{selectedUsers.length > 0 && (
									<button
										onClick={handleDeleteMultipleUsers}
										className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium"
									>
										Delete Selected ({selectedUsers.length})
									</button>
								)}
							</div>
						</div>
					</div>

					<div className="p-6">
						{/* Search and Filters */}
						<div className="mb-4 space-y-3">
							<input
								type="text"
								placeholder="Search users by name, username, or email..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
							/>
							<div className="flex items-center space-x-4">
								<label className="flex items-center space-x-2 text-sm text-gray-300">
									<input
										type="checkbox"
										checked={showOnlyOnline}
										onChange={(e) => setShowOnlyOnline(e.target.checked)}
										className="rounded border-gray-600 text-green-600 focus:ring-green-500"
									/>
									<span>Show only online users</span>
								</label>
								{showOnlyOnline && (
									<span className="text-xs text-green-400">
										({filteredUsers.length} online users)
									</span>
								)}
							</div>
						</div>

						{/* Users Table */}
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-700">
								<thead className="bg-gray-700">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
											<input
												type="checkbox"
												checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
												onChange={toggleSelectAll}
												className="rounded border-gray-600 text-red-600 focus:ring-red-500"
											/>
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
											User
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
											Email
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
											Status
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
											Online
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
											Joined
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
											Login Info
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="bg-gray-800 divide-y divide-gray-700">
									{loading ? (
										<tr>
											<td colSpan="8" className="px-6 py-4 text-center text-gray-400">
												Loading users...
											</td>
										</tr>
									) : filteredUsers.length === 0 ? (
										<tr>
											<td colSpan="8" className="px-6 py-4 text-center text-gray-400">
												{showOnlyOnline ? "No online users found" : "No users found"}
											</td>
										</tr>
									) : (
										filteredUsers.map((user) => (
											<tr key={user._id} className="hover:bg-gray-700">
												<td className="px-6 py-4 whitespace-nowrap">
													<input
														type="checkbox"
														checked={selectedUsers.includes(user._id)}
														onChange={() => toggleUserSelection(user._id)}
														className="rounded border-gray-600 text-red-600 focus:ring-red-500"
													/>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex items-center">
														<img
															className="h-10 w-10 rounded-full"
															src={user.profilePic || "/default-avatar.png"}
															alt=""
														/>
														<div className="ml-4">
															<div className="text-sm font-medium text-white">
																{user.fullName}
															</div>
															<div className="text-sm text-gray-400">
																@{user.username}
															</div>
														</div>
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
													{user.email}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
														user.verified 
															? "bg-green-900 text-green-200" 
															: "bg-yellow-900 text-yellow-200"
													}`}>
														{user.verified ? "Verified" : "Unverified"}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex items-center">
														<div className={`w-2 h-2 rounded-full mr-2 ${
															isUserOnline(user._id) 
																? 'bg-green-500 animate-pulse' 
																: 'bg-gray-500'
														}`}></div>
														<span className={`text-xs font-medium ${
															isUserOnline(user._id) 
																? 'text-green-400' 
																: 'text-gray-400'
														}`}>
															{isUserOnline(user._id) ? 'Online' : 'Offline'}
														</span>
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
													{new Date(user.createdAt).toLocaleDateString()}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
													<div>
														<div className="font-medium">
															{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
														</div>
														<div className="text-xs text-gray-500">
															{user.loginCount || 0} logins
														</div>
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
													<button
														onClick={() => handleDeleteUser(user._id)}
														className="text-red-400 hover:text-red-300"
													>
														Delete
													</button>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="mt-4 flex justify-between items-center">
								<button
									onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
									disabled={currentPage === 1}
									className="px-4 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Previous
								</button>
								<span className="text-gray-300">
									Page {currentPage} of {totalPages}
								</span>
								<button
									onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
									disabled={currentPage === totalPages}
									className="px-4 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Next
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Secure Delete Modal */}
			<SecureDeleteModal
				isOpen={showSecureDelete}
				onClose={() => setShowSecureDelete(false)}
				selectedUsers={selectedUsers}
				onDeleteSuccess={handleDeleteSuccess}
			/>
		</div>
	);
};

export default AdminDashboard; 