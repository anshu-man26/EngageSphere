import { useState, useEffect } from "react";
import { FaEnvelope, FaUsers, FaPaperPlane, FaTimes, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "react-hot-toast";

const BroadcastMessagePanel = ({ onClose, onMessageSent }) => {
	const [message, setMessage] = useState("");
	const [subject, setSubject] = useState("");
	const [messageStyle, setMessageStyle] = useState("normal"); // "normal", "serious", "friendly", "urgent", "informative"
	const [recipients, setRecipients] = useState("all"); // "all", "verified", "unverified", "selected"
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [preview, setPreview] = useState(false);
	const [errors, setErrors] = useState({});

	// Fetch users for selection
	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			const res = await fetch("/api/admin/users?limit=1000", {
				credentials: "include",
			});
			const data = await res.json();
			if (data.error) {
				toast.error(data.error);
				return;
			}
			setUsers(data.users || []);
		} catch (error) {
			console.error("Error fetching users:", error);
			toast.error("Failed to fetch users");
		}
	};

	const validateForm = () => {
		const newErrors = {};

		if (!subject.trim()) {
			newErrors.subject = "Subject is required";
		} else if (subject.trim().length > 100) {
			newErrors.subject = "Subject must be 100 characters or less";
		}

		if (!message.trim()) {
			newErrors.message = "Message is required";
		} else if (message.trim().length > 2000) {
			newErrors.message = "Message must be 2000 characters or less";
		}

		if (recipients === "selected" && selectedUsers.length === 0) {
			newErrors.recipients = "Please select at least one user";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const getRecipientCount = () => {
		switch (recipients) {
			case "all":
				return users.length;
			case "verified":
				return users.filter(user => user.verified).length;
			case "unverified":
				return users.filter(user => !user.verified).length;
			case "selected":
				return selectedUsers.length;
			default:
				return 0;
		}
	};

	const getRecipientEmails = () => {
		switch (recipients) {
			case "all":
				return users.map(user => user.email);
			case "verified":
				return users.filter(user => user.verified).map(user => user.email);
			case "unverified":
				return users.filter(user => !user.verified).map(user => user.email);
			case "selected":
				return users.filter(user => selectedUsers.includes(user._id)).map(user => user.email);
			default:
				return [];
		}
	};

	const handleSendBroadcast = async () => {
		if (!validateForm()) return;

		setSending(true);
		try {
			const res = await fetch("/api/admin/broadcast-message", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					subject: subject.trim(),
					message: message.trim(),
					messageStyle,
					recipients,
					selectedUserIds: recipients === "selected" ? selectedUsers : [],
				}),
			});

			const data = await res.json();
			if (data.error) {
				toast.error(data.error);
				return;
			}

			toast.success(`Broadcast message queued for sending to ${data.totalUsers} users!`);
			
			// Notify parent to refresh history
			if (onMessageSent) {
				onMessageSent();
			}
			
			onClose();
		} catch (error) {
			console.error("Error sending broadcast:", error);
			toast.error("Failed to send broadcast message");
		} finally {
			setSending(false);
		}
	};

	const toggleUserSelection = (userId) => {
		setSelectedUsers(prev => 
			prev.includes(userId) 
				? prev.filter(id => id !== userId)
				: [...prev, userId]
		);
	};

	const toggleSelectAll = () => {
		if (selectedUsers.length === users.length) {
			setSelectedUsers([]);
		} else {
			setSelectedUsers(users.map(user => user._id));
		}
	};

	const filteredUsers = users.filter(user => {
		if (recipients === "verified") return user.verified;
		if (recipients === "unverified") return !user.verified;
		return true;
	});

	return (
		<div 
			className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div 
				className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
							<FaEnvelope className="w-5 h-5 text-white" />
						</div>
						<div>
							<h2 className="text-xl font-semibold text-white">Broadcast Message</h2>
							<p className="text-gray-400 text-sm">Send a message to multiple users via email</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
					>
						<FaTimes size={20} />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6 overscroll-contain">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Message Form */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold text-white">Message Details</h3>
							
							{/* Subject */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Subject *
								</label>
								<input
									type="text"
									value={subject}
									onChange={(e) => setSubject(e.target.value)}
									className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
										errors.subject ? 'border-red-500' : 'border-gray-600'
									}`}
									placeholder="Enter message subject..."
									maxLength={100}
								/>
								{errors.subject && (
									<p className="text-red-400 text-sm mt-1">{errors.subject}</p>
								)}
								<p className="text-gray-400 text-xs mt-1">{subject.length}/100 characters</p>
							</div>

							{/* Message Style */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Message Style
								</label>
								<div className="grid grid-cols-2 gap-2">
									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-2 ${
										messageStyle === "normal" 
											? "bg-blue-600 border-blue-500 text-white" 
											: "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
									}`}>
										<input
											type="radio"
											name="messageStyle"
											value="normal"
											checked={messageStyle === "normal"}
											onChange={(e) => setMessageStyle(e.target.value)}
											className="text-blue-500 focus:ring-blue-500"
										/>
										<div className="flex-1">
											<div className="font-medium">Normal</div>
											<div className="text-xs opacity-75">Standard communication</div>
										</div>
									</label>

									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-2 ${
										messageStyle === "friendly" 
											? "bg-green-600 border-green-500 text-white" 
											: "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
									}`}>
										<input
											type="radio"
											name="messageStyle"
											value="friendly"
											checked={messageStyle === "friendly"}
											onChange={(e) => setMessageStyle(e.target.value)}
											className="text-green-500 focus:ring-green-500"
										/>
										<div className="flex-1">
											<div className="font-medium">Friendly</div>
											<div className="text-xs opacity-75">Casual & welcoming</div>
										</div>
									</label>

									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-2 ${
										messageStyle === "serious" 
											? "bg-red-600 border-red-500 text-white" 
											: "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
									}`}>
										<input
											type="radio"
											name="messageStyle"
											value="serious"
											checked={messageStyle === "serious"}
											onChange={(e) => setMessageStyle(e.target.value)}
											className="text-red-500 focus:ring-red-500"
										/>
										<div className="flex-1">
											<div className="font-medium">Serious</div>
											<div className="text-xs opacity-75">Important & formal</div>
										</div>
									</label>

									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-2 ${
										messageStyle === "urgent" 
											? "bg-orange-600 border-orange-500 text-white" 
											: "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
									}`}>
										<input
											type="radio"
											name="messageStyle"
											value="urgent"
											checked={messageStyle === "urgent"}
											onChange={(e) => setMessageStyle(e.target.value)}
											className="text-orange-500 focus:ring-orange-500"
										/>
										<div className="flex-1">
											<div className="font-medium">Urgent</div>
											<div className="text-xs opacity-75">Time-sensitive matters</div>
										</div>
									</label>

									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-2 ${
										messageStyle === "informative" 
											? "bg-purple-600 border-purple-500 text-white" 
											: "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
									}`}>
										<input
											type="radio"
											name="messageStyle"
											value="informative"
											checked={messageStyle === "informative"}
											onChange={(e) => setMessageStyle(e.target.value)}
											className="text-purple-500 focus:ring-purple-500"
										/>
										<div className="flex-1">
											<div className="font-medium">Informative</div>
											<div className="text-xs opacity-75">Updates & announcements</div>
										</div>
									</label>
								</div>
							</div>

							{/* Message */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Message *
								</label>
								<textarea
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									rows={8}
									className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
										errors.message ? 'border-red-500' : 'border-gray-600'
									}`}
									placeholder="Enter your message here..."
									maxLength={2000}
								/>
								{errors.message && (
									<p className="text-red-400 text-sm mt-1">{errors.message}</p>
								)}
								<p className="text-gray-400 text-xs mt-1">{message.length}/2000 characters</p>
							</div>

							{/* Recipients Selection */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Recipients *
								</label>
								<div className="space-y-2">
									<label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
										<input
											type="radio"
											name="recipients"
											value="all"
											checked={recipients === "all"}
											onChange={(e) => setRecipients(e.target.value)}
											className="text-blue-500 focus:ring-blue-500"
										/>
										<div className="flex-1">
											<div className="font-medium text-white">All Users</div>
											<div className="text-sm text-gray-400">{users.length} users</div>
										</div>
									</label>

									<label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
										<input
											type="radio"
											name="recipients"
											value="verified"
											checked={recipients === "verified"}
											onChange={(e) => setRecipients(e.target.value)}
											className="text-blue-500 focus:ring-blue-500"
										/>
										<div className="flex-1">
											<div className="font-medium text-white">Verified Users Only</div>
											<div className="text-sm text-gray-400">{users.filter(u => u.verified).length} users</div>
										</div>
									</label>

									<label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
										<input
											type="radio"
											name="recipients"
											value="unverified"
											checked={recipients === "unverified"}
											onChange={(e) => setRecipients(e.target.value)}
											className="text-blue-500 focus:ring-blue-500"
										/>
										<div className="flex-1">
											<div className="font-medium text-white">Unverified Users Only</div>
											<div className="text-sm text-gray-400">{users.filter(u => !u.verified).length} users</div>
										</div>
									</label>

									<label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
										<input
											type="radio"
											name="recipients"
											value="selected"
											checked={recipients === "selected"}
											onChange={(e) => setRecipients(e.target.value)}
											className="text-blue-500 focus:ring-blue-500"
										/>
										<div className="flex-1">
											<div className="font-medium text-white">Selected Users</div>
											<div className="text-sm text-gray-400">{selectedUsers.length} users selected</div>
										</div>
									</label>
								</div>
								{errors.recipients && (
									<p className="text-red-400 text-sm mt-1">{errors.recipients}</p>
								)}
							</div>

							{/* Preview Button */}
							<button
								onClick={() => setPreview(!preview)}
								className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
							>
								<FaExclamationTriangle className="w-4 h-4" />
								{preview ? "Hide Preview" : "Show Preview"}
							</button>
						</div>

						{/* User Selection / Preview */}
						<div className="space-y-4">
							{preview ? (
								<div className="space-y-4">
									<h3 className="text-lg font-semibold text-white">Message Preview</h3>
									<div className="bg-gray-700 rounded-lg p-4 space-y-3">
										<div>
											<label className="text-sm font-medium text-gray-400">To:</label>
											<p className="text-white">{getRecipientCount()} users</p>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-400">Style:</label>
											<div className="flex items-center gap-2 mt-1">
												<span className={`px-2 py-1 text-xs rounded-full font-medium ${
													messageStyle === "normal" ? "bg-blue-900 text-blue-200" :
													messageStyle === "friendly" ? "bg-green-900 text-green-200" :
													messageStyle === "serious" ? "bg-red-900 text-red-200" :
													messageStyle === "urgent" ? "bg-orange-900 text-orange-200" :
													"bg-purple-900 text-purple-200"
												}`}>
													{messageStyle.charAt(0).toUpperCase() + messageStyle.slice(1)}
												</span>
												<span className="text-gray-400 text-xs">
													{messageStyle === "normal" ? "Standard communication" :
													 messageStyle === "friendly" ? "Casual & welcoming" :
													 messageStyle === "serious" ? "Important & formal" :
													 messageStyle === "urgent" ? "Time-sensitive matters" :
													 "Updates & announcements"}
												</span>
											</div>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-400">Subject:</label>
											<p className="text-white">{subject || "No subject"}</p>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-400">Message:</label>
											<div className={`text-white whitespace-pre-wrap p-3 rounded mt-1 ${
												messageStyle === "normal" ? "bg-blue-900/20 border border-blue-700/30" :
												messageStyle === "friendly" ? "bg-green-900/20 border border-green-700/30" :
												messageStyle === "serious" ? "bg-red-900/20 border border-red-700/30" :
												messageStyle === "urgent" ? "bg-orange-900/20 border border-orange-700/30" :
												"bg-purple-900/20 border border-purple-700/30"
											}`}>
												{message || "No message content"}
											</div>
										</div>
										<div className="pt-2 border-t border-gray-600">
											<p className="text-sm text-gray-400">
												This message will be sent to: {getRecipientEmails().slice(0, 3).join(", ")}
												{getRecipientEmails().length > 3 && ` and ${getRecipientEmails().length - 3} more...`}
											</p>
										</div>
									</div>
								</div>
							) : recipients === "selected" ? (
								<>
									<div className="flex items-center justify-between">
										<h3 className="text-lg font-semibold text-white">Select Users</h3>
										<button
											onClick={toggleSelectAll}
											className="text-sm text-blue-400 hover:text-blue-300"
										>
											{selectedUsers.length === filteredUsers.length ? "Deselect All" : "Select All"}
										</button>
									</div>
									
									<div 
										className="max-h-96 overflow-y-auto space-y-2 overscroll-contain" 
										onWheel={(e) => e.stopPropagation()}
										style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}
									>
										{filteredUsers.map(user => (
											<label key={user._id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
												<input
													type="checkbox"
													checked={selectedUsers.includes(user._id)}
													onChange={() => toggleUserSelection(user._id)}
													className="text-blue-500 focus:ring-blue-500"
												/>
												<div className="flex-1">
													<div className="font-medium text-white">{user.fullName}</div>
													<div className="text-sm text-gray-400">{user.email}</div>
												</div>
												<span className={`px-2 py-1 text-xs rounded-full ${
													user.verified 
														? "bg-green-900 text-green-200" 
														: "bg-yellow-900 text-yellow-200"
												}`}>
													{user.verified ? "Verified" : "Unverified"}
												</span>
											</label>
										))}
									</div>
								</>
							) : (
								<div className="flex items-center justify-center h-full">
									<div className="text-center text-gray-400">
										<FaUsers className="w-12 h-12 mx-auto mb-4 opacity-50" />
										<p>Select "Selected Users" to choose specific recipients, or click "Show Preview" to see message details</p>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between p-6 border-t border-gray-700 flex-shrink-0">
					<div className="text-sm text-gray-400">
						{getRecipientCount()} users will receive this message
					</div>
					<div className="flex gap-3">
						<button
							onClick={onClose}
							className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleSendBroadcast}
							disabled={sending || getRecipientCount() === 0}
							className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						>
							{sending ? (
								<>
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									Sending...
								</>
							) : (
								<>
									<FaPaperPlane className="w-4 h-4" />
									Send Broadcast
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default BroadcastMessagePanel; 