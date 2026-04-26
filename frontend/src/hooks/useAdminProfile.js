import { apiGet, apiPost, apiPut } from "../config/api";

export const fetchAdminProfile = () => apiGet("/api/admin/profile");

export const updateAdminProfile = (payload) => apiPut("/api/admin/profile", payload);

export const changeAdminPassword = (currentPassword, newPassword) =>
	apiPut("/api/admin/password", { currentPassword, newPassword });

export const adminLogout = () => apiPost("/api/admin/logout");

export const fetchAdminStats = () => apiGet("/api/admin/stats");

export const fetchAdminUsersPage = (page = 1, search = "") =>
	apiGet(`/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`);
