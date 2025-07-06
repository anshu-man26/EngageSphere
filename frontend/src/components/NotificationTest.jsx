import { useState } from "react";
import useGetUsers from "../hooks/useGetUsers.js";

const NotificationTest = () => {
	const [selectedUserId, setSelectedUserId] = useState("");
	const [messagePreview, setMessagePreview] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState("");
	
	const { loading: usersLoading, users } = useGetUsers();

	const testProxyConnection = async () => {
		setLoading(true);
		setResult("");

		try {
			console.log("Testing direct connection to backend...");
			const response = await fetch("http://localhost:5000/api/notifications/ping", {
				method: "GET",
				credentials: "include",
			});

			if (response.ok) {
				const data = await response.json();
				setResult(`✅ Backend connection working! ${data.message}`);
			} else {
				const text = await response.text();
				setResult(`❌ Backend connection failed. Status: ${response.status}. Response: ${text}`);
			}
		} catch (error) {
			setResult(`❌ Network error: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	const handleTestNotification = async () => {
		if (!selectedUserId) {
			setResult("Please select a user to send test notification to");
			return;
		}

		setLoading(true);
		setResult("");

		try {
			// Check if user is authenticated by checking localStorage for chat-user
			const user = localStorage.getItem("chat-user");
			if (!user) {
				setResult("❌ Not authenticated. Please login first.");
				return;
			}

			// First, test if the backend is accessible
			console.log("Testing backend connection...");
			const pingResponse = await fetch("http://localhost:5000/api/notifications/ping", {
				method: "GET",
				credentials: "include",
			});
			
			if (!pingResponse.ok) {
				const pingText = await pingResponse.text();
				console.error("Ping failed:", pingText);
				setResult(`❌ Backend connection failed. Status: ${pingResponse.status}. Make sure backend is running on port 5000.`);
				return;
			}

			console.log("Backend connection successful, proceeding with test notification...");

			const response = await fetch("http://localhost:5000/api/notifications/test", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include", // This will send the HTTP-only JWT cookie
				body: JSON.stringify({
					recipientId: selectedUserId,
					messagePreview: messagePreview || "Test message from notification system"
				}),
			});

			// Check if response is JSON
			const contentType = response.headers.get("content-type");
			if (!contentType || !contentType.includes("application/json")) {
				const text = await response.text();
				console.error("Non-JSON response:", text);
				setResult(`❌ Server error: Received HTML instead of JSON. Status: ${response.status}`);
				return;
			}

			const data = await response.json();

			if (response.ok) {
				setResult(`✅ ${data.message}`);
			} else {
				setResult(`❌ ${data.error || 'Unknown error occurred'}`);
			}
		} catch (error) {
			console.error("Fetch error:", error);
			setResult(`❌ Error: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	if (usersLoading) {
		return <div className="p-4">Loading users...</div>;
	}

	return (
		<div className="p-6 bg-gray-800 rounded-lg max-w-md mx-auto mt-8">
			<h2 className="text-xl font-bold text-white mb-4">Test Notification System</h2>
			
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-300 mb-2">
						Select User to Send Test Notification:
					</label>
					<select
						value={selectedUserId}
						onChange={(e) => setSelectedUserId(e.target.value)}
						className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">Choose a user...</option>
						{users.map((user) => (
							<option key={user._id} value={user._id}>
								{user.fullName} ({user.username})
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-300 mb-2">
						Message Preview (optional):
					</label>
					<input
						type="text"
						value={messagePreview}
						onChange={(e) => setMessagePreview(e.target.value)}
						placeholder="Enter a test message preview..."
						className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<button
					onClick={testProxyConnection}
					disabled={loading}
					className="w-full mb-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
				>
					{loading ? "Testing..." : "Test Proxy Connection"}
				</button>

				<button
					onClick={handleTestNotification}
					disabled={loading || !selectedUserId}
					className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
				>
					{loading ? "Sending..." : "Send Test Notification"}
				</button>

				{result && (
					<div className={`p-3 rounded-md text-sm ${
						result.includes("✅") 
							? "bg-green-900 text-green-200" 
							: "bg-red-900 text-red-200"
					}`}>
						{result}
					</div>
				)}

				<div className="text-xs text-gray-400 mt-4 p-3 bg-gray-700 rounded-md">
					<p><strong>How it works:</strong></p>
					<ul className="list-disc list-inside mt-2 space-y-1">
						<li>Select a user who is currently offline</li>
						<li>Send a test notification</li>
						<li>Check their email for the notification</li>
						<li>Try sending again within 5 minutes - it won't send due to cooldown</li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default NotificationTest; 