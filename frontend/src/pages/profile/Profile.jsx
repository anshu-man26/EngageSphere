import { useState, useRef, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import useUpdateProfile from "../../hooks/useUpdateProfile";
import useUpdateSoundSettings from "../../hooks/useUpdateSoundSettings";
import useUploadProfilePic from "../../hooks/useUploadProfilePic";
import useChangePassword from "../../hooks/useChangePassword";
import useChangeEmail from "../../hooks/useChangeEmail";
import useRequestDeleteAccountOtp from "../../hooks/useRequestDeleteAccountOtp";
import useDeleteAccount from "../../hooks/useDeleteAccount";
import { FaUser, FaSave, FaArrowLeft, FaUpload, FaTimes, FaLock, FaEdit, FaEye, FaEyeSlash, FaShieldAlt, FaUnlock, FaTrash, FaImage, FaVolumeUp, FaVolumeMute, FaVolumeOff } from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import ChatBackgroundSelector from "../../components/chat-background/ChatBackgroundSelector";
import BackgroundImageManager from "../../components/chat-background/BackgroundImageManager";
import useChatBackground from "../../hooks/useChatBackground";

const Profile = () => {
	const { authUser, setAuthUser } = useAuthContext();
	const { loading, updateProfile } = useUpdateProfile();
	const { loading: soundSettingsLoading, updateSoundSettings } = useUpdateSoundSettings();
	const { loading: uploadLoading, uploadProfilePic } = useUploadProfilePic();
	const { loading: passwordLoading, changePassword } = useChangePassword();
	const { loading: emailLoading, otpLoading, requestEmailChangeOtp, verifyOtp } = useChangeEmail();
	const { loading: deleteOtpLoading, requestOtp: requestDeleteOtp } = useRequestDeleteAccountOtp();
	const { loading: deleteAccountLoading, deleteAccount } = useDeleteAccount();
	const fileInputRef = useRef(null);
	const { loading: bgLoading, updateChatBackground } = useChatBackground();

	const [inputs, setInputs] = useState({
		fullName: authUser?.fullName || "",
		profilePic: authUser?.profilePic || "",
		bio: authUser?.bio || "",
	});

	const [passwordInputs, setPasswordInputs] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const [emailInput, setEmailInput] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [step, setStep] = useState("form"); // 'form' or 'otp'
	const [otp, setOtp] = useState("");
	const [otpError, setOtpError] = useState("");

	const [errors, setErrors] = useState({});
	const [passwordErrors, setPasswordErrors] = useState({});
	const [emailError, setEmailError] = useState("");
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [activeTab, setActiveTab] = useState("profile"); // "profile", "password", "email", "2fa", "delete", "chat-settings"
	
	// Bio editing state
	const [isEditingBio, setIsEditingBio] = useState(false);
	
	// 2FA states
	const [twoFactorEnabled, setTwoFactorEnabled] = useState(authUser?.twoFactorEnabled || false);
	const [twoFactorStep, setTwoFactorStep] = useState("main"); // "main", "enable", "otp"
	const [twoFactorOtp, setTwoFactorOtp] = useState("");
	const [twoFactorLoading, setTwoFactorLoading] = useState(false);
	const [show2FAOTPForm, setShow2FAOTPForm] = useState(false);
	const [twoFAOTP, setTwoFAOTP] = useState("");
	const [twoFAOTPError, setTwoFAOTPError] = useState("");
	const [enable2FALoading, setEnable2FALoading] = useState(false);
	const [disable2FALoading, setDisable2FALoading] = useState(false);
	const [verify2FALoading, setVerify2FALoading] = useState(false);

	// Delete account states
	const [deleteAccountStep, setDeleteAccountStep] = useState("form"); // "form" or "otp"
	const [deletePassword, setDeletePassword] = useState("");
	const [deleteOtp, setDeleteOtp] = useState("");
	const [deletePasswordError, setDeletePasswordError] = useState("");
	const [deleteOtpError, setDeleteOtpError] = useState("");

	const [showDefaultBgSelector, setShowDefaultBgSelector] = useState(false);
	const [showBackgroundManager, setShowBackgroundManager] = useState(false);
	const [defaultChatBackground, setDefaultChatBackground] = useState(authUser?.defaultChatBackground || "");

	// Sound settings state
	const [soundSettings, setSoundSettings] = useState({
		messageSound: authUser?.soundSettings?.messageSound !== false, // Default to true
		ringtone: authUser?.soundSettings?.ringtone !== false, // Default to true
	});

	// Update sound settings when authUser changes
	useEffect(() => {
		if (authUser?.soundSettings) {
			setSoundSettings({
				messageSound: authUser.soundSettings.messageSound !== false,
				ringtone: authUser.soundSettings.ringtone !== false,
			});
		}
	}, [authUser?.soundSettings]);

	const validateForm = () => {
		const newErrors = {};

		if (!inputs.fullName.trim()) {
			newErrors.fullName = "Full name is required";
		} else if (inputs.fullName.trim().length < 2) {
			newErrors.fullName = "Full name must be at least 2 characters";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (validateForm()) {
			await updateProfile(inputs);
		}
	};

	const handlePasswordSubmit = async (e) => {
		e.preventDefault();
		if (validatePasswordForm()) {
			const success = await changePassword(passwordInputs.currentPassword, passwordInputs.newPassword);
			if (success) {
				setPasswordInputs({
					currentPassword: "",
					newPassword: "",
					confirmPassword: "",
				});
			}
		}
	};

	const handleEmailSubmit = async (e) => {
		e.preventDefault();
		if (validateEmailForm()) {
			const success = await requestEmailChangeOtp(emailInput.trim(), currentPassword);
			if (success) setStep("otp");
		}
	};

	const handleOtpSubmit = async (e) => {
		e.preventDefault();
		if (!otp || otp.length !== 6) {
			setOtpError("Please enter a valid 6-digit OTP");
			return;
		}
		setOtpError("");
		const success = await verifyOtp(otp);
		if (success) {
			setStep("form");
			setEmailInput("");
			setCurrentPassword("");
			setOtp("");
		}
	};

	const handleInputChange = (field, value) => {
		setInputs({ ...inputs, [field]: value });
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: "" }));
		}
	};

	const handleEditBio = () => {
		setIsEditingBio(true);
	};

	const handleSaveBio = async () => {
		if (inputs.bio && inputs.bio.length > 150) {
			toast.error("Bio must be 150 characters or less");
			return;
		}
		
		// Update only the bio field
		const success = await updateProfile({ 
			fullName: inputs.fullName, 
			profilePic: inputs.profilePic, 
			bio: inputs.bio 
		});
		
		if (success) {
			setIsEditingBio(false);
		}
	};

	const handleCancelBio = () => {
		// Reset bio to original value
		setInputs(prev => ({ ...prev, bio: authUser?.bio || "" }));
		setIsEditingBio(false);
	};

	const validatePasswordForm = () => {
		const newErrors = {};

		if (!passwordInputs.currentPassword) {
			newErrors.currentPassword = "Current password is required";
		}

		if (!passwordInputs.newPassword) {
			newErrors.newPassword = "New password is required";
		} else if (passwordInputs.newPassword.length < 6) {
			newErrors.newPassword = "New password must be at least 6 characters";
		}

		if (!passwordInputs.confirmPassword) {
			newErrors.confirmPassword = "Please confirm your new password";
		} else if (passwordInputs.newPassword !== passwordInputs.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		setPasswordErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handlePasswordChange = (field, value) => {
		setPasswordInputs({ ...passwordInputs, [field]: value });
		if (passwordErrors[field]) {
			setPasswordErrors(prev => ({ ...prev, [field]: "" }));
		}
	};

	const handleFileSelect = (file) => {
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error("Please select an image file");
			return;
		}

		// Validate file size (5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error("File size must be less than 5MB");
			return;
		}

		setSelectedFile(file);
		const reader = new FileReader();
		reader.onload = (e) => {
			setPreviewUrl(e.target.result);
		};
		reader.readAsDataURL(file);
	};

	const handleFileInputChange = (e) => {
		const file = e.target.files[0];
		handleFileSelect(file);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		setIsDragOver(true);
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		setIsDragOver(false);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setIsDragOver(false);
		const file = e.dataTransfer.files[0];
		handleFileSelect(file);
	};

	const handleUpload = async () => {
		if (!selectedFile) {
			toast.error("Please select a file first");
			return;
		}

		const uploadedUrl = await uploadProfilePic(selectedFile);
		if (uploadedUrl) {
			setInputs(prev => ({ ...prev, profilePic: uploadedUrl }));
			setSelectedFile(null);
			setPreviewUrl(null);
		}
	};

	// 2FA Functions
	const handleEnable2FA = async () => {
		setEnable2FALoading(true);
		try {
			const res = await fetch("/api/auth/enable-2fa", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
			});

			const data = await res.json();
			if (data.error) {
				toast.error(data.error);
				return;
			}

			toast.success("OTP sent to your email");
			setShow2FAOTPForm(true);
		} catch (error) {
			toast.error("Failed to send OTP");
		} finally {
			setEnable2FALoading(false);
		}
	};

	const handleVerifyEnable2FA = async (e) => {
		e.preventDefault();
		if (!twoFAOTP || twoFAOTP.length !== 6) {
			setTwoFAOTPError("Please enter a valid 6-digit OTP");
			return;
		}

		setVerify2FALoading(true);
		try {
			const res = await fetch("/api/auth/verify-enable-2fa", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ otp: twoFAOTP }),
			});

			const data = await res.json();
			if (data.error) {
				setTwoFAOTPError(data.error);
				return;
			}

			toast.success("2FA enabled successfully");
			setTwoFactorEnabled(true);
			setShow2FAOTPForm(false);
			setTwoFAOTP("");
			setTwoFAOTPError("");
			// Update authUser context if available
			if (authUser) {
				authUser.twoFactorEnabled = true;
			}
		} catch (error) {
			setTwoFAOTPError("Failed to enable 2FA");
		} finally {
			setVerify2FALoading(false);
		}
	};

	const handleDisable2FA = async () => {
		setDisable2FALoading(true);
		try {
			const res = await fetch("/api/auth/disable-2fa", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
			});

			const data = await res.json();
			if (data.error) {
				toast.error(data.error);
				return;
			}

			toast.success("2FA disabled successfully");
			setTwoFactorEnabled(false);
			// Update authUser context if available
			if (authUser) {
				authUser.twoFactorEnabled = false;
			}
		} catch (error) {
			toast.error("Failed to disable 2FA");
		} finally {
			setDisable2FALoading(false);
		}
	};

	const handleRemoveFile = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const displayImage = previewUrl || inputs.profilePic;

	const handleEmailChange = (value) => {
		setEmailInput(value);
		if (emailError) setEmailError("");
	};

	const validateEmailForm = () => {
		if (!emailInput.trim()) {
			setEmailError("Email is required");
			return false;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(emailInput.trim())) {
			setEmailError("Please enter a valid email address");
			return false;
		}
		setEmailError("");
		return true;
	};

	const handleDeleteAccountSubmit = async (e) => {
		e.preventDefault();
		if (!deletePassword) {
			setDeletePasswordError("Password is required");
			return;
		}
		setDeletePasswordError("");

		const result = await requestDeleteOtp(deletePassword);
		if (result.success) {
			setDeleteAccountStep("otp");
			toast.success(result.message);
		} else {
			setDeletePasswordError(result.error);
		}
	};

	const handleDeleteOtpSubmit = async (e) => {
		e.preventDefault();
		if (!deleteOtp || deleteOtp.length !== 6) {
			setDeleteOtpError("Please enter a valid 6-digit OTP");
			return;
		}
		setDeleteOtpError("");

		const result = await deleteAccount(deleteOtp);
		if (result.success) {
			toast.success("Account deleted successfully");
			// User will be redirected to login automatically by the hook
		} else {
			setDeleteOtpError(result.error);
		}
	};

	const handleDefaultBgChange = async (bg) => {
		setDefaultChatBackground(bg);
		const success = await updateChatBackground(bg);
		if (success) {
			setShowDefaultBgSelector(false);
		}
	};

	// Handle sound settings update
	const handleSoundSettingsChange = async (setting, value) => {
		try {
			const updatedSettings = { ...soundSettings, [setting]: value };
			setSoundSettings(updatedSettings);
			
			// Update only the sound settings
			const success = await updateSoundSettings(updatedSettings);
			
			if (success) {
				toast.success(`${setting === 'messageSound' ? 'Message sound' : 'Ringtone'} ${value ? 'enabled' : 'disabled'}`);
		} else {
				// Revert the change if update fails
				setSoundSettings(prev => ({ ...prev, [setting]: !value }));
			}
		} catch (error) {
			// Revert the change if update fails
			setSoundSettings(prev => ({ ...prev, [setting]: !value }));
			toast.error('Failed to update sound settings');
		}
	};

	return (
		<div className='h-screen px-2 sm:px-4 py-4 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-hidden profile-responsive'>
			<div className='w-full max-w-2xl mx-auto h-full flex flex-col'>
				{/* Header */}
				<div className='text-center mb-4 sm:mb-8'>
					<div className='inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-purple-600 rounded-full mb-3 sm:mb-4 shadow-lg'>
						<FaUser className='text-white text-lg sm:text-2xl' />
					</div>
					<h1 className='text-2xl sm:text-4xl font-bold text-white mb-2'>
						Profile Settings
					</h1>
					<p className='text-gray-300 text-xs sm:text-sm'>
						Manage your account settings
					</p>
				</div>

				{/* Tab Navigation - Responsive */}
				<div className='flex flex-wrap sm:flex-nowrap mb-0 rounded-t-2xl overflow-hidden shadow-lg mobile-tabs profile-tabs'>
					<button
						onClick={() => setActiveTab("profile")}
						className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-t-2xl transition-all duration-200 ${activeTab === "profile" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
					>
						<span className="hidden sm:inline">Profile</span>
						<span className="sm:hidden">Profile</span>
					</button>
					<button
						onClick={() => setActiveTab("password")}
						className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-t-2xl transition-all duration-200 ${activeTab === "password" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
					>
						<span className="hidden sm:inline">Password</span>
						<span className="sm:hidden">Pass</span>
					</button>
					<button
						onClick={() => setActiveTab("email")}
						className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-t-2xl transition-all duration-200 ${activeTab === "email" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
					>
						<span className="hidden sm:inline">Email</span>
						<span className="sm:hidden">Email</span>
					</button>
					<button
						onClick={() => setActiveTab("2fa")}
						className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-t-2xl transition-all duration-200 ${activeTab === "2fa" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
					>
						<span className="hidden sm:inline">2FA</span>
						<span className="sm:hidden">2FA</span>
					</button>
					<button
						onClick={() => setActiveTab("delete")}
						className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-t-2xl transition-all duration-200 ${activeTab === "delete" ? "bg-red-500/20 text-red-300" : "text-red-400 hover:text-red-300 hover:bg-red-500/5"}`}
					>
						<span className="hidden sm:inline">Delete Account</span>
						<span className="sm:hidden">Delete</span>
					</button>
					<button
						onClick={() => setActiveTab("chat-settings")}
						className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-t-2xl transition-all duration-200 ${activeTab === "chat-settings" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
					>
						<span className="hidden sm:inline">Chat Settings</span>
						<span className="sm:hidden">Chat</span>
					</button>
				</div>

				{/* Content Container */}
				<div className='bg-white/10 backdrop-blur-lg rounded-b-2xl shadow-2xl border border-white/20 p-4 sm:p-8 relative flex-1 overflow-y-auto profile-content content-area'>
					{/* Back Button - Positioned at top right of form */}
					<div className='absolute top-2 sm:top-4 right-2 sm:right-4 z-10'>
						<Link 
							to="/" 
							className='inline-flex items-center gap-1 sm:gap-2 bg-white/10 hover:bg-white/20 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30 shadow-lg backdrop-blur-sm text-xs sm:text-sm'
						>
							<FaArrowLeft className='text-xs sm:text-sm' />
							<span className="hidden sm:inline">Back to Chat</span>
							<span className="sm:hidden">Back</span>
						</Link>
					</div>

					{/* Profile Tab */}
					{activeTab === "profile" && (
						<form onSubmit={handleSubmit} className='space-y-4 sm:space-y-6 profile-form'>
							{/* Profile Picture Section */}
							<div className='space-y-3 sm:space-y-4'>
								<label className='text-sm font-medium text-gray-200'>
									Profile Picture
								</label>
								<div className='flex flex-col items-center space-y-3 sm:space-y-4'>
									{/* Image Preview */}
									<div className='relative'>
										<div className='w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden'>
											<img 
												src={displayImage || 'https://cdn0.iconfinder.com/data/icons/communication-line-10/24/account_profile_user_contact_person_avatar_placeholder-512.png'} 
												alt={`${inputs.fullName || 'User'} avatar`}
												className='w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover'
												onError={(e) => {
													e.target.src = 'https://cdn0.iconfinder.com/data/icons/communication-line-10/24/account_profile_user_contact_person_avatar_placeholder-512.png';
												}}
											/>
										</div>
										{selectedFile && (
											<div className='absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors' onClick={handleRemoveFile}>
												<FaTimes className='text-white text-xs' />
											</div>
										)}
									</div>

									{/* File Upload Area */}
									<div className='w-full'>
										<div 
											className={`border-2 border-dashed rounded-lg p-3 sm:p-4 text-center transition-colors ${
												isDragOver 
													? 'border-purple-500 bg-purple-500/10' 
													: 'border-gray-600 hover:border-gray-500'
											}`}
											onDragOver={handleDragOver}
											onDragLeave={handleDragLeave}
											onDrop={handleDrop}
										>
											<input
												ref={fileInputRef}
												type='file'
												accept='image/*'
												className='hidden'
												onChange={handleFileInputChange}
											/>
											<div className='space-y-2'>
												<FaUpload className='mx-auto text-gray-400 text-xl sm:text-2xl' />
												<p className='text-xs sm:text-sm text-gray-300'>
													{selectedFile ? selectedFile.name : 'Drag & drop an image here, or click to select'}
												</p>
												<button
													type='button'
													className='text-xs text-purple-400 hover:text-purple-300'
													onClick={() => fileInputRef.current?.click()}
												>
													Browse files
												</button>
											</div>
										</div>
										
										{/* Upload Button */}
										{selectedFile && (
											<button
												type='button'
												onClick={handleUpload}
												disabled={uploadLoading}
												className='w-full mt-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm'
											>
												{uploadLoading ? (
													<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
												) : (
													<>
														<FaUpload className='text-sm' />
														Upload Image
													</>
												)}
											</button>
										)}
									</div>
								</div>
							</div>

							{/* Full Name Field */}
							<div className='space-y-2'>
								<label className='text-sm font-medium text-gray-200'>
									Full Name
								</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaUser className='h-4 w-4 sm:h-5 sm:w-5 text-gray-400' />
									</div>
									<input
										type='text'
										placeholder='Enter your full name'
										className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
											errors.fullName ? 'border-red-500' : 'border-gray-600'
										}`}
										value={inputs.fullName}
										onChange={(e) => handleInputChange('fullName', e.target.value)}
										required
									/>
								</div>
								{errors.fullName && (
									<p className='text-red-400 text-xs mt-1'>{errors.fullName}</p>
								)}
							</div>

							{/* Bio Field */}
							<div className='space-y-2'>
								<div className='flex items-center justify-between'>
									<label className='text-sm font-medium text-gray-200'>
										Bio
									</label>
									{!isEditingBio && (
										<button
											type='button'
											onClick={handleEditBio}
											className='text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1'
										>
											<FaEdit className='text-xs' />
											Edit Bio
										</button>
									)}
								</div>
								
								{isEditingBio ? (
									<div className='space-y-2'>
										<div className='relative'>
											<textarea
												placeholder='Tell us about yourself...'
												maxLength={150}
												rows={3}
												className='w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none'
												value={inputs.bio}
												onChange={(e) => handleInputChange('bio', e.target.value)}
												autoFocus
											/>
											<div className='text-right mt-1'>
												<span className='text-xs text-gray-400'>
													{inputs.bio.length}/150
												</span>
											</div>
										</div>
										<div className='flex gap-2'>
											<button
												type='button'
												onClick={handleSaveBio}
												disabled={loading}
												className='px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm flex items-center gap-2'
											>
												{loading ? (
													<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
												) : (
													<>
														<FaSave className='text-xs' />
														Save
													</>
												)}
											</button>
											<button
												type='button'
												onClick={handleCancelBio}
												className='px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 text-sm'
											>
												Cancel
											</button>
										</div>
									</div>
								) : (
									<div className='bg-white/5 border border-gray-700 rounded-lg p-4 min-h-[60px]'>
										{inputs.bio ? (
											<p className='text-white text-sm leading-relaxed whitespace-pre-wrap'>
												{inputs.bio}
											</p>
										) : (
											<p className='text-gray-400 text-sm italic'>
												No bio added yet. Click "Edit Bio" to add one.
											</p>
										)}
									</div>
								)}
								
								<p className='text-xs text-gray-400 mt-1'>
									Share a bit about yourself (optional)
								</p>
							</div>

							{/* Current Email Display */}
							<div className='space-y-2'>
								<label className='text-sm font-medium text-gray-200'>
									Email Address
								</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaUser className='h-5 w-5 text-gray-400' />
									</div>
									<input
										type='email'
										value={authUser?.email || ''}
										className='w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed'
										disabled
									/>
								</div>
								<p className='text-xs text-gray-400 mt-1'>
									Email address cannot be changed
								</p>
							</div>

							{/* Submit Button */}
							<button 
								type='submit' 
								className='w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-2'
								disabled={emailLoading}
							>
								{emailLoading ? (
									<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
								) : (
									<>
										<FaSave className='text-lg' />
										Save Changes
									</>
								)}
							</button>
						</form>
					)}

					{/* Password Tab */}
					{activeTab === "password" && (
						<form onSubmit={handlePasswordSubmit} className='space-y-6'>
							<div className='space-y-2'>
								<label className='text-sm font-medium text-gray-200'>
									Current Password
								</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaLock className='h-5 w-5 text-gray-400' />
									</div>
									<input
										type={showPassword ? 'text' : 'password'}
										placeholder='Enter your current password'
										className={`w-full pl-10 pr-12 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
											passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-600'
										}`}
										value={passwordInputs.currentPassword}
										onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
										required
									/>
									<button
										type='button'
										className='absolute inset-y-0 right-0 pr-3 flex items-center'
										onClick={() => setShowPassword(!showPassword)}
									>
										{showPassword ? (
											<FaEyeSlash className='h-5 w-5 text-gray-400' />
										) : (
											<FaEye className='h-5 w-5 text-gray-400' />
										)}
									</button>
								</div>
								{passwordErrors.currentPassword && (
									<p className='text-red-400 text-xs mt-1'>{passwordErrors.currentPassword}</p>
								)}
							</div>

							<div className='space-y-2'>
								<label className='text-sm font-medium text-gray-200'>
									New Password
								</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaLock className='h-5 w-5 text-gray-400' />
									</div>
									<input
										type={showNewPassword ? 'text' : 'password'}
										placeholder='Enter your new password'
										className={`w-full pl-10 pr-12 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
											passwordErrors.newPassword ? 'border-red-500' : 'border-gray-600'
										}`}
										value={passwordInputs.newPassword}
										onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
										required
									/>
									<button
										type='button'
										className='absolute inset-y-0 right-0 pr-3 flex items-center'
										onClick={() => setShowNewPassword(!showNewPassword)}
									>
										{showNewPassword ? (
											<FaEyeSlash className='h-5 w-5 text-gray-400' />
										) : (
											<FaEye className='h-5 w-5 text-gray-400' />
										)}
									</button>
								</div>
								{passwordErrors.newPassword && (
									<p className='text-red-400 text-xs mt-1'>{passwordErrors.newPassword}</p>
								)}
							</div>

							<div className='space-y-2'>
								<label className='text-sm font-medium text-gray-200'>
									Confirm New Password
								</label>
								<div className='relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<FaLock className='h-5 w-5 text-gray-400' />
									</div>
									<input
										type={showConfirmPassword ? 'text' : 'password'}
										placeholder='Confirm your new password'
										className={`w-full pl-10 pr-12 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
											passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'
										}`}
										value={passwordInputs.confirmPassword}
										onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
										required
									/>
									<button
										type='button'
										className='absolute inset-y-0 right-0 pr-3 flex items-center'
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									>
										{showConfirmPassword ? (
											<FaEyeSlash className='h-5 w-5 text-gray-400' />
										) : (
											<FaEye className='h-5 w-5 text-gray-400' />
										)}
									</button>
								</div>
								{passwordErrors.confirmPassword && (
									<p className='text-red-400 text-xs mt-1'>{passwordErrors.confirmPassword}</p>
								)}
							</div>

							<button 
								type='submit' 
								className='w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-2'
								disabled={passwordLoading}
							>
								{passwordLoading ? (
									<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
								) : (
									<>
										<FaLock className='text-lg' />
										Change Password
									</>
								)}
							</button>
						</form>
					)}

					{/* Email Tab */}
					{activeTab === "email" && (
						<div className='space-y-4 sm:space-y-6 email-settings-container'>
							{step === "form" && (
								<form onSubmit={handleEmailSubmit} className='space-y-4 sm:space-y-6'>
									<div className='space-y-2'>
										<label className='text-sm font-medium text-gray-200'>
											New Email Address
										</label>
										<div className='relative'>
											<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
												<FaEdit className='h-5 w-5 text-gray-400' />
											</div>
											<input
												type='email'
												placeholder='Enter your new email address'
												className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${emailError ? 'border-red-500' : 'border-gray-600'}`}
												value={emailInput}
												onChange={(e) => handleEmailChange(e.target.value)}
												required
											/>
										</div>
										{emailError && (
											<p className='text-red-400 text-xs mt-1'>{emailError}</p>
										)}
									</div>
									<div className='space-y-2'>
										<label className='text-sm font-medium text-gray-200'>
											Current Password
										</label>
										<div className='relative'>
											<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
												<FaLock className='h-5 w-5 text-gray-400' />
											</div>
											<input
												type='password'
												placeholder='Enter your current password'
												className='w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200'
												value={currentPassword}
												onChange={(e) => setCurrentPassword(e.target.value)}
												required
											/>
										</div>
									</div>
									<div className='space-y-2'>
										<label className='text-sm font-medium text-gray-200'>
											Current Email
										</label>
										<div className='relative'>
											<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
												<FaUser className='h-5 w-5 text-gray-400' />
											</div>
											<input
												type='email'
												value={authUser?.email || ''}
												className='w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed'
												disabled
											/>
										</div>
									</div>
									<button
										type='submit'
										className='w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-2'
										disabled={emailLoading}
									>
										{emailLoading ? (
											<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
										) : (
											<>
												<FaEdit className='text-lg' />
												Send OTP
											</>
										)}
									</button>
								</form>
							)}
							{step === "otp" && (
								<form onSubmit={handleOtpSubmit} className='space-y-4 sm:space-y-6'>
									<div className='space-y-2'>
										<label className='text-sm font-medium text-gray-200'>
											Enter OTP
										</label>
										<div className='relative'>
											<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
												<FaLock className='h-5 w-5 text-gray-400' />
											</div>
											<input
												type='text'
												placeholder='Enter 6-digit OTP'
												maxLength={6}
												className='w-full pl-10 pr-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest'
												value={otp}
												onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
												required
											/>
										</div>
										{otpError && (
											<p className='text-red-400 text-xs mt-1'>{otpError}</p>
										)}
										<p className='text-xs text-gray-400 mt-1'>
											OTP sent to {emailInput}
										</p>
									</div>
									<button
										type='submit'
										className='w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-2'
										disabled={otpLoading}
									>
										{otpLoading ? (
											<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
										) : (
											<>
												<FaEdit className='text-lg' />
												Verify OTP
											</>
										)}
									</button>
								</form>
							)}
						</div>
					)}

					{/* 2FA Tab */}
					{activeTab === "2fa" && (
						<div className='space-y-6'>
							{/* Current 2FA Status */}
							<div className='bg-white/5 rounded-lg p-4 border border-white/10'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										<div className='w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center'>
											<FaLock className='text-white text-lg' />
										</div>
										<div>
											<h3 className='text-white font-medium'>Two-Factor Authentication</h3>
											<p className='text-gray-400 text-sm'>
												{authUser?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
											</p>
										</div>
									</div>
									<div className={`px-3 py-1 rounded-full text-xs font-medium ${
										authUser?.twoFactorEnabled 
											? 'bg-green-500/20 text-green-400 border border-green-500/30' 
											: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
									}`}>
										{authUser?.twoFactorEnabled ? 'Active' : 'Inactive'}
									</div>
								</div>
							</div>

							{/* 2FA Description */}
							<div className='text-center space-y-2'>
								<p className='text-gray-300 text-sm'>
									Two-factor authentication adds an extra layer of security to your account by requiring a verification code in addition to your password.
								</p>
								<p className='text-gray-400 text-xs'>
									When enabled, you'll need to enter a 6-digit OTP sent to your email every time you log in.
								</p>
							</div>

							{/* Enable/Disable 2FA */}
							{!authUser?.twoFactorEnabled ? (
								<div className='space-y-4'>
									<button
										onClick={handleEnable2FA}
										disabled={enable2FALoading}
										className='w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-2'
									>
										{enable2FALoading ? (
											<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
										) : (
											<>
												<FaLock className='text-lg' />
												Enable 2FA
											</>
										)}
									</button>
								</div>
							) : (
								<div className='space-y-4'>
									<button
										onClick={handleDisable2FA}
										disabled={disable2FALoading}
										className='w-full px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-2'
									>
										{disable2FALoading ? (
											<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
										) : (
											<>
												<FaUnlock className='text-lg' />
												Disable 2FA
											</>
										)}
									</button>
								</div>
							)}

							{/* 2FA OTP Verification Form */}
							{show2FAOTPForm && (
								<form onSubmit={handleVerifyEnable2FA} className='space-y-4'>
									<div className='space-y-2'>
										<label className='text-sm font-medium text-gray-200'>
											Enter OTP
										</label>
										<div className='relative'>
											<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
												<FaLock className='h-5 w-5 text-gray-400' />
											</div>
											<input
												type='text'
												placeholder='Enter 6-digit OTP'
												maxLength={6}
												className='w-full pl-10 pr-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest'
												value={twoFAOTP}
												onChange={(e) => setTwoFAOTP(e.target.value.replace(/\D/g, ''))}
												required
											/>
										</div>
										{twoFAOTPError && (
											<p className='text-red-400 text-xs mt-1'>{twoFAOTPError}</p>
										)}
										<p className='text-xs text-gray-400 mt-1'>
											OTP sent to {authUser?.email}
										</p>
									</div>
									<div className='flex gap-3'>
										<button
											type='submit'
											className='flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-2'
											disabled={verify2FALoading}
										>
											{verify2FALoading ? (
												<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
											) : (
												<>
													<FaLock className='text-lg' />
													Verify & Enable
												</>
											)}
										</button>
										<button
											type='button'
											onClick={() => {
												setShow2FAOTPForm(false);
												setTwoFAOTP('');
												setTwoFAOTPError('');
											}}
											className='px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2'
										>
											<FaTimes className='text-lg' />
											Cancel
										</button>
									</div>
								</form>
							)}
						</div>
					)}

					{/* Delete Account Tab */}
					{activeTab === "delete" && (
						<div className='space-y-6'>
							{/* Warning Header */}
							<div className='bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center'>
								<div className='w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4'>
									<FaTrash className='text-red-400 text-2xl' />
								</div>
								<h3 className='text-red-300 text-xl font-bold mb-2'>Delete Account</h3>
								<p className='text-red-200 text-sm mb-4'>
									This action is irreversible and will permanently delete your account and all associated data.
								</p>
								<div className='bg-red-500/20 rounded-lg p-4 border border-red-500/30'>
									<p className='text-red-200 text-sm font-medium'>
										⚠️ WARNING: This action cannot be undone!
									</p>
									<p className='text-red-300 text-xs mt-2'>
										All your conversations, messages, and profile data will be permanently deleted.
									</p>
								</div>
							</div>

							{/* Delete Account Form */}
							{deleteAccountStep === "form" && (
								<form onSubmit={handleDeleteAccountSubmit} className='space-y-6'>
									<div className='space-y-2'>
										<label className='text-sm font-medium text-gray-200'>
											Confirm Password
										</label>
										<div className='relative'>
											<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
												<FaLock className='h-5 w-5 text-gray-400' />
											</div>
											<input
												type='password'
												placeholder='Enter your current password'
												className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
													deletePasswordError ? 'border-red-500' : 'border-gray-600'
												}`}
												value={deletePassword}
												onChange={(e) => {
													setDeletePassword(e.target.value);
													if (deletePasswordError) setDeletePasswordError("");
												}}
												required
											/>
										</div>
										{deletePasswordError && (
											<p className='text-red-400 text-xs mt-1'>{deletePasswordError}</p>
										)}
										<p className='text-xs text-gray-400 mt-1'>
											Enter your password to receive a deletion OTP
										</p>
									</div>
									<button
										type='submit'
										className='w-full px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-2'
										disabled={deleteOtpLoading}
									>
										{deleteOtpLoading ? (
											<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
										) : (
											<>
												<FaTrash className='text-lg' />
												Send Deletion OTP
											</>
										)}
									</button>
								</form>
							)}

							{/* Delete Account OTP Form */}
							{deleteAccountStep === "otp" && (
								<form onSubmit={handleDeleteOtpSubmit} className='space-y-6'>
									<div className='space-y-2'>
										<label className='text-sm font-medium text-gray-200'>
											Enter Deletion OTP
										</label>
										<div className='relative'>
											<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
												<FaTrash className='h-5 w-5 text-gray-400' />
											</div>
											<input
												type='text'
												placeholder='Enter 6-digit OTP'
												maxLength={6}
												className='w-full pl-10 pr-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest'
												value={deleteOtp}
												onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
												required
											/>
										</div>
										{deleteOtpError && (
											<p className='text-red-400 text-xs mt-1'>{deleteOtpError}</p>
										)}
										<p className='text-xs text-gray-400 mt-1'>
											OTP sent to {authUser?.email}
										</p>
									</div>
									<div className='flex gap-3'>
										<button
											type='submit'
											className='flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-2'
											disabled={deleteAccountLoading}
										>
											{deleteAccountLoading ? (
												<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
											) : (
												<>
													<FaTrash className='text-lg' />
													Delete Account
												</>
											)}
										</button>
										<button
											type='button'
											onClick={() => {
												setDeleteAccountStep("form");
												setDeletePassword("");
												setDeleteOtp("");
												setDeletePasswordError("");
												setDeleteOtpError("");
											}}
											className='px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2'
										>
											<FaTimes className='text-lg' />
											Cancel
										</button>
									</div>
								</form>
							)}
						</div>
					)}

					{/* Chat Settings Tab */}
					{activeTab === "chat-settings" && (
						<div className="space-y-4 sm:space-y-6 chat-settings-container">
							<h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Chat Settings</h2>
							
							{/* Sound Settings Section */}
							<div className="bg-white/5 rounded-lg p-4 sm:p-6 border border-white/10 chat-settings-section">
								<h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
									<FaVolumeUp className="text-purple-400 text-sm sm:text-base" />
									Sound Settings
								</h3>
								
								<div className="space-y-3 sm:space-y-4">
									{/* Message Sound Toggle */}
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10 gap-3 sm:gap-0 min-h-[60px] sm:min-h-[70px]">
										<div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
											<div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
												{soundSettings.messageSound ? (
													<FaVolumeUp className="text-purple-400 text-sm sm:text-lg" />
												) : (
													<FaVolumeMute className="text-gray-400 text-sm sm:text-lg" />
												)}
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="text-white font-medium text-sm sm:text-base">Message Sound</h4>
												<p className="text-gray-400 text-xs sm:text-sm truncate chat-settings-text">
													{soundSettings.messageSound 
														? "Play sound when receiving new messages" 
														: "No sound for new messages"
													}
												</p>
											</div>
										</div>
										<button
											onClick={() => handleSoundSettingsChange('messageSound', !soundSettings.messageSound)}
											disabled={soundSettingsLoading}
											className={`relative inline-flex h-5 w-10 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 flex-shrink-0 toggle-switch chat-settings-toggle ${
												soundSettings.messageSound ? 'bg-purple-600' : 'bg-gray-600'
											} ${soundSettingsLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
										>
											<span
												className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
													soundSettings.messageSound ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
												}`}
											/>
										</button>
									</div>

									{/* Ringtone Toggle */}
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10 gap-3 sm:gap-0 min-h-[60px] sm:min-h-[70px]">
										<div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
											<div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
												{soundSettings.ringtone ? (
													<FaVolumeUp className="text-blue-400 text-sm sm:text-lg" />
												) : (
													<FaVolumeOff className="text-gray-400 text-sm sm:text-lg" />
												)}
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="text-white font-medium text-sm sm:text-base">Video Call Ringtone</h4>
												<p className="text-gray-400 text-xs sm:text-sm truncate chat-settings-text">
													{soundSettings.ringtone 
														? "Play ringtone for incoming video calls" 
														: "No ringtone for video calls"
													}
												</p>
											</div>
										</div>
										<button
											onClick={() => handleSoundSettingsChange('ringtone', !soundSettings.ringtone)}
											disabled={soundSettingsLoading}
											className={`relative inline-flex h-5 w-10 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 flex-shrink-0 toggle-switch chat-settings-toggle ${
												soundSettings.ringtone ? 'bg-blue-600' : 'bg-gray-600'
											} ${soundSettingsLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
										>
											<span
												className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
													soundSettings.ringtone ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
												}`}
											/>
										</button>
									</div>
								</div>
							</div>

							{/* Default Chat Background Section */}
							<div className="bg-white/5 rounded-lg p-4 sm:p-6 border border-white/10 chat-settings-section min-h-[120px] sm:min-h-[140px]">
								<h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Default Chat Background</h3>
								<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
									<span className="text-gray-300 text-sm sm:text-base">Background:</span>
									<div className="flex items-center gap-2 sm:gap-4">
								<button
									onClick={() => setShowDefaultBgSelector(true)}
											className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 text-sm sm:text-base whitespace-nowrap chat-settings-button interactive-element"
								>
									Change
								</button>
								{defaultChatBackground && (
											<div className="w-12 h-6 sm:w-16 sm:h-8 rounded-lg border border-white/20 flex-shrink-0" style={{ background: defaultChatBackground.startsWith('http') ? `url(${defaultChatBackground}) center/cover` : defaultChatBackground }} />
								)}
							</div>
								</div>
							</div>
							
							{/* Background Image Manager */}
							<div className="bg-white/5 rounded-lg p-4 sm:p-6 border border-white/10 chat-settings-section min-h-[120px] sm:min-h-[140px]">
								<h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Background Image Management</h3>
								<p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 chat-settings-text text-wrap">
									Manage all your uploaded background images, preview them, and delete unused ones.
								</p>
								<button
									onClick={() => setShowBackgroundManager(true)}
									className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base chat-settings-button interactive-element"
								>
									<FaImage className="text-sm sm:text-lg" />
									<span className="hidden sm:inline">Manage Background Images</span>
									<span className="sm:hidden">Manage Images</span>
								</button>
							</div>
							
							{showDefaultBgSelector && (
								<ChatBackgroundSelector
									conversationId={null}
									currentBackground={defaultChatBackground}
									onClose={() => setShowDefaultBgSelector(false)}
									onBackgroundChange={handleDefaultBgChange}
								/>
							)}
							
							{showBackgroundManager && (
								<BackgroundImageManager
									onClose={() => setShowBackgroundManager(false)}
								/>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Profile; 