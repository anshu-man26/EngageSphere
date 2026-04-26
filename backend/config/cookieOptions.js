// Single source of truth for auth-cookie options.
//
// In production the frontend (Vercel) and backend (EC2) live on different
// domains, so cookies must be:
//   - sameSite: "none"  (otherwise the browser drops them on cross-site requests)
//   - secure: true      (sameSite "none" requires it)
//
// In development we use "lax" + non-secure so cookies work over plain http.
const isProd = process.env.NODE_ENV === "production";

export const authCookieOptions = (maxAgeMs) => ({
	maxAge: maxAgeMs,
	httpOnly: true,
	sameSite: isProd ? "none" : "lax",
	secure: isProd,
});

export const clearCookieOptions = () => ({
	httpOnly: true,
	sameSite: isProd ? "none" : "lax",
	secure: isProd,
});
