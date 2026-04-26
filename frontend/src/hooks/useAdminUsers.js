import { apiGet, apiPost, apiPut } from "../config/api";

// Stateless API helpers for the admin user-management surface. Components
// own their own UI state and decide when to call these.

export const fetchAdminUser = (userId) => apiGet(`/api/admin/users/${userId}`);

export const fetchAllAdminUsers = (limit = 1000) =>
	apiGet(`/api/admin/users?limit=${limit}`);

export const updateAdminUser = (userId, payload) =>
	apiPut(`/api/admin/users/${userId}`, payload);

export const changeAdminUserPassword = (userId, newPassword) =>
	apiPut(`/api/admin/users/${userId}/password`, { newPassword });

export const uploadAdminUserProfilePic = (userId, file) => {
	const fd = new FormData();
	fd.append("profilePic", file);
	return apiPost(`/api/admin/users/${userId}/profile-pic`, fd);
};
