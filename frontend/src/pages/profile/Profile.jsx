import { useState, useRef, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import useUpdateProfile from "../../hooks/useUpdateProfile";
import useUpdateSoundSettings from "../../hooks/useUpdateSoundSettings";
import usePrivacySettings from "../../hooks/usePrivacySettings";
import useUploadProfilePic from "../../hooks/useUploadProfilePic";
import useChangePassword from "../../hooks/useChangePassword";
import useChangeEmail from "../../hooks/useChangeEmail";
import useChangeUsername from "../../hooks/useChangeUsername";
import useRequestDeleteAccountOtp from "../../hooks/useRequestDeleteAccountOtp";
import useDeleteAccount from "../../hooks/useDeleteAccount";
import useLogout from "../../hooks/useLogout";
import {
	FaUser,
	FaArrowLeft,
	FaUpload,
	FaTimes,
	FaLock,
	FaEdit,
	FaEye,
	FaEyeSlash,
	FaShieldAlt,
	FaTrash,
	FaImage,
	FaVolumeUp,
	FaAt,
	FaSignOutAlt,
	FaEnvelope,
	FaCheckCircle,
	FaBell,
	FaUserShield,
	FaPalette,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import ChatBackgroundSelector from "../../components/chat-background/ChatBackgroundSelector";
import BackgroundImageManager from "../../components/chat-background/BackgroundImageManager";
import useDefaultChatBackground from "../../hooks/useDefaultChatBackground";
import { enable2FA, verifyEnable2FA, disable2FA } from "../../hooks/use2FA";
import Avatar from "../../components/Avatar";

// ─── Reusable bits ──────────────────────────────────────────────
const inputBase =
	"w-full px-4 py-2.5 bg-[#2A3942] border border-[#374248] rounded-lg text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/40 transition-colors text-sm";

const inputWithIcon = `${inputBase} pl-10`;

const primaryBtn =
	"inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-900/30";

const ghostBtn =
	"inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#202C33] hover:bg-[#2A3942] text-[#E9EDEF] text-sm font-medium rounded-lg transition-colors";

const dangerBtn =
	"inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const Switch = ({ checked, onChange, disabled }) => (
	<button
		type='button'
		onClick={() => !disabled && onChange(!checked)}
		disabled={disabled}
		className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
			checked ? "bg-emerald-500" : "bg-[#2A3942]"
		}`}
	>
		<span
			className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
				checked ? "translate-x-5" : "translate-x-0.5"
			}`}
		/>
	</button>
);

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
	<div className='mb-6'>
		<div className='flex items-center gap-3 mb-1'>
			<div className='w-9 h-9 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center text-emerald-400'>
				<Icon className='text-sm' />
			</div>
			<h2 className='text-lg font-semibold text-[#E9EDEF]'>{title}</h2>
		</div>
		{subtitle && <p className='text-sm text-[#8696A0] ml-12'>{subtitle}</p>}
	</div>
);

const FieldLabel = ({ children }) => (
	<label className='block text-xs font-medium text-[#8696A0] uppercase tracking-wider mb-1.5'>{children}</label>
);

const ErrorText = ({ children }) => children ? <p className='text-red-400 text-xs mt-1'>{children}</p> : null;

const TABS = [
	{ id: "profile", label: "Profile", icon: FaUser },
	{ id: "password", label: "Password", icon: FaLock },
	{ id: "email", label: "Email", icon: FaEnvelope },
	{ id: "2fa", label: "Two-factor", icon: FaShieldAlt },
	{ id: "privacy", label: "Privacy", icon: FaUserShield },
	{ id: "notifications", label: "Notifications", icon: FaBell },
	{ id: "chat-settings", label: "Chat", icon: FaPalette },
	{ id: "delete", label: "Delete account", icon: FaTrash, danger: true },
];

const Profile = () => {
	const { authUser, setAuthUser } = useAuthContext();
	const { loading, updateProfile } = useUpdateProfile();
	const { loading: soundSettingsLoading, updateSoundSettings } = useUpdateSoundSettings();
	const { loading: privacyLoading, updateEmailVisibility } = usePrivacySettings();
	const { loading: uploadLoading, uploadProfilePic } = useUploadProfilePic();
	const { loading: passwordLoading, changePassword } = useChangePassword();
	const { loading: emailLoading, otpLoading, requestEmailChangeOtp, verifyOtp } = useChangeEmail();
	const { loading: usernameLoading, changeUsername } = useChangeUsername();
	const { loading: deleteOtpLoading, requestOtp: requestDeleteOtp } = useRequestDeleteAccountOtp();
	const { loading: deleteAccountLoading, deleteAccount } = useDeleteAccount();
	const { loading: logoutLoading, logout } = useLogout();
	const fileInputRef = useRef(null);
	const { loading: bgLoading, updateDefaultChatBackground } = useDefaultChatBackground();

	const [inputs, setInputs] = useState({
		fullName: authUser?.fullName || "",
		profilePic: authUser?.profilePic || "",
		bio: authUser?.bio || "",
	});

	const [usernameInput, setUsernameInput] = useState(authUser?.username || "");
	const [usernameError, setUsernameError] = useState("");
	const [usernameModified, setUsernameModified] = useState(false);

	const [passwordInputs, setPasswordInputs] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const [emailInput, setEmailInput] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [step, setStep] = useState("form");
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
	const [activeTab, setActiveTab] = useState("profile");
	const [isEditingBio, setIsEditingBio] = useState(false);
	const [isEditingUsername, setIsEditingUsername] = useState(false);

	const [twoFactorEnabled, setTwoFactorEnabled] = useState(authUser?.twoFactorEnabled || false);
	const [show2FAOTPForm, setShow2FAOTPForm] = useState(false);
	const [twoFAOTP, setTwoFAOTP] = useState("");
	const [twoFAOTPError, setTwoFAOTPError] = useState("");
	const [enable2FALoading, setEnable2FALoading] = useState(false);
	const [disable2FALoading, setDisable2FALoading] = useState(false);
	const [verify2FALoading, setVerify2FALoading] = useState(false);

	const [deleteAccountStep, setDeleteAccountStep] = useState("form");
	const [deletePassword, setDeletePassword] = useState("");
	const [deleteOtp, setDeleteOtp] = useState("");
	const [deletePasswordError, setDeletePasswordError] = useState("");
	const [deleteOtpError, setDeleteOtpError] = useState("");

	const [showDefaultBgSelector, setShowDefaultBgSelector] = useState(false);
	const [showBackgroundManager, setShowBackgroundManager] = useState(false);
	const [defaultChatBackground, setDefaultChatBackground] = useState(authUser?.defaultChatBackground || "");

	const [soundSettings, setSoundSettings] = useState({
		messageSound: authUser?.soundSettings?.messageSound !== false,
		ringtone: authUser?.soundSettings?.ringtone !== false,
	});

	const [privacySettings, setPrivacySettings] = useState({
		emailVisible: authUser?.privacySettings?.emailVisible || false,
	});

	const [messageSoundLoading, setMessageSoundLoading] = useState(false);
	const [ringtoneLoading, setRingtoneLoading] = useState(false);

	useEffect(() => {
		if (authUser?.soundSettings) {
			setSoundSettings({
				messageSound: authUser.soundSettings.messageSound !== false,
				ringtone: authUser.soundSettings.ringtone !== false,
			});
		}
	}, [authUser?.soundSettings]);

	useEffect(() => {
		if (authUser?.privacySettings) {
			setPrivacySettings({
				emailVisible: authUser.privacySettings.emailVisible || false,
			});
		}
	}, [authUser?.privacySettings]);

	useEffect(() => {
		if (authUser?.username) {
			setUsernameInput(authUser.username);
			setUsernameModified(false);
		}
	}, [authUser?.username]);

	// ── Validation ─────────────────────────────────────────────
	const validateForm = () => {
		const newErrors = {};
		if (!inputs.fullName.trim()) newErrors.fullName = "Full name is required";
		else if (inputs.fullName.trim().length < 2) newErrors.fullName = "Full name must be at least 2 characters";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const validateUsername = () => {
		if (!usernameInput.trim()) {
			setUsernameError("Username is required");
			return false;
		}
		if (usernameInput.trim().length < 3) {
			setUsernameError("Username must be at least 3 characters");
			return false;
		}
		if (usernameInput.trim().length > 30) {
			setUsernameError("Username must be 30 characters or less");
			return false;
		}
		const usernameRegex = /^[a-zA-Z0-9_]+$/;
		if (!usernameRegex.test(usernameInput.trim())) {
			setUsernameError("Only letters, numbers, and underscores allowed");
			return false;
		}
		setUsernameError("");
		return true;
	};

	const validatePasswordForm = () => {
		const newErrors = {};
		if (!passwordInputs.currentPassword) newErrors.currentPassword = "Current password is required";
		if (!passwordInputs.newPassword) newErrors.newPassword = "New password is required";
		else if (passwordInputs.newPassword.length < 6) newErrors.newPassword = "Must be at least 6 characters";
		if (!passwordInputs.confirmPassword) newErrors.confirmPassword = "Please confirm your new password";
		else if (passwordInputs.newPassword !== passwordInputs.confirmPassword)
			newErrors.confirmPassword = "Passwords do not match";
		setPasswordErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const validateEmailForm = () => {
		if (!emailInput.trim()) {
			setEmailError("Email is required");
			return false;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
			setEmailError("Please enter a valid email address");
			return false;
		}
		setEmailError("");
		return true;
	};

	// ── Handlers ───────────────────────────────────────────────
	const handleUsernameChange = (value) => {
		setUsernameInput(value);
		setUsernameModified(value !== authUser?.username);
		if (usernameError) setUsernameError("");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (validateForm()) await updateProfile(inputs);
	};

	const handlePasswordSubmit = async (e) => {
		e.preventDefault();
		if (validatePasswordForm()) {
			const success = await changePassword(passwordInputs.currentPassword, passwordInputs.newPassword);
			if (success) setPasswordInputs({ currentPassword: "", newPassword: "", confirmPassword: "" });
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
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
	};

	const handleSaveBio = async () => {
		if (inputs.bio && inputs.bio.length > 150) {
			toast.error("Bio must be 150 characters or less");
			return;
		}
		const success = await updateProfile({
			fullName: inputs.fullName,
			profilePic: inputs.profilePic,
			bio: inputs.bio,
		});
		if (success) setIsEditingBio(false);
	};

	const handleCancelBio = () => {
		setInputs((prev) => ({ ...prev, bio: authUser?.bio || "" }));
		setIsEditingBio(false);
	};

	const handleSaveUsername = async () => {
		if (validateUsername()) {
			const success = await changeUsername(usernameInput.trim());
			if (success) {
				setIsEditingUsername(false);
				setUsernameModified(false);
			}
		}
	};

	const handleCancelUsername = () => {
		setUsernameInput(authUser?.username || "");
		setUsernameError("");
		setUsernameModified(false);
		setIsEditingUsername(false);
	};

	const handlePasswordChange = (field, value) => {
		setPasswordInputs({ ...passwordInputs, [field]: value });
		if (passwordErrors[field]) setPasswordErrors((prev) => ({ ...prev, [field]: "" }));
	};

	const handleFileSelect = (file) => {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			toast.error("File size must be less than 5MB");
			return;
		}
		setSelectedFile(file);
		const reader = new FileReader();
		reader.onload = (e) => setPreviewUrl(e.target.result);
		reader.readAsDataURL(file);
	};

	const handleFileInputChange = (e) => handleFileSelect(e.target.files[0]);
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
		handleFileSelect(e.dataTransfer.files[0]);
	};

	const handleUpload = async () => {
		if (!selectedFile) {
			toast.error("Please select a file first");
			return;
		}
		const uploadedUrl = await uploadProfilePic(selectedFile);
		if (uploadedUrl) {
			setInputs((prev) => ({ ...prev, profilePic: uploadedUrl }));
			setSelectedFile(null);
			setPreviewUrl(null);
		}
	};

	const handleRemoveFile = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const displayImage = previewUrl || inputs.profilePic;

	// 2FA
	const handleEnable2FA = async () => {
		setEnable2FALoading(true);
		try {
			await enable2FA();
			toast.success("OTP sent to your email");
			setShow2FAOTPForm(true);
		} catch (error) {
			toast.error(error.message || "Failed to send OTP");
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
			await verifyEnable2FA(twoFAOTP);
			toast.success("2FA enabled successfully");
			setTwoFactorEnabled(true);
			setShow2FAOTPForm(false);
			setTwoFAOTP("");
			setTwoFAOTPError("");
			if (authUser) authUser.twoFactorEnabled = true;
		} catch (error) {
			setTwoFAOTPError(error.message || "Failed to enable 2FA");
		} finally {
			setVerify2FALoading(false);
		}
	};

	const handleDisable2FA = async () => {
		setDisable2FALoading(true);
		try {
			await disable2FA();
			toast.success("2FA disabled successfully");
			setTwoFactorEnabled(false);
			if (authUser) authUser.twoFactorEnabled = false;
		} catch (error) {
			toast.error(error.message || "Failed to disable 2FA");
		} finally {
			setDisable2FALoading(false);
		}
	};

	const handleEmailChange = (value) => {
		setEmailInput(value);
		if (emailError) setEmailError("");
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
		if (result.success) toast.success("Account deleted successfully");
		else setDeleteOtpError(result.error);
	};

	const handleDefaultBgChange = async (bg) => {
		setDefaultChatBackground(bg);
		const success = await updateDefaultChatBackground(bg);
		if (success) setShowDefaultBgSelector(false);
	};

	const handleSoundSettingsChange = async (setting, value) => {
		try {
			if (setting === "messageSound") setMessageSoundLoading(true);
			else if (setting === "ringtone") setRingtoneLoading(true);

			const updatedSettings = { ...soundSettings, [setting]: value };
			setSoundSettings(updatedSettings);

			const success = await updateSoundSettings(updatedSettings);
			if (success) {
				toast.success(`${setting === "messageSound" ? "Message sound" : "Ringtone"} ${value ? "enabled" : "disabled"}`);
			} else {
				setSoundSettings((prev) => ({ ...prev, [setting]: !value }));
			}
		} catch (error) {
			setSoundSettings((prev) => ({ ...prev, [setting]: !value }));
			toast.error("Failed to update sound settings");
		} finally {
			if (setting === "messageSound") setMessageSoundLoading(false);
			else if (setting === "ringtone") setRingtoneLoading(false);
		}
	};

	const handlePrivacySettingsChange = async (setting, value) => {
		const updatedSettings = { ...privacySettings, [setting]: value };
		setPrivacySettings(updatedSettings);
		try {
			const updatedUser = await updateEmailVisibility(value);
			if (!updatedUser) setPrivacySettings((prev) => ({ ...prev, [setting]: !value }));
			else setAuthUser(updatedUser);
		} catch (error) {
			setPrivacySettings((prev) => ({ ...prev, [setting]: !value }));
			toast.error("Failed to update privacy settings");
		}
	};

	// ─── Tab content renderers ─────────────────────────────────
	const renderProfile = () => (
		<form onSubmit={handleSubmit}>
			<SectionHeader icon={FaUser} title='Profile' subtitle='Your public profile and avatar.' />

			{/* Avatar block */}
			<div className='flex items-start gap-5 mb-7 pb-7 border-b border-[#222D34]'>
				<div className='relative'>
					<Avatar src={displayImage} size={88} bg='bg-[#202C33]' iconColor='text-[#8696A0]' className='ring-2 ring-[#374248]' />
					{previewUrl && (
						<button
							type='button'
							onClick={handleRemoveFile}
							className='absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-md'
						>
							<FaTimes />
						</button>
					)}
				</div>

				<div className='flex-1 min-w-0'>
					<p className='text-sm font-medium text-[#E9EDEF] mb-1'>Profile picture</p>
					<p className='text-xs text-[#8696A0] mb-3'>JPG, PNG or GIF. Max 5MB.</p>

					<div
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						className={`flex items-center gap-2 ${isDragOver ? "ring-2 ring-emerald-500/40 rounded-lg" : ""}`}
					>
						<input
							ref={fileInputRef}
							type='file'
							accept='image/*'
							onChange={handleFileInputChange}
							className='hidden'
						/>
						<button
							type='button'
							onClick={() => fileInputRef.current?.click()}
							className={ghostBtn}
						>
							<FaUpload className='text-xs' />
							{previewUrl ? "Change" : "Upload"}
						</button>
						{selectedFile && (
							<button
								type='button'
								onClick={handleUpload}
								disabled={uploadLoading}
								className={primaryBtn}
							>
								{uploadLoading ? "Saving…" : "Save photo"}
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Full name */}
			<div className='mb-5'>
				<FieldLabel>Full name</FieldLabel>
				<div className='relative'>
					<FaUser className='absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0] text-sm' />
					<input
						type='text'
						className={`${inputWithIcon} ${errors.fullName ? "border-red-500/60" : ""}`}
						placeholder='Your name'
						value={inputs.fullName}
						onChange={(e) => handleInputChange("fullName", e.target.value)}
					/>
				</div>
				<ErrorText>{errors.fullName}</ErrorText>
			</div>

			{/* Username */}
			<div className='mb-5'>
				<div className='flex items-center justify-between mb-1.5'>
					<FieldLabel>Username</FieldLabel>
					{!isEditingUsername && (
						<button
							type='button'
							onClick={() => setIsEditingUsername(true)}
							className='text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1'
						>
							<FaEdit className='text-[10px]' />
							Edit
						</button>
					)}
				</div>
				{isEditingUsername ? (
					<>
						<div className='relative'>
							<FaAt className='absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0] text-sm' />
							<input
								type='text'
								className={`${inputWithIcon} ${usernameError ? "border-red-500/60" : ""}`}
								placeholder='your_username'
								value={usernameInput}
								onChange={(e) => handleUsernameChange(e.target.value)}
								maxLength={30}
							/>
						</div>
						<ErrorText>{usernameError}</ErrorText>
						<div className='flex gap-2 mt-2'>
							<button
								type='button'
								onClick={handleSaveUsername}
								disabled={usernameLoading || !usernameModified}
								className={primaryBtn}
							>
								{usernameLoading ? "Saving…" : "Save username"}
							</button>
							<button type='button' onClick={handleCancelUsername} className={ghostBtn}>
								Cancel
							</button>
						</div>
					</>
				) : (
					<div className='flex items-center gap-2 px-3 py-2.5 bg-[#202C33] ring-1 ring-[#222D34] rounded-lg text-sm text-[#E9EDEF]'>
						<FaAt className='text-[#8696A0] text-xs' />
						{authUser?.username || "—"}
					</div>
				)}
			</div>

			{/* Bio */}
			<div className='mb-5'>
				<div className='flex items-center justify-between mb-1.5'>
					<FieldLabel>Bio</FieldLabel>
					{!isEditingBio && (
						<button
							type='button'
							onClick={() => setIsEditingBio(true)}
							className='text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1'
						>
							<FaEdit className='text-[10px]' />
							Edit
						</button>
					)}
				</div>
				{isEditingBio ? (
					<>
						<textarea
							className={`${inputBase} resize-none`}
							rows={3}
							maxLength={150}
							placeholder='A short bio…'
							value={inputs.bio}
							onChange={(e) => handleInputChange("bio", e.target.value)}
						/>
						<div className='flex items-center justify-between mt-1'>
							<span className='text-[11px] text-[#8696A0]'>{(inputs.bio || "").length} / 150</span>
						</div>
						<div className='flex gap-2 mt-2'>
							<button type='button' onClick={handleSaveBio} disabled={loading} className={primaryBtn}>
								{loading ? "Saving…" : "Save bio"}
							</button>
							<button type='button' onClick={handleCancelBio} className={ghostBtn}>
								Cancel
							</button>
						</div>
					</>
				) : (
					<div className='px-3 py-2.5 bg-[#202C33] ring-1 ring-[#222D34] rounded-lg text-sm text-[#D1D7DB] whitespace-pre-wrap min-h-[44px]'>
						{authUser?.bio || <span className='text-[#8696A0] italic'>No bio yet.</span>}
					</div>
				)}
			</div>

			{/* Email (read-only) */}
			<div className='mb-6'>
				<FieldLabel>Email</FieldLabel>
				<div className='flex items-center gap-2 px-3 py-2.5 bg-[#202C33] ring-1 ring-[#222D34] rounded-lg text-sm text-[#D1D7DB]'>
					<FaEnvelope className='text-[#8696A0] text-xs' />
					{authUser?.email}
					<span className='ml-auto text-[11px] text-[#8696A0]'>Manage in Email tab</span>
				</div>
			</div>

			{/* Save name */}
			<div className='flex justify-end pt-4 border-t border-[#222D34]'>
				<button type='submit' disabled={loading} className={primaryBtn}>
					{loading ? "Saving…" : "Save changes"}
				</button>
			</div>
		</form>
	);

	const renderPassword = () => (
		<form onSubmit={handlePasswordSubmit}>
			<SectionHeader icon={FaLock} title='Password' subtitle='Use at least 6 characters with a mix of letters and numbers.' />

			<div className='space-y-4 max-w-md'>
				{[
					{
						field: "currentPassword",
						label: "Current password",
						show: showPassword,
						setShow: setShowPassword,
					},
					{
						field: "newPassword",
						label: "New password",
						show: showNewPassword,
						setShow: setShowNewPassword,
					},
					{
						field: "confirmPassword",
						label: "Confirm new password",
						show: showConfirmPassword,
						setShow: setShowConfirmPassword,
					},
				].map(({ field, label, show, setShow }) => (
					<div key={field}>
						<FieldLabel>{label}</FieldLabel>
						<div className='relative'>
							<FaLock className='absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0] text-sm' />
							<input
								type={show ? "text" : "password"}
								className={`${inputWithIcon} pr-10 ${passwordErrors[field] ? "border-red-500/60" : ""}`}
								placeholder='••••••••'
								value={passwordInputs[field]}
								onChange={(e) => handlePasswordChange(field, e.target.value)}
							/>
							<button
								type='button'
								onClick={() => setShow(!show)}
								className='absolute right-3 top-1/2 -translate-y-1/2 text-[#8696A0] hover:text-[#D1D7DB]'
							>
								{show ? <FaEyeSlash className='text-sm' /> : <FaEye className='text-sm' />}
							</button>
						</div>
						<ErrorText>{passwordErrors[field]}</ErrorText>
					</div>
				))}

				<div className='pt-2'>
					<button type='submit' disabled={passwordLoading} className={primaryBtn}>
						{passwordLoading ? "Updating…" : "Update password"}
					</button>
				</div>
			</div>
		</form>
	);

	const renderEmail = () =>
		step === "form" ? (
			<form onSubmit={handleEmailSubmit}>
				<SectionHeader icon={FaEnvelope} title='Change email' subtitle={`Current: ${authUser?.email}`} />
				<div className='space-y-4 max-w-md'>
					<div>
						<FieldLabel>New email</FieldLabel>
						<div className='relative'>
							<FaEnvelope className='absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0] text-sm' />
							<input
								type='email'
								className={`${inputWithIcon} ${emailError ? "border-red-500/60" : ""}`}
								placeholder='you@example.com'
								value={emailInput}
								onChange={(e) => handleEmailChange(e.target.value)}
							/>
						</div>
						<ErrorText>{emailError}</ErrorText>
					</div>

					<div>
						<FieldLabel>Current password</FieldLabel>
						<div className='relative'>
							<FaLock className='absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0] text-sm' />
							<input
								type='password'
								className={inputWithIcon}
								placeholder='••••••••'
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
							/>
						</div>
					</div>

					<div className='pt-2'>
						<button type='submit' disabled={emailLoading} className={primaryBtn}>
							{emailLoading ? "Sending OTP…" : "Send OTP"}
						</button>
					</div>
				</div>
			</form>
		) : (
			<form onSubmit={handleOtpSubmit}>
				<SectionHeader icon={FaShieldAlt} title='Verify OTP' subtitle={`We sent a 6-digit code to ${emailInput}`} />
				<div className='space-y-4 max-w-md'>
					<div>
						<FieldLabel>OTP code</FieldLabel>
						<input
							type='text'
							maxLength={6}
							className={`${inputBase} text-center text-2xl tracking-[0.5em]`}
							placeholder='000000'
							value={otp}
							onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
						/>
						<ErrorText>{otpError}</ErrorText>
					</div>
					<div className='flex gap-2'>
						<button type='submit' disabled={otpLoading} className={primaryBtn}>
							{otpLoading ? "Verifying…" : "Confirm change"}
						</button>
						<button type='button' onClick={() => setStep("form")} className={ghostBtn}>
							Back
						</button>
					</div>
				</div>
			</form>
		);

	const render2FA = () => (
		<div>
			<SectionHeader icon={FaShieldAlt} title='Two-factor authentication' subtitle='Add an extra layer of security with email OTP.' />
			<div className='bg-[#202C33] ring-1 ring-[#222D34] rounded-xl p-5 max-w-md'>
				<div className='flex items-center justify-between mb-4'>
					<div className='flex items-center gap-3'>
						<div
							className={`w-10 h-10 rounded-lg flex items-center justify-center ${
								twoFactorEnabled ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-[#2A3942] text-[#8696A0]"
							}`}
						>
							<FaShieldAlt />
						</div>
						<div>
							<p className='text-sm font-medium text-[#E9EDEF]'>Status</p>
							<p className='text-xs text-[#8696A0]'>{twoFactorEnabled ? "Enabled" : "Disabled"}</p>
						</div>
					</div>
					<span
						className={`text-xs px-2.5 py-1 rounded-full font-medium ${
							twoFactorEnabled ? "bg-emerald-500/15 text-emerald-300" : "bg-[#2A3942] text-[#8696A0]"
						}`}
					>
						{twoFactorEnabled ? "ON" : "OFF"}
					</span>
				</div>

				{!twoFactorEnabled && !show2FAOTPForm && (
					<button onClick={handleEnable2FA} disabled={enable2FALoading} className={primaryBtn}>
						{enable2FALoading ? "Sending OTP…" : "Enable 2FA"}
					</button>
				)}

				{twoFactorEnabled && (
					<button onClick={handleDisable2FA} disabled={disable2FALoading} className={dangerBtn}>
						{disable2FALoading ? "Disabling…" : "Disable 2FA"}
					</button>
				)}

				{show2FAOTPForm && !twoFactorEnabled && (
					<form onSubmit={handleVerifyEnable2FA} className='space-y-3 mt-4 pt-4 border-t border-[#374248]'>
						<FieldLabel>Enter the OTP from your email</FieldLabel>
						<input
							type='text'
							maxLength={6}
							className={`${inputBase} text-center text-2xl tracking-[0.5em]`}
							placeholder='000000'
							value={twoFAOTP}
							onChange={(e) => setTwoFAOTP(e.target.value.replace(/\D/g, ""))}
						/>
						<ErrorText>{twoFAOTPError}</ErrorText>
						<div className='flex gap-2'>
							<button type='submit' disabled={verify2FALoading} className={primaryBtn}>
								{verify2FALoading ? "Verifying…" : "Confirm"}
							</button>
							<button
								type='button'
								onClick={() => {
									setShow2FAOTPForm(false);
									setTwoFAOTP("");
									setTwoFAOTPError("");
								}}
								className={ghostBtn}
							>
								Cancel
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);

	const renderPrivacy = () => (
		<div>
			<SectionHeader icon={FaUserShield} title='Privacy' subtitle='Control who can see what.' />
			<div className='space-y-3 max-w-xl'>
				<SettingRow
					title='Show email on profile'
					desc='Allow other users to see your email address on your public profile.'
					checked={privacySettings.emailVisible}
					onChange={(v) => handlePrivacySettingsChange("emailVisible", v)}
					disabled={privacyLoading}
				/>
			</div>
		</div>
	);

	const renderNotifications = () => (
		<div>
			<SectionHeader icon={FaBell} title='Notifications' subtitle='Manage app sounds.' />
			<div className='space-y-3 max-w-xl'>
				<SettingRow
					title='Message sound'
					desc='Play a chime when new messages arrive.'
					checked={soundSettings.messageSound}
					onChange={(v) => handleSoundSettingsChange("messageSound", v)}
					disabled={messageSoundLoading}
				/>
				<SettingRow
					title='Ringtone'
					desc='Play a ringtone for incoming voice and video calls.'
					checked={soundSettings.ringtone}
					onChange={(v) => handleSoundSettingsChange("ringtone", v)}
					disabled={ringtoneLoading}
				/>
			</div>
		</div>
	);

	const renderChatSettings = () => (
		<div>
			<SectionHeader icon={FaPalette} title='Chat appearance' subtitle='Customize your chat experience.' />
			<div className='space-y-3 max-w-xl'>
				<button
					onClick={() => setShowDefaultBgSelector(true)}
					className='w-full flex items-center justify-between p-4 bg-[#202C33] hover:bg-[#2A3942] ring-1 ring-[#222D34] rounded-xl transition-colors text-left'
				>
					<div className='flex items-center gap-3'>
						<div className='w-9 h-9 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center text-emerald-400'>
							<FaImage className='text-sm' />
						</div>
						<div>
							<p className='text-sm font-medium text-[#E9EDEF]'>Default chat background</p>
							<p className='text-xs text-[#8696A0]'>Set across all conversations</p>
						</div>
					</div>
					<span className='text-xs text-[#8696A0]'>›</span>
				</button>

				<button
					onClick={() => setShowBackgroundManager(true)}
					className='w-full flex items-center justify-between p-4 bg-[#202C33] hover:bg-[#2A3942] ring-1 ring-[#222D34] rounded-xl transition-colors text-left'
				>
					<div className='flex items-center gap-3'>
						<div className='w-9 h-9 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center text-emerald-400'>
							<FaUpload className='text-sm' />
						</div>
						<div>
							<p className='text-sm font-medium text-[#E9EDEF]'>Manage background images</p>
							<p className='text-xs text-[#8696A0]'>Upload, delete, and organize</p>
						</div>
					</div>
					<span className='text-xs text-[#8696A0]'>›</span>
				</button>
			</div>
		</div>
	);

	const renderDelete = () =>
		deleteAccountStep === "form" ? (
			<form onSubmit={handleDeleteAccountSubmit}>
				<SectionHeader icon={FaTrash} title='Delete account' subtitle='This permanently removes your account and data.' />
				<div className='bg-red-500/5 ring-1 ring-red-500/20 rounded-xl p-5 max-w-md space-y-4'>
					<div className='flex items-start gap-3'>
						<FaTrash className='text-red-400 mt-0.5 flex-shrink-0' />
						<p className='text-sm text-[#D1D7DB]'>
							All messages, conversations, and settings will be deleted. <span className='text-red-300 font-medium'>This cannot be undone.</span>
						</p>
					</div>
					<div>
						<FieldLabel>Confirm with your password</FieldLabel>
						<div className='relative'>
							<FaLock className='absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0] text-sm' />
							<input
								type='password'
								className={`${inputWithIcon} ${deletePasswordError ? "border-red-500/60" : ""}`}
								placeholder='••••••••'
								value={deletePassword}
								onChange={(e) => setDeletePassword(e.target.value)}
							/>
						</div>
						<ErrorText>{deletePasswordError}</ErrorText>
					</div>
					<button type='submit' disabled={deleteOtpLoading} className={dangerBtn}>
						{deleteOtpLoading ? "Sending OTP…" : "Continue"}
					</button>
				</div>
			</form>
		) : (
			<form onSubmit={handleDeleteOtpSubmit}>
				<SectionHeader icon={FaTrash} title='Confirm deletion' subtitle='Enter the OTP sent to your email to permanently delete your account.' />
				<div className='bg-red-500/5 ring-1 ring-red-500/20 rounded-xl p-5 max-w-md space-y-4'>
					<div>
						<FieldLabel>OTP code</FieldLabel>
						<input
							type='text'
							maxLength={6}
							className={`${inputBase} text-center text-2xl tracking-[0.5em]`}
							placeholder='000000'
							value={deleteOtp}
							onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ""))}
						/>
						<ErrorText>{deleteOtpError}</ErrorText>
					</div>
					<div className='flex gap-2'>
						<button type='submit' disabled={deleteAccountLoading} className={dangerBtn}>
							{deleteAccountLoading ? "Deleting…" : "Delete account"}
						</button>
						<button
							type='button'
							onClick={() => {
								setDeleteAccountStep("form");
								setDeleteOtp("");
								setDeleteOtpError("");
							}}
							className={ghostBtn}
						>
							Back
						</button>
					</div>
				</div>
			</form>
		);

	const tabBody = {
		profile: renderProfile,
		password: renderPassword,
		email: renderEmail,
		"2fa": render2FA,
		privacy: renderPrivacy,
		notifications: renderNotifications,
		"chat-settings": renderChatSettings,
		delete: renderDelete,
	}[activeTab];

	return (
		<div className='min-h-screen bg-[#0B141A]'>
			{/* Top bar */}
			<div className='sticky top-0 z-10 bg-[#0B141A]/95 backdrop-blur-md border-b border-[#222D34]'>
				<div className='max-w-6xl mx-auto px-4 h-14 flex items-center justify-between'>
					<Link
						to='/'
						className='inline-flex items-center gap-2 text-[#D1D7DB] hover:text-[#E9EDEF] hover:bg-[#202C33] px-3 py-1.5 rounded-lg text-sm transition-colors'
					>
						<FaArrowLeft className='text-xs' />
						Back to chat
					</Link>
					<h1 className='text-sm font-semibold text-[#E9EDEF]'>Settings</h1>
					<div className='w-24' />
				</div>
			</div>

			<div className='max-w-6xl mx-auto px-4 py-6 lg:py-10'>
				<div className='grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 lg:gap-8'>
					{/* Sidebar nav */}
					<aside>
						{/* Mobile: horizontal scroll tabs */}
						<div className='lg:hidden -mx-4 px-4 mb-4 overflow-x-auto'>
							<div className='flex gap-1.5 min-w-max pb-1'>
								{TABS.map((t) => {
									const Icon = t.icon;
									const active = activeTab === t.id;
									return (
										<button
											key={t.id}
											onClick={() => setActiveTab(t.id)}
											className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
												active
													? t.danger
														? "bg-red-500/15 text-red-300 ring-1 ring-red-500/30"
														: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
													: "bg-[#111B21] text-[#8696A0] hover:text-[#E9EDEF] ring-1 ring-[#222D34]"
											}`}
										>
											<Icon className='text-[10px]' />
											{t.label}
										</button>
									);
								})}
								<button
									onClick={logout}
									disabled={logoutLoading}
									className='inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap bg-[#111B21] text-[#8696A0] hover:text-[#E9EDEF] ring-1 ring-[#222D34]'
								>
									<FaSignOutAlt className='text-[10px]' />
									{logoutLoading ? "Signing out…" : "Sign out"}
								</button>
							</div>
						</div>

						{/* Desktop: vertical sidebar */}
						<nav className='hidden lg:block sticky top-20 space-y-0.5'>
							<div className='flex items-center gap-3 mb-5 px-3 py-3 bg-[#111B21] ring-1 ring-[#222D34] rounded-xl'>
								<Avatar src={authUser?.profilePic} size={40} bg='bg-[#202C33]' iconColor='text-[#8696A0]' />
								<div className='min-w-0 flex-1'>
									<p className='text-sm font-medium text-[#E9EDEF] truncate'>{authUser?.fullName}</p>
									<p className='text-xs text-[#8696A0] truncate'>@{authUser?.username}</p>
								</div>
							</div>

							{TABS.map((t) => {
								const Icon = t.icon;
								const active = activeTab === t.id;
								return (
									<button
										key={t.id}
										onClick={() => setActiveTab(t.id)}
										className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
											active
												? t.danger
													? "bg-red-500/10 text-red-300 ring-1 ring-red-500/20"
													: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20"
												: t.danger
												? "text-red-400/70 hover:text-red-300 hover:bg-[#111B21]"
												: "text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#111B21]"
										}`}
									>
										<Icon className='text-xs flex-shrink-0' />
										<span className='font-medium'>{t.label}</span>
									</button>
								);
							})}

							<div className='pt-3 mt-3 border-t border-[#222D34]'>
								<button
									onClick={logout}
									disabled={logoutLoading}
									className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#111B21] transition-colors disabled:opacity-50'
								>
									<FaSignOutAlt className='text-xs flex-shrink-0' />
									<span className='font-medium'>{logoutLoading ? "Signing out…" : "Sign out"}</span>
								</button>
							</div>
						</nav>
					</aside>

					{/* Content */}
					<main>
						<div className='bg-[#111B21] ring-1 ring-[#222D34] rounded-2xl p-6 sm:p-8'>
							{tabBody && tabBody()}
						</div>
					</main>
				</div>
			</div>

			{showDefaultBgSelector && (
				<ChatBackgroundSelector
					currentBackground={defaultChatBackground}
					onBackgroundChange={handleDefaultBgChange}
					onClose={() => setShowDefaultBgSelector(false)}
				/>
			)}
			{showBackgroundManager && <BackgroundImageManager onClose={() => setShowBackgroundManager(false)} />}
		</div>
	);
};

const SettingRow = ({ title, desc, checked, onChange, disabled }) => (
	<div className='flex items-center justify-between p-4 bg-[#202C33] ring-1 ring-[#222D34] rounded-xl'>
		<div className='min-w-0 pr-4'>
			<p className='text-sm font-medium text-[#E9EDEF]'>{title}</p>
			{desc && <p className='text-xs text-[#8696A0] mt-0.5'>{desc}</p>}
		</div>
		<Switch checked={checked} onChange={onChange} disabled={disabled} />
	</div>
);

export default Profile;
