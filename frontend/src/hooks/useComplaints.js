import { apiDelete, apiGet, apiPost, apiPut } from "../config/api";

export const fetchComplaints = (page = 1, limit = 10, filters = {}) => {
	const params = new URLSearchParams({ page: String(page), limit: String(limit), ...filters });
	return apiGet(`/api/complaints?${params}`);
};

export const fetchComplaintStats = () => apiGet("/api/complaints/stats");

export const updateComplaintStatus = (complaintId, status) =>
	apiPut(`/api/complaints/${complaintId}/status`, { status });

export const respondToComplaint = (complaintId, message) =>
	apiPost(`/api/complaints/${complaintId}/respond`, { message });

export const deleteComplaint = (complaintId) =>
	apiDelete(`/api/complaints/${complaintId}`);
