import { useState, useEffect, useRef } from "react";
import { FaUser, FaSave, FaTimes, FaUpload, FaEdit, FaEye, FaEyeSlash, FaLock, FaUnlock, FaImage, FaVolumeUp, FaVolumeMute, FaVolumeOff, FaAt, FaShieldAlt, FaTrash, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-hot-toast";

const UserManagementPanel = ({ selectedUser, onClose, onUserUpdated }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [uploadingPic, setUploadingPic] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [showSaveWarning, setShowSaveWarning] = useState(false);
	const [activeTab, setActiveTab] = useState("profile");
	const fileInputRef = useRef(null);

	const [formData, setFormData] = useState({
		fullName: "",
		username: "",
		email: "",
		gender: "",
		bio: "",
		profilePic: "",
		privacySettings: {
			emailVisible: false
		},
		soundSettings: {
			messageSound: true,
			ringtone: true
		}
	});

	const [passwordData, setPasswordData] = useState({
		newPassword: "",
		confirmPassword: ""
	});

	const [errors, setErrors] = useState({});
	const [passwordErrors, setPasswordErrors] = useState({});

	// Fetch user details when selectedUser changes
	useEffect(() => {
		if (selectedUser) {
			fetchUserDetails();
		}
	}, [selectedUser]);

	// Update form data when user data is loaded
	useEffect(() => {
		if (user) {
			setFormData({
				fullName: user.fullName || "",
				username: user.username || "",
				email: user.email || "",
				gender: user.gender || "",
				bio: user.bio || "",
				profilePic: user.profilePic || "",
				privacySettings: {
					emailVisible: user.privacySettings?.emailVisible || false
				},
				soundSettings: {
					messageSound: user.soundSettings?.messageSound !== false,
					ringtone: user.soundSettings?.ringtone !== false
				}
			});
		}
	}, [user]);

	const fetchUserDetails = async () => {
		if (!selectedUser) return;

		setLoading(true);
		try {
			const res = await fetch(`/api/admin/users/${selectedUser}`, {
				credentials: "include",
			});
			const data = await res.json();
			
			if (data.error) {
				toast.error(data.error);
				return;
			}
			
			setUser(data);
		} catch (error) {
			console.error("Error fetching user details:", error);
			toast.error("Failed to fetch user details");
		} finally {
			setLoading(false);
		}
	};

	const validateForm = () => {
		const newErrors = {};

		if (!formData.fullName.trim()) {
			newErrors.fullName = "Full name is required";
		} else if (formData.fullName.trim().length < 2) {
			newErrors.fullName = "Full name must be at least 2 characters";
		}

		if (!formData.username.trim()) {
			newErrors.username = "Username is required";
		} else if (formData.username.trim().length < 3) {
			newErrors.username = "Username must be at least 3 characters";
		} else if (formData.username.trim().length > 30) {
			newErrors.username = "Username must be 30 characters or less";
		} else {
			const usernameRegex = /^[a-zA-Z0-9_]+$/;
			if (!usernameRegex.test(formData.username.trim())) {
				newErrors.username = "Username can only contain letters, numbers, and underscores";
			}
		}

		if (!formData.email.trim()) {
			newErrors.email = "Email is required";
		} else {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(formData.email.trim())) {
				newErrors.email = "Please enter a valid email address";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const validatePasswordForm = () => {
		const newErrors = {};

		if (!passwordData.newPassword) {
			newErrors.newPassword = "New password is required";
		} else if (passwordData.newPassword.length < 6) {
			newErrors.newPassword = "Password must be at least 6 characters";
		}

		if (!passwordData.confirmPassword) {
			newErrors.confirmPassword = "Please confirm your password";
		} else if (passwordData.newPassword !== passwordData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		setPasswordErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleInputChange = (field, value) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
		
		// Clear error for this field
		if (errors[field]) {
			setErrors(prev => ({
				...prev,
				[field]: ""
			}));
		}
	};

	const handlePasswordChange = (field, value) => {
		setPasswordData(prev => ({
			...prev,
			[field]: value
		}));
		
		// Clear error for this field
		if (passwordErrors[field]) {
			setPasswordErrors(prev => ({
				...prev,
				[field]: ""
			}));
		}
	};

	const handlePrivacyChange = (setting, value) => {
		setFormData(prev => ({
			...prev,
			privacySettings: {
				...prev.privacySettings,
				[setting]: value
			}
		}));
	};

	const handleSoundChange = (setting, value) => {
		setFormData(prev => ({
			...prev,
			soundSettings: {
				...prev.soundSettings,
				[setting]: value
			}
		}));
	};

	const handleSaveProfile = async () => {
		if (!validateForm()) return;

		// Show warning modal first
		setShowSaveWarning(true);
	};

	const handleConfirmSave = async () => {
		setShowSaveWarning(false);
		setSaving(true);
		try {
			const res = await fetch(`/api/admin/users/${selectedUser}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify(formData),
			});

			const data = await res.json();

			if (data.error) {
				toast.error(data.error);
				return;
			}

			toast.success("User profile updated successfully");
			setUser(data.user);
			if (onUserUpdated) {
				onUserUpdated(data.user);
			}
		} catch (error) {
			console.error("Error updating user profile:", error);
			toast.error("Failed to update user profile");
		} finally {
			setSaving(false);
		}
	};

	const handleChangePassword = async () => {
		if (!validatePasswordForm()) return;

		setSaving(true);
		try {
			const res = await fetch(`/api/admin/users/${selectedUser}/password`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					newPassword: passwordData.newPassword
				}),
			});

			const data = await res.json();

			if (data.error) {
				toast.error(data.error);
				return;
			}

			toast.success("User password changed successfully");
			setPasswordData({ newPassword: "", confirmPassword: "" });
		} catch (error) {
			console.error("Error changing user password:", error);
			toast.error("Failed to change user password");
		} finally {
			setSaving(false);
		}
	};

	const handleFileSelect = (file) => {
		if (!file) return;

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
			return;
		}

		// Validate file size (5MB limit)
		if (file.size > 5 * 1024 * 1024) {
			toast.error('File size must be less than 5MB');
			return;
		}

		// Create preview URL
		const reader = new FileReader();
		reader.onload = (e) => {
			setFormData(prev => ({
				...prev,
				profilePic: e.target.result
			}));
		};
		reader.readAsDataURL(file);
	};

	const handleFileInputChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleUploadProfilePic = async () => {
		if (!fileInputRef.current?.files[0]) {
			toast.error("Please select a profile picture");
			return;
		}

		setUploadingPic(true);
		try {
			const formData = new FormData();
			formData.append('profilePic', fileInputRef.current.files[0]);

			const res = await fetch(`/api/admin/users/${selectedUser}/profile-pic`, {
				method: "POST",
				credentials: "include",
				body: formData,
			});

			const data = await res.json();

			if (data.error) {
				toast.error(data.error);
				return;
			}

			toast.success("Profile picture uploaded successfully");
			setFormData(prev => ({
				...prev,
				profilePic: data.profilePic
			}));
			
			// Clear file input
			fileInputRef.current.value = "";
		} catch (error) {
			console.error("Error uploading profile picture:", error);
			toast.error("Failed to upload profile picture");
		} finally {
			setUploadingPic(false);
		}
	};

	if (loading) {
		return (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-gray-800 p-6 rounded-lg">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
					<p className="text-white mt-2">Loading user details...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex justify-between items-center p-6 border-b border-gray-700">
					<div className="flex items-center space-x-3">
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-white"
						>
							<FaArrowLeft size={20} />
						</button>
						<h2 className="text-xl font-bold text-white">Edit User: {user.username}</h2>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white"
					>
						<FaTimes size={20} />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-gray-700">
					<button
						onClick={() => setActiveTab("profile")}
						className={`px-6 py-3 text-sm font-medium ${
							activeTab === "profile"
								? "text-blue-400 border-b-2 border-blue-400"
								: "text-gray-400 hover:text-white"
						}`}
					>
						<FaUser className="inline mr-2" />
						Profile
					</button>
					<button
						onClick={() => setActiveTab("password")}
						className={`px-6 py-3 text-sm font-medium ${
							activeTab === "password"
								? "text-blue-400 border-b-2 border-blue-400"
								: "text-gray-400 hover:text-white"
						}`}
					>
						<FaLock className="inline mr-2" />
						Password
					</button>
					<button
						onClick={() => setActiveTab("settings")}
						className={`px-6 py-3 text-sm font-medium ${
							activeTab === "settings"
								? "text-blue-400 border-b-2 border-blue-400"
								: "text-gray-400 hover:text-white"
						}`}
					>
						<FaShieldAlt className="inline mr-2" />
						Settings
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					{activeTab === "profile" && (
						<div className="space-y-6">
							{/* Profile Picture */}
							<div className="flex items-center space-x-6">
								<div className="relative">
									<img
										src={formData.profilePic || "/public/default-avatar.png"}
										alt="Profile"
										className="w-24 h-24 rounded-full object-cover border-2 border-gray-600"
									/>
									<button
										onClick={() => fileInputRef.current?.click()}
										className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"
									>
										<FaUpload size={12} />
									</button>
								</div>
								<div className="flex-1">
									<input
										ref={fileInputRef}
										type="file"
										accept="image/*"
										onChange={handleFileInputChange}
										className="hidden"
									/>
									<button
										onClick={handleUploadProfilePic}
										disabled={uploadingPic || !fileInputRef.current?.files[0]}
										className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-md text-sm font-medium"
									>
										{uploadingPic ? "Uploading..." : "Upload Picture"}
									</button>
								</div>
							</div>

							{/* Basic Info */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Full Name
									</label>
									<input
										type="text"
										value={formData.fullName}
										onChange={(e) => handleInputChange("fullName", e.target.value)}
										className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white ${
											errors.fullName ? "border-red-500" : "border-gray-600"
										}`}
									/>
									{errors.fullName && (
										<p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
									)}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Username
									</label>
									<input
										type="text"
										value={formData.username}
										onChange={(e) => handleInputChange("username", e.target.value)}
										className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white ${
											errors.username ? "border-red-500" : "border-gray-600"
										}`}
									/>
									{errors.username && (
										<p className="text-red-500 text-sm mt-1">{errors.username}</p>
									)}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Email
									</label>
									<input
										type="email"
										value={formData.email}
										onChange={(e) => handleInputChange("email", e.target.value)}
										className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white ${
											errors.email ? "border-red-500" : "border-gray-600"
										}`}
									/>
									{errors.email && (
										<p className="text-red-500 text-sm mt-1">{errors.email}</p>
									)}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Gender
									</label>
									<select
										value={formData.gender}
										onChange={(e) => handleInputChange("gender", e.target.value)}
										className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
									>
										<option value="">Select Gender</option>
										<option value="male">Male</option>
										<option value="female">Female</option>
										<option value="other">Other</option>
									</select>
								</div>
							</div>

							{/* Bio */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Bio
								</label>
								<textarea
									value={formData.bio}
									onChange={(e) => handleInputChange("bio", e.target.value)}
									rows={3}
									className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white resize-none"
									placeholder="Tell us about yourself..."
								/>
							</div>

							{/* Save Button */}
							<div className="flex justify-end">
								<button
									onClick={handleSaveProfile}
									disabled={saving}
									className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
								>
									<FaSave size={14} />
									<span>{saving ? "Saving..." : "Save Changes"}</span>
								</button>
							</div>
						</div>
					)}

					{activeTab === "password" && (
						<div className="space-y-6">
							<div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-4">
								<p className="text-yellow-200 text-sm">
									⚠️ Warning: You are about to change this user's password. This action cannot be undone.
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										New Password
									</label>
									<div className="relative">
										<input
											type={showNewPassword ? "text" : "password"}
											value={passwordData.newPassword}
											onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
											className={`w-full px-3 py-2 pr-10 bg-gray-700 border rounded-md text-white ${
												passwordErrors.newPassword ? "border-red-500" : "border-gray-600"
											}`}
										/>
										<button
											type="button"
											onClick={() => setShowNewPassword(!showNewPassword)}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
										>
											{showNewPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
										</button>
									</div>
									{passwordErrors.newPassword && (
										<p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>
									)}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Confirm Password
									</label>
									<div className="relative">
										<input
											type={showConfirmPassword ? "text" : "password"}
											value={passwordData.confirmPassword}
											onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
											className={`w-full px-3 py-2 pr-10 bg-gray-700 border rounded-md text-white ${
												passwordErrors.confirmPassword ? "border-red-500" : "border-gray-600"
											}`}
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
										>
											{showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
										</button>
									</div>
									{passwordErrors.confirmPassword && (
										<p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
									)}
								</div>
							</div>

							<div className="flex justify-end">
								<button
									onClick={handleChangePassword}
									disabled={saving}
									className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
								>
									<FaLock size={14} />
									<span>{saving ? "Changing..." : "Change Password"}</span>
								</button>
							</div>
						</div>
					)}

					{activeTab === "settings" && (
						<div className="space-y-6">
							{/* Privacy Settings */}
							<div>
								<h3 className="text-lg font-medium text-white mb-4">Privacy Settings</h3>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div>
											<label className="text-sm font-medium text-gray-300">Email Visibility</label>
											<p className="text-xs text-gray-400">Allow other users to see your email address</p>
										</div>
										<button
											onClick={() => handlePrivacyChange("emailVisible", !formData.privacySettings.emailVisible)}
											className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
												formData.privacySettings.emailVisible ? "bg-blue-600" : "bg-gray-600"
											}`}
										>
											<span
												className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
													formData.privacySettings.emailVisible ? "translate-x-6" : "translate-x-1"
												}`}
											/>
										</button>
									</div>
								</div>
							</div>

							{/* Sound Settings */}
							<div>
								<h3 className="text-lg font-medium text-white mb-4">Sound Settings</h3>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div>
											<label className="text-sm font-medium text-gray-300">Message Sound</label>
											<p className="text-xs text-gray-400">Play sound when receiving new messages</p>
										</div>
										<button
											onClick={() => handleSoundChange("messageSound", !formData.soundSettings.messageSound)}
											className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
												formData.soundSettings.messageSound ? "bg-blue-600" : "bg-gray-600"
											}`}
										>
											<span
												className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
													formData.soundSettings.messageSound ? "translate-x-6" : "translate-x-1"
												}`}
											/>
										</button>
									</div>

									<div className="flex items-center justify-between">
										<div>
											<label className="text-sm font-medium text-gray-300">Ringtone</label>
											<p className="text-xs text-gray-400">Play ringtone for incoming calls</p>
										</div>
										<button
											onClick={() => handleSoundChange("ringtone", !formData.soundSettings.ringtone)}
											className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
												formData.soundSettings.ringtone ? "bg-blue-600" : "bg-gray-600"
											}`}
										>
											<span
												className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
													formData.soundSettings.ringtone ? "translate-x-6" : "translate-x-1"
												}`}
											/>
										</button>
									</div>
								</div>
							</div>

							<div className="flex justify-end">
								<button
									onClick={handleSaveProfile}
									disabled={saving}
									className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
								>
									<FaSave size={14} />
									<span>{saving ? "Saving..." : "Save Settings"}</span>
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Save Warning Modal */}
			{showSaveWarning && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
						<div className="flex items-center space-x-3 mb-4">
							<div className="bg-yellow-600 p-2 rounded-full">
								<FaShieldAlt className="text-white" size={20} />
							</div>
							<h3 className="text-lg font-bold text-white">Confirm Changes</h3>
						</div>
						<p className="text-gray-300 mb-6">
							You are about to save changes to this user's profile. This action will update their information immediately. Are you sure you want to proceed?
						</p>
						<div className="flex justify-end space-x-3">
							<button
								onClick={() => setShowSaveWarning(false)}
								className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium"
							>
								Cancel
							</button>
							<button
								onClick={handleConfirmSave}
								disabled={saving}
								className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-md text-sm font-medium flex items-center space-x-2"
							>
								<FaSave size={14} />
								<span>{saving ? "Saving..." : "Save Changes"}</span>
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default UserManagementPanel; 