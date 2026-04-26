import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiDelete, apiGet, apiPost } from "../config/api";

// History helpers used by BroadcastHistoryPanel.
export const fetchBroadcastHistory = (page = 1, limit = 10) =>
	apiGet(`/api/admin/broadcast-history?page=${page}&limit=${limit}`);

export const deleteBroadcast = (id) => apiDelete(`/api/admin/broadcast/${id}`);

export const sendBroadcastMessage = (payload) => apiPost("/api/admin/broadcast-message", payload);

// Used by BroadcastMessagePanel: load all users + send a broadcast.
const useBroadcast = () => {
	const [users, setUsers] = useState([]);
	const [sending, setSending] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const data = await apiGet("/api/admin/users?limit=1000");
				if (!cancelled) setUsers(data?.users || []);
			} catch (err) {
				if (!cancelled) {
					console.error("Error fetching users:", err);
					toast.error(err.message || "Failed to fetch users");
				}
			}
		})();
		return () => { cancelled = true; };
	}, []);

	const sendBroadcast = async (payload) => {
		setSending(true);
		try {
			const data = await apiPost("/api/admin/broadcast-message", payload);
			toast.success(`Broadcast message queued for sending to ${data.totalUsers} users!`);
			return { ok: true, data };
		} catch (err) {
			toast.error(err.message || "Failed to send broadcast message");
			return { ok: false };
		} finally {
			setSending(false);
		}
	};

	return { users, sending, sendBroadcast };
};

export default useBroadcast;
