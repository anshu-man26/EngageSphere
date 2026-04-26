import { apiPost } from "../config/api";

// Three-step secure-delete flow used by SecureDeleteModal.
export const requestDeleteOtp = (userIds) =>
	apiPost("/api/admin/request-delete-otp", { userIds });

export const verifyDeleteOtp = (otp) =>
	apiPost("/api/admin/verify-delete-otp", { otp });

export const confirmDelete = (userIds) =>
	apiPost("/api/admin/confirm-delete", { userIds });
