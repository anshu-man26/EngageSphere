import { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { FaEye, FaReply, FaTrash, FaFilter, FaSearch, FaExclamationTriangle, FaCheckCircle, FaClock, FaUser } from "react-icons/fa";

const ComplaintLogsPanel = () => {
	const [complaints, setComplaints] = useState([]);
	const [stats, setStats] = useState({});
	const [loading, setLoading] = useState(true);
	const [selectedComplaint, setSelectedComplaint] = useState(null);
	const [showComplaintDetail, setShowComplaintDetail] = useState(false);
	const [showResponseModal, setShowResponseModal] = useState(false);
	const [responseMessage, setResponseMessage] = useState("");
	const [submittingResponse, setSubmittingResponse] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [filters, setFilters] = useState({
		status: "",
		category: "",
		priority: "",
		search: ""
	});
	const { admin } = useAuthContext();

	useEffect(() => {
		fetchComplaints();
		fetchStats();
	}, [currentPage, filters]);

	const fetchComplaints = async () => {
		try {
			const queryParams = new URLSearchParams({
				page: currentPage,
				limit: 10,
				...filters
			});

			const res = await fetch(`/api/complaints?${queryParams}`, {
				credentials: "include"
			});

			if (!res.ok) throw new Error("Failed to fetch complaints");

			const data = await res.json();
			setComplaints(data.complaints);
			setTotalPages(data.totalPages);
		} catch (error) {
			console.error("Error fetching complaints:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchStats = async () => {
		try {
			const res = await fetch("/api/complaints/stats", {
				credentials: "include"
			});

			if (!res.ok) throw new Error("Failed to fetch stats");

			const data = await res.json();
			setStats(data);
		} catch (error) {
			console.error("Error fetching stats:", error);
		}
	};

	const handleStatusUpdate = async (complaintId, newStatus) => {
		try {
			const res = await fetch(`/api/complaints/${complaintId}/status`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ status: newStatus })
			});

			if (!res.ok) throw new Error("Failed to update status");

			// Update local state
			setComplaints(prev => prev.map(complaint => 
				complaint._id === complaintId 
					? { ...complaint, status: newStatus }
					: complaint
			));
		} catch (error) {
			console.error("Error updating status:", error);
		}
	};

	const handleRespond = async () => {
		if (!responseMessage.trim()) return;

		setSubmittingResponse(true);
		try {
			const res = await fetch(`/api/complaints/${selectedComplaint._id}/respond`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ message: responseMessage })
			});

			if (!res.ok) throw new Error("Failed to send response");

			const data = await res.json();
			
			// Update local state
			setComplaints(prev => prev.map(complaint => 
				complaint._id === selectedComplaint._id 
					? { ...complaint, ...data.complaint }
					: complaint
			));

			setShowResponseModal(false);
			setResponseMessage("");
			setSelectedComplaint(null);
		} catch (error) {
			console.error("Error sending response:", error);
		} finally {
			setSubmittingResponse(false);
		}
	};

	const handleDelete = async (complaintId) => {
		if (!confirm("Are you sure you want to delete this complaint?")) return;

		try {
			const res = await fetch(`/api/complaints/${complaintId}`, {
				method: "DELETE",
				credentials: "include"
			});

			if (!res.ok) throw new Error("Failed to delete complaint");

			setComplaints(prev => prev.filter(complaint => complaint._id !== complaintId));
		} catch (error) {
			console.error("Error deleting complaint:", error);
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "pending": return "text-yellow-500";
			case "in_progress": return "text-blue-500";
			case "resolved": return "text-green-500";
			case "closed": return "text-gray-500";
			default: return "text-gray-400";
		}
	};

	const getPriorityColor = (priority) => {
		switch (priority) {
			case "low": return "text-green-500";
			case "medium": return "text-yellow-500";
			case "high": return "text-orange-500";
			case "urgent": return "text-red-500";
			default: return "text-gray-400";
		}
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		});
	};

	if (loading) {
		return (
			<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
				<div className="flex items-center justify-center">
					<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
					<span className="ml-2 text-gray-300">Loading complaints...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-gray-800 rounded-lg border border-gray-700">
			{/* Header */}
			<div className="px-6 py-4 border-b border-gray-700">
				<div className="flex justify-between items-center">
					<h2 className="text-xl font-semibold text-white">Complaint Logs</h2>
					<div className="flex items-center space-x-4">
						{/* Refresh Button */}
						<button
							onClick={() => {
								setLoading(true);
								fetchComplaints();
								fetchStats();
							}}
							disabled={loading}
							className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2"
						>
							{loading ? (
								<svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							) : (
								<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
							)}
							<span>{loading ? "Refreshing..." : "Refresh"}</span>
						</button>
						{/* Stats */}
						<div className="flex space-x-4 text-sm">
							<div className="text-yellow-500">
								<span className="font-semibold">{stats.overview?.pending || 0}</span> Pending
							</div>
							<div className="text-blue-500">
								<span className="font-semibold">{stats.overview?.inProgress || 0}</span> In Progress
							</div>
							<div className="text-green-500">
								<span className="font-semibold">{stats.overview?.resolved || 0}</span> Resolved
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="p-6">
				{/* Filters */}
				<div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
					<div>
						<select
							value={filters.status}
							onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
							className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">All Status</option>
							<option value="pending">Pending</option>
							<option value="in_progress">In Progress</option>
							<option value="resolved">Resolved</option>
							<option value="closed">Closed</option>
						</select>
					</div>
					<div>
						<select
							value={filters.category}
							onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
							className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">All Categories</option>
							<option value="bug">Bug Report</option>
							<option value="feature_request">Feature Request</option>
							<option value="account_issue">Account Issue</option>
							<option value="technical_support">Technical Support</option>
							<option value="general">General</option>
							<option value="other">Other</option>
						</select>
					</div>
					<div>
						<select
							value={filters.priority}
							onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
							className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">All Priorities</option>
							<option value="low">Low</option>
							<option value="medium">Medium</option>
							<option value="high">High</option>
							<option value="urgent">Urgent</option>
						</select>
					</div>
					<div className="md:col-span-2">
						<div className="relative">
							<input
								type="text"
								placeholder="Search complaints..."
								value={filters.search}
								onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
								className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
						</div>
					</div>
				</div>

				{/* Complaints List */}
				<div className="space-y-4">
					{complaints.map((complaint) => (
						<div key={complaint._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
							<div className="flex justify-between items-start">
								<div className="flex-1">
									<div className="flex items-center space-x-3 mb-2">
										<h3 className="text-white font-medium">{complaint.subject}</h3>
										<span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)} bg-gray-600`}>
											{complaint.status.replace('_', ' ')}
										</span>
										<span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)} bg-gray-600`}>
											{complaint.priority}
										</span>
									</div>
									
									<div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
										<div className="flex items-center">
											<FaUser className="h-3 w-3 mr-1" />
											{complaint.userId ? complaint.userId.username : complaint.anonymousUser?.name}
										</div>
										<div className="flex items-center">
											<FaClock className="h-3 w-3 mr-1" />
											{formatDate(complaint.createdAt)}
										</div>
										<span className="capitalize">{complaint.category.replace('_', ' ')}</span>
									</div>
									
									<p className="text-gray-300 text-sm line-clamp-2">
										{complaint.message.substring(0, 150)}...
									</p>
								</div>
								
								<div className="flex space-x-2 ml-4">
									<button
										onClick={() => {
											setSelectedComplaint(complaint);
											setShowComplaintDetail(true);
										}}
										className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded transition-colors"
									>
										<FaEye className="h-4 w-4" />
									</button>
									{!complaint.adminResponse && (
										<button
											onClick={() => {
												setSelectedComplaint(complaint);
												setShowResponseModal(true);
											}}
											className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-600 rounded transition-colors"
										>
											<FaReply className="h-4 w-4" />
										</button>
									)}
									<button
										onClick={() => handleDelete(complaint._id)}
										className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-600 rounded transition-colors"
									>
										<FaTrash className="h-4 w-4" />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex justify-center mt-6">
						<div className="flex space-x-2">
							<button
								onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
								disabled={currentPage === 1}
								className="px-3 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
							>
								Previous
							</button>
							<span className="px-3 py-2 text-gray-300">
								Page {currentPage} of {totalPages}
							</span>
							<button
								onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
								disabled={currentPage === totalPages}
								className="px-3 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Complaint Detail Modal */}
			{showComplaintDetail && selectedComplaint && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<div className="flex justify-between items-start mb-4">
								<h3 className="text-xl font-semibold text-white">{selectedComplaint.subject}</h3>
								<button
									onClick={() => setShowComplaintDetail(false)}
									className="text-gray-400 hover:text-white"
								>
									×
								</button>
							</div>
							
							<div className="space-y-4">
								<div className="flex space-x-4 text-sm">
									<span className={`px-2 py-1 rounded ${getStatusColor(selectedComplaint.status)} bg-gray-700`}>
										{selectedComplaint.status.replace('_', ' ')}
									</span>
									<span className={`px-2 py-1 rounded ${getPriorityColor(selectedComplaint.priority)} bg-gray-700`}>
										{selectedComplaint.priority}
									</span>
									<span className="px-2 py-1 rounded text-gray-400 bg-gray-700">
										{selectedComplaint.category.replace('_', ' ')}
									</span>
								</div>
								
								<div className="bg-gray-700 p-4 rounded">
									<h4 className="text-white font-medium mb-2">Message:</h4>
									<p className="text-gray-300 whitespace-pre-wrap">{selectedComplaint.message}</p>
								</div>
								
								{selectedComplaint.adminResponse && (
									<div className="bg-green-900 p-4 rounded">
										<h4 className="text-green-200 font-medium mb-2">Admin Response:</h4>
										<p className="text-green-100 whitespace-pre-wrap">{selectedComplaint.adminResponse.message}</p>
										<p className="text-green-300 text-sm mt-2">
											Responded by {selectedComplaint.adminResponse.respondedBy?.username} on {formatDate(selectedComplaint.adminResponse.respondedAt)}
										</p>
									</div>
								)}
								
								<div className="text-sm text-gray-400">
									<p>Submitted: {formatDate(selectedComplaint.createdAt)}</p>
									<p>User: {selectedComplaint.userId ? selectedComplaint.userId.username : selectedComplaint.anonymousUser?.name}</p>
									{selectedComplaint.anonymousUser && (
										<p>Email: {selectedComplaint.anonymousUser.email}</p>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Response Modal */}
			{showResponseModal && selectedComplaint && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-gray-800 rounded-lg max-w-md w-full">
						<div className="p-6">
							<h3 className="text-xl font-semibold text-white mb-4">Respond to Complaint</h3>
							<textarea
								value={responseMessage}
								onChange={(e) => setResponseMessage(e.target.value)}
								placeholder="Enter your response..."
								rows={4}
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
							/>
							<div className="flex space-x-3 mt-4">
								<button
									onClick={() => {
										setShowResponseModal(false);
										setResponseMessage("");
										setSelectedComplaint(null);
									}}
									className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
								>
									Cancel
								</button>
								<button
									onClick={handleRespond}
									disabled={submittingResponse || !responseMessage.trim()}
									className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md"
								>
									{submittingResponse ? "Sending..." : "Send Response"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ComplaintLogsPanel; 