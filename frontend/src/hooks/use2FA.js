import { apiPost } from "../config/api";

export const enable2FA = () => apiPost("/api/auth/enable-2fa");

export const verifyEnable2FA = (otp) => apiPost("/api/auth/verify-enable-2fa", { otp });

export const disable2FA = () => apiPost("/api/auth/disable-2fa");
