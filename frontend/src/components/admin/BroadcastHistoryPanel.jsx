import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaEye, FaTrash, FaClock, FaUser, FaCheckCircle, FaExclamationTriangle, FaMinusCircle, FaRedo, FaSync, FaEdit, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { useSocketContext } from '../../context/SocketContext';
import { toast } from 'react-hot-toast';

const BroadcastHistoryPanel = ({ onNewBroadcast }) => {
	const { socket } = useSocketContext();
	const [broadcasts, setBroadcasts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [selectedBroadcast, setSelectedBroadcast] = useState(null);
	const [showDetails, setShowDetails] = useState(false);
	const [editingBroadcast, setEditingBroadcast] = useState(null);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [resending, setResending] = useState(null); // Track which broadcast is being resent
	const [refreshing, setRefreshing] = useState(false);
	const [deleting, setDeleting] = useState(null); // Track which broadcast is being deleted

	useEffect(() => {
		fetchBroadcastHistory();
	}, [currentPage]);

	// Auto-refresh pending broadcasts every 5 seconds
	useEffect(() => {
		const hasPendingBroadcasts = broadcasts.some(broadcast => broadcast.status === 'pending');
		
		if (hasPendingBroadcasts) {
			const interval = setInterval(() => {
				fetchBroadcastHistory();
			}, 5000); // Refresh every 5 seconds

			return () => clearInterval(interval);
		}
	}, [broadcasts]);

	// Listen for real-time broadcast progress updates
	useEffect(() => {
		if (!socket) return;

		const handleBroadcastProgress = (data) => {
			setBroadcasts(prev => prev.map(broadcast => {
				if (broadcast._id === data.broadcastId) {
					return {
						...broadcast,
						sentCount: data.sentCount,
						// Keep status as "pending" during sending process, only change to final status when complete
						status: data.status === "sending" ? "pending" : data.status
					};
				}
				return broadcast;
			}));
		};

		socket.on("broadcastProgress", handleBroadcastProgress);

		return () => {
			socket.off("broadcastProgress", handleBroadcastProgress);
		};
	}, [socket]);

	useEffect(() => {
		const handleRefresh = () => {
			fetchBroadcastHistory();
		};

		window.addEventListener('broadcastHistoryRefresh', handleRefresh);
		return () => {
			window.removeEventListener('broadcastHistoryRefresh', handleRefresh);
		};
	}, []);

	const fetchBroadcastHistory = async () => {
		try {
			setLoading(true);
			const res = await fetch(`/api/admin/broadcast-history?page=${currentPage}&limit=10`, {
				credentials: "include",
			});

			if (res.ok) {
				const data = await res.json();
				setBroadcasts(data.broadcasts);
				setTotalPages(data.totalPages);
			} else {
				console.error("Failed to fetch broadcast history");
			}
		} catch (error) {
			console.error("Error fetching broadcast history:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleManualRefresh = async () => {
		setRefreshing(true);
		try {
			await fetchBroadcastHistory();
		} finally {
			setRefreshing(false);
		}
	};

	const handleDeleteBroadcast = async (broadcast) => {
		setDeleting(broadcast._id);
		try {
			const res = await fetch(`/api/admin/broadcast/${broadcast._id}`, {
				method: "DELETE",
				credentials: "include",
			});

			if (res.ok) {
				// Remove from local state
				setBroadcasts(prev => prev.filter(b => b._id !== broadcast._id));
				toast.success("Broadcast deleted successfully!");
			} else {
				const data = await res.json();
				toast.error(`Failed to delete broadcast: ${data.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error("Error deleting broadcast:", error);
			toast.error("Failed to delete broadcast. Please try again.");
		} finally {
			setDeleting(null);
		}
	};

	const getStyleConfig = (style) => {
		switch (style) {
			case "serious":
				return { 
					color: "text-red-400", 
					bg: "bg-red-900/20", 
					border: "border-red-500/30",
					emailConfig: {
						headerBg: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
						borderColor: "#dc2626",
						badgeText: "IMPORTANT",
						tone: "This is an important communication from EngageSphere administration."
					}
				};
			case "urgent":
				return { 
					color: "text-orange-400", 
					bg: "bg-orange-900/20", 
					border: "border-orange-500/30",
					emailConfig: {
						headerBg: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
						borderColor: "#ea580c",
						badgeText: "URGENT",
						tone: "This is an urgent communication from EngageSphere administration."
					}
				};
			case "friendly":
				return { 
					color: "text-green-400", 
					bg: "bg-green-900/20", 
					border: "border-green-500/30",
					emailConfig: {
						headerBg: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
						borderColor: "#16a34a",
						badgeText: "FRIENDLY",
						tone: "This is a friendly update from your EngageSphere team."
					}
				};
			case "informative":
				return { 
					color: "text-purple-400", 
					bg: "bg-purple-900/20", 
					border: "border-purple-500/30",
					emailConfig: {
						headerBg: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
						borderColor: "#7c3aed",
						badgeText: "UPDATE",
						tone: "This is an informative update from EngageSphere administration."
					}
				};
			default:
				return { 
					color: "text-blue-400", 
					bg: "bg-blue-900/20", 
					border: "border-blue-500/30",
					emailConfig: {
						headerBg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
						borderColor: "#667eea",
						badgeText: "NOTICE",
						tone: "This is an official communication from EngageSphere administration."
					}
				};
		}
	};

	const getStatusConfig = (status) => {
		switch (status) {
			case "pending":
				return { icon: FaClock, color: "text-blue-400", bg: "bg-blue-900/20" };
			case "sent":
				return { icon: FaCheckCircle, color: "text-green-400", bg: "bg-green-900/20" };
			case "failed":
				return { icon: FaExclamationTriangle, color: "text-red-400", bg: "bg-red-900/20" };
			case "partial":
				return { icon: FaMinusCircle, color: "text-yellow-400", bg: "bg-yellow-900/20" };
			default:
				return { icon: FaClock, color: "text-gray-400", bg: "bg-gray-900/20" };
		}
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleString();
	};

	const handleViewDetails = (broadcast) => {
		setSelectedBroadcast(broadcast);
		setShowDetails(true);
	};

	const handleCloseDetails = () => {
		setShowDetails(false);
		setSelectedBroadcast(null);
	};

	const handleEditBroadcast = (broadcast) => {
		setEditingBroadcast(broadcast);
		setShowEditModal(true);
	};

	const handleCloseEditModal = () => {
		setShowEditModal(false);
		setEditingBroadcast(null);
		setShowPreview(false);
	};

	const generateEmailPreview = (subject, message, messageStyle) => {
		const styleConfig = getStyleConfig(messageStyle);
		const emailConfig = styleConfig.emailConfig;
		
		return `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
				<div style="background: ${emailConfig.headerBg}; color: white; padding: 20px; text-align: center;">
					<h1 style="margin: 0; font-size: 24px;">EngageSphere</h1>
					<p style="margin: 10px 0 0 0; opacity: 0.9;">Official Communication</p>
					<div style="margin-top: 10px;">
						<span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
							${emailConfig.badgeText}
						</span>
					</div>
				</div>
				<div style="padding: 20px; background: #f9f9f9;">
					<h2 style="color: #333; margin-top: 0;">${subject}</h2>
					<div style="background: #fff; border-left: 4px solid ${emailConfig.borderColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
						${message.replace(/\n/g, '<br>')}
					</div>
					<p style="color: #666; font-size: 14px; margin-bottom: 20px;">
						${emailConfig.tone}
					</p>
					<p style="color: #666; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
						Best regards,<br>
						EngageSphere Team
					</p>
				</div>
			</div>
		`;
	};

	const handleResendBroadcast = async (broadcast) => {
		setResending(broadcast._id);
		try {
			const res = await fetch("/api/admin/broadcast-message", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					subject: broadcast.subject,
					message: broadcast.message,
					messageStyle: broadcast.messageStyle,
					recipients: broadcast.recipients,
					selectedUserIds: broadcast.selectedUserIds || [],
				}),
			});

			const data = await res.json();
			if (data.error) {
				toast.error(`Failed to resend broadcast: ${data.error}`);
				return;
			}

			toast.success(`Broadcast resent successfully! Queued for sending to ${data.totalUsers} users.`);
			fetchBroadcastHistory(); // Refresh the list
		} catch (error) {
			console.error("Error resending broadcast:", error);
			toast.error("Failed to resend broadcast. Please try again.");
		} finally {
			setResending(null);
		}
	};

	const getRecipientText = (recipients, totalUsers) => {
		switch (recipients) {
			case "all":
				return `All Users (${totalUsers})`;
			case "verified":
				return `Verified Users (${totalUsers})`;
			case "unverified":
				return `Unverified Users (${totalUsers})`;
			case "selected":
				return `Selected Users (${totalUsers})`;
			default:
				return `${totalUsers} Users`;
		}
	};

	return (
		<div className="bg-gray-800 rounded-lg border border-gray-700">
			<style>{`
				@keyframes shimmer {
					0% { background-position: -200% 0; }
					100% { background-position: 200% 0; }
				}
			`}</style>
			{/* Header */}
			<div className="px-6 py-4 border-b border-gray-700">
				<div className="flex justify-between items-center">
					<h2 className="text-xl font-semibold text-white">Broadcast Messages</h2>
					<div className="flex gap-2">
						<button
							onClick={handleManualRefresh}
							disabled={refreshing || loading}
							className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
							title="Refresh broadcast history"
						>
							{refreshing ? (
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							) : (
								<FaSync className="w-4 h-4" />
							)}
							Refresh
						</button>
						<button
							onClick={onNewBroadcast}
							className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
						>
							<FaEnvelope className="w-4 h-4" />
							New Broadcast
						</button>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="p-6">
				{loading ? (
					<div className="text-center py-12">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
						<p className="text-gray-400 mt-2">Loading broadcast history...</p>
					</div>
				) : broadcasts.length === 0 ? (
					<div className="text-center text-gray-400 py-12">
						<FaEnvelope className="w-16 h-16 mx-auto mb-4 text-gray-600" />
						<h3 className="text-lg font-medium text-white mb-2">No Broadcast Messages</h3>
						<p className="text-gray-400 mb-6">
							You haven't sent any broadcast messages yet. Start by creating your first broadcast.
						</p>
						<button
							onClick={onNewBroadcast}
							className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-lg text-white font-medium flex items-center gap-2 mx-auto"
						>
							<FaEnvelope className="w-5 h-5" />
							Create First Broadcast
						</button>
					</div>
				) : (
					<div className="space-y-4">
						{/* Broadcast List */}
						{broadcasts.map((broadcast) => {
							const styleConfig = getStyleConfig(broadcast.messageStyle);
							const statusConfig = getStatusConfig(broadcast.status);
							const StatusIcon = statusConfig.icon;

							return (
								<div
									key={broadcast._id}
									className={`bg-gray-700 rounded-lg border ${styleConfig.border} p-4 hover:bg-gray-650 transition-colors`}
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-2">
												<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styleConfig.bg} ${styleConfig.color}`}>
													{broadcast.messageStyle.toUpperCase()}
												</span>
												<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color} ${broadcast.status === 'pending' ? 'animate-pulse' : ''}`}>
													<StatusIcon className="w-3 h-3 mr-1" />
													{broadcast.status.toUpperCase()}
													{broadcast.status === 'pending' && (
														<div className="w-1 h-1 bg-current rounded-full ml-1 animate-ping"></div>
													)}
												</span>
											</div>
											<h3 className="text-white font-medium mb-1">{broadcast.subject}</h3>
											<p className="text-gray-400 text-sm mb-3 line-clamp-2">
												{broadcast.message}
											</p>
											
											{/* Progress Bar for Pending Broadcasts */}
											{broadcast.status === 'pending' && (
												<div className="mb-3">
													<div className="flex items-center justify-between text-xs text-gray-400 mb-1">
														<span>Sending progress</span>
														<span>{Math.round((broadcast.sentCount / broadcast.totalUsers) * 100)}%</span>
													</div>
													<div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden relative">
														<div 
															className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-700 ease-out relative"
															style={{ 
																width: `${(broadcast.sentCount / broadcast.totalUsers) * 100}%`,
																transform: 'translateZ(0)' // Force hardware acceleration
															}}
														>
															{/* Moving shimmer effect */}
															<div 
																className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
																style={{
																	animation: 'shimmer 2s infinite',
																	backgroundSize: '200% 100%',
																	backgroundPosition: 'left'
																}}
															></div>
														</div>
														{/* Animated dots */}
														<div className="absolute right-0 top-0 h-2 w-2 bg-blue-400 rounded-full animate-ping"></div>
													</div>
													<div className="flex items-center justify-between text-xs text-gray-500 mt-1">
														<span>{broadcast.sentCount} of {broadcast.totalUsers} emails sent</span>
														<span className="text-blue-400 animate-pulse">In progress...</span>
													</div>
												</div>
											)}
											
											<div className="flex items-center gap-4 text-xs text-gray-500">
												<div className="flex items-center gap-1">
													<FaUser className="w-3 h-3" />
													{getRecipientText(broadcast.recipients, broadcast.totalUsers)}
												</div>
												<div className="flex items-center gap-1">
													<FaCheckCircle className="w-3 h-3" />
													{broadcast.sentCount} sent
												</div>
												<div className="flex items-center gap-1">
													<FaClock className="w-3 h-3" />
													{formatDate(broadcast.createdAt)}
												</div>
												{broadcast.sentBy && (
													<div className="flex items-center gap-1">
														<span>by {broadcast.sentBy.username}</span>
													</div>
												)}
											</div>
										</div>
										<div className="flex gap-1.5">
											<button
												onClick={() => handleViewDetails(broadcast)}
												className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/70 text-slate-200 hover:text-white text-xs font-medium rounded-lg border border-slate-600/50 hover:border-slate-500/70 transition-all duration-200 shadow-sm hover:shadow-md"
											>
												Details
											</button>
											<button
												onClick={() => handleEditBroadcast(broadcast)}
												className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500/90 text-blue-50 hover:text-white text-xs font-medium rounded-lg border border-blue-500/60 hover:border-blue-400/80 transition-all duration-200 shadow-sm hover:shadow-md"
											>
												Edit
											</button>
											<button
												onClick={() => handleResendBroadcast(broadcast)}
												disabled={resending === broadcast._id}
												className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500/90 text-emerald-50 hover:text-white text-xs font-medium rounded-lg border border-emerald-500/60 hover:border-emerald-400/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
											>
												{resending === broadcast._id ? (
													<div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
												) : (
													"Resend"
												)}
											</button>
											<button
												onClick={() => handleDeleteBroadcast(broadcast)}
												disabled={deleting === broadcast._id}
												className="px-3 py-1.5 bg-red-600/80 hover:bg-red-500/90 text-red-50 hover:text-white text-xs font-medium rounded-lg border border-red-500/60 hover:border-red-400/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
											>
												{deleting === broadcast._id ? (
													<div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
												) : (
													"Delete"
												)}
											</button>
										</div>
									</div>
								</div>
							);
						})}

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="flex justify-between items-center mt-6">
								<button
									onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
									disabled={currentPage === 1}
									className="px-4 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
								>
									Previous
								</button>
								<span className="text-gray-300">
									Page {currentPage} of {totalPages}
								</span>
								<button
									onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
									disabled={currentPage === totalPages}
									className="px-4 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
								>
									Next
								</button>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Broadcast Details Modal */}
			{showDetails && selectedBroadcast && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
					<div className="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
						{/* Header */}
						<div className="flex items-center justify-between p-6 border-b border-gray-700">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
									<FaEnvelope className="w-5 h-5 text-white" />
								</div>
								<div>
									<h2 className="text-xl font-semibold text-white">Broadcast Details</h2>
									<p className="text-gray-400 text-sm">Message sent on {formatDate(selectedBroadcast.createdAt)}</p>
								</div>
							</div>
							<button
								onClick={handleCloseDetails}
								className="text-gray-400 hover:text-white p-2"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						{/* Content */}
						<div className="p-6 overflow-y-auto max-h-[60vh]">
							<div className="space-y-4">
								{/* Subject */}
								<div>
									<label className="text-sm font-medium text-gray-400">Subject</label>
									<p className="text-white font-medium">{selectedBroadcast.subject}</p>
								</div>

								{/* Message */}
								<div>
									<label className="text-sm font-medium text-gray-400">Message</label>
									<div className="bg-gray-700 rounded-lg p-4 mt-1">
										<p className="text-white whitespace-pre-wrap">{selectedBroadcast.message}</p>
									</div>
								</div>

								{/* Details Grid */}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-gray-400">Style</label>
										<p className="text-white">{selectedBroadcast.messageStyle}</p>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-400">Status</label>
										<p className="text-white">{selectedBroadcast.status}</p>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-400">Recipients</label>
										<p className="text-white">{getRecipientText(selectedBroadcast.recipients, selectedBroadcast.totalUsers)}</p>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-400">Sent Count</label>
										<p className="text-white">{selectedBroadcast.sentCount} / {selectedBroadcast.totalUsers}</p>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-400">Sent By</label>
										<p className="text-white">{selectedBroadcast.sentBy?.username || 'Unknown'}</p>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-400">Sent At</label>
										<p className="text-white">{formatDate(selectedBroadcast.createdAt)}</p>
									</div>
								</div>

								{/* Failed Emails */}
								{selectedBroadcast.failedEmails && selectedBroadcast.failedEmails.length > 0 && (
									<div>
										<label className="text-sm font-medium text-gray-400">Failed Emails ({selectedBroadcast.failedEmails.length})</label>
										<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mt-1">
											{selectedBroadcast.failedEmails.map((email, index) => (
												<p key={index} className="text-red-400 text-sm">{email}</p>
											))}
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Footer */}
						<div className="flex justify-between items-center p-6 border-t border-gray-700">
							<div className="flex gap-2">
								<button
									onClick={() => handleResendBroadcast(selectedBroadcast)}
									disabled={resending === selectedBroadcast._id}
									className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500/100 text-emerald-50 hover:text-white font-medium rounded-lg border border-emerald-500/60 hover:border-emerald-400/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
								>
									{resending === selectedBroadcast._id ? (
										<>
											<div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
											Resending...
										</>
									) : (
										<>
											<FaRedo className="w-4 h-4" />
											Resend Broadcast
										</>
									)}
								</button>
								<button
									onClick={() => handleDeleteBroadcast(selectedBroadcast)}
									disabled={deleting === selectedBroadcast._id}
									className="px-4 py-2 bg-red-600/90 hover:bg-red-500/100 text-red-50 hover:text-white font-medium rounded-lg border border-red-500/60 hover:border-red-400/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
								>
									{deleting === selectedBroadcast._id ? (
										<>
											<div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
											Deleting...
										</>
									) : (
										<>
											<FaTrash className="w-4 h-4" />
											Delete Broadcast
										</>
									)}
								</button>
							</div>
							<button
								onClick={handleCloseDetails}
								className="px-4 py-2 bg-slate-600/80 hover:bg-slate-500/90 text-slate-200 hover:text-white font-medium rounded-lg border border-slate-500/60 hover:border-slate-400/80 transition-all duration-200 shadow-sm hover:shadow-md"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Edit Broadcast Modal */}
			{showEditModal && editingBroadcast && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
					<div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
						{/* Header */}
						<div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
									<FaEdit className="w-5 h-5 text-white" />
								</div>
								<div>
									<h2 className="text-xl font-semibold text-white">Edit Broadcast</h2>
									<p className="text-gray-400 text-sm">Modify and resend this broadcast message</p>
								</div>
							</div>
							<button
								onClick={handleCloseEditModal}
								className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
							>
								<FaTimes size={20} />
							</button>
						</div>

						{/* Content */}
						<div className="p-6 overflow-y-auto flex-1">
							<div className="space-y-6">
								{/* Subject */}
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
									<input
										type="text"
										defaultValue={editingBroadcast.subject}
										className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										placeholder="Enter broadcast subject"
										maxLength={100}
									/>
								</div>

								{/* Message */}
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
									<textarea
										defaultValue={editingBroadcast.message}
										rows={8}
										className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
										placeholder="Enter your broadcast message"
										maxLength={2000}
									/>
								</div>

								{/* Message Style */}
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-2">Message Style</label>
									<select
										defaultValue={editingBroadcast.messageStyle}
										className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									>
										<option value="normal">Normal</option>
										<option value="serious">Serious</option>
										<option value="urgent">Urgent</option>
										<option value="friendly">Friendly</option>
										<option value="informative">Informative</option>
									</select>
								</div>

								{/* Recipients Info */}
								<div className="bg-gray-700/50 rounded-lg p-4">
									<h3 className="text-sm font-medium text-gray-300 mb-2">Recipients</h3>
									<p className="text-gray-400 text-sm">
										This broadcast was originally sent to: <span className="text-white font-medium">{getRecipientText(editingBroadcast.recipients, editingBroadcast.totalUsers)}</span>
									</p>
									<p className="text-gray-400 text-sm mt-1">
										The edited version will be sent to the same recipients.
									</p>
								</div>

								{/* Preview Section */}
								{showPreview && (
									<div className="bg-gray-700/50 rounded-lg p-4">
										<h3 className="text-sm font-medium text-gray-300 mb-4">Email Preview</h3>
										<div className="bg-white rounded-lg overflow-hidden shadow-lg">
											<div 
												dangerouslySetInnerHTML={{ 
													__html: generateEmailPreview(
														document.querySelector('input[type="text"]')?.value || editingBroadcast.subject,
														document.querySelector('textarea')?.value || editingBroadcast.message,
														document.querySelector('select')?.value || editingBroadcast.messageStyle
													)
												}} 
											/>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Footer */}
						<div className="flex justify-between items-center p-6 border-t border-gray-700 flex-shrink-0">
							<button
								onClick={() => setShowPreview(!showPreview)}
								className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
							>
								<FaEye className="w-4 h-4" />
								{showPreview ? 'Hide Preview' : 'Show Preview'}
							</button>
							<div className="flex gap-3">
								<button
									onClick={handleCloseEditModal}
									className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={() => {
										// Get form values
										const subject = document.querySelector('input[type="text"]').value.trim();
										const message = document.querySelector('textarea').value.trim();
										const messageStyle = document.querySelector('select').value;

										if (!subject || !message) {
											toast.error("Subject and message are required");
											return;
										}

										// Create new broadcast with edited content
										const editedBroadcast = {
											...editingBroadcast,
											subject,
											message,
											messageStyle
										};

										// Close modal and send the edited broadcast
										handleCloseEditModal();
										handleResendBroadcast(editedBroadcast);
									}}
									className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
								>
									<FaPaperPlane className="w-4 h-4" />
									Send Edited Broadcast
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default BroadcastHistoryPanel; 