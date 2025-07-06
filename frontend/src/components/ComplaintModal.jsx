import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { FaTimes, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";

const ComplaintModal = ({ isOpen, onClose, pageSubmitted }) => {
	const { authUser } = useAuthContext();
	const [formData, setFormData] = useState({
		subject: "",
		message: "",
		category: "general",
		priority: "medium",
		name: "",
		email: ""
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const categories = [
		{ value: "bug", label: "Bug Report" },
		{ value: "feature_request", label: "Feature Request" },
		{ value: "account_issue", label: "Account Issue" },
		{ value: "technical_support", label: "Technical Support" },
		{ value: "general", label: "General Inquiry" },
		{ value: "other", label: "Other" }
	];

	const priorities = [
		{ value: "low", label: "Low", color: "text-green-500" },
		{ value: "medium", label: "Medium", color: "text-yellow-500" },
		{ value: "high", label: "High", color: "text-orange-500" },
		{ value: "urgent", label: "Urgent", color: "text-red-500" }
	];

	const handleInputChange = (field, value) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
		if (error) setError("");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const complaintData = {
				subject: formData.subject.trim(),
				message: formData.message.trim(),
				category: formData.category,
				priority: formData.priority
			};

			// Add name and email for anonymous users
			if (!authUser) {
				complaintData.name = formData.name.trim();
				complaintData.email = formData.email.trim();
			}

			const res = await fetch("/api/complaints/submit", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				credentials: "include",
				body: JSON.stringify(complaintData)
			});

			const data = await res.json();

			if (data.error) {
				setError(data.error);
				return;
			}

			setSuccess(true);
			setFormData({
				subject: "",
				message: "",
				category: "general",
				priority: "medium",
				name: "",
				email: ""
			});

			// Close modal after 2 seconds
			setTimeout(() => {
				setSuccess(false);
				onClose();
			}, 2000);
		} catch (error) {
			setError("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-700">
					<h2 className="text-xl font-semibold text-white">Submit Complaint</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors"
					>
						<FaTimes className="h-5 w-5" />
					</button>
				</div>

				{/* Success Message */}
				{success && (
					<div className="p-4 bg-green-900 border border-green-700 text-green-200 rounded-lg mx-6 mt-4 flex items-center">
						<FaCheckCircle className="h-5 w-5 mr-2" />
						Complaint submitted successfully!
					</div>
				)}

				{/* Error Message */}
				{error && (
					<div className="p-4 bg-red-900 border border-red-700 text-red-200 rounded-lg mx-6 mt-4 flex items-center">
						<FaExclamationTriangle className="h-5 w-5 mr-2" />
						{error}
					</div>
				)}

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					{/* Anonymous user fields */}
					{!authUser && (
						<>
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Name *
								</label>
								<input
									type="text"
									required
									className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
									placeholder="Your name"
									value={formData.name}
									onChange={(e) => handleInputChange("name", e.target.value)}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Email *
								</label>
								<input
									type="email"
									required
									className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
									placeholder="your@email.com"
									value={formData.email}
									onChange={(e) => handleInputChange("email", e.target.value)}
								/>
							</div>
						</>
					)}

					{/* Subject */}
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Subject *
						</label>
						<input
							type="text"
							required
							maxLength={200}
							className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
							placeholder="Brief description of your issue"
							value={formData.subject}
							onChange={(e) => handleInputChange("subject", e.target.value)}
						/>
						<p className="text-xs text-gray-400 mt-1">
							{formData.subject.length}/200 characters
						</p>
					</div>

					{/* Category and Priority */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Category
							</label>
							<select
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
								value={formData.category}
								onChange={(e) => handleInputChange("category", e.target.value)}
							>
								{categories.map(cat => (
									<option key={cat.value} value={cat.value}>
										{cat.label}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Priority
							</label>
							<select
								className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
								value={formData.priority}
								onChange={(e) => handleInputChange("priority", e.target.value)}
							>
								{priorities.map(pri => (
									<option key={pri.value} value={pri.value}>
										{pri.label}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Message */}
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Message *
						</label>
						<textarea
							required
							maxLength={2000}
							rows={4}
							className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
							placeholder="Please provide detailed information about your issue..."
							value={formData.message}
							onChange={(e) => handleInputChange("message", e.target.value)}
						/>
						<p className="text-xs text-gray-400 mt-1">
							{formData.message.length}/2000 characters
						</p>
					</div>

					{/* Submit Button */}
					<div className="flex space-x-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
						>
							{loading ? "Submitting..." : "Submit Complaint"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ComplaintModal; 