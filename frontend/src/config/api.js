// Centralized API config + thin fetch helpers.
// Every network call in the app should go through these so URLs, credentials,
// and JSON parsing are handled in one place.

const getApiBaseUrl = () => {
	// In dev, vite.config.js proxies `/api` → backend on :5000, so a relative
	// path is the right thing.
	if (import.meta.env.DEV) return "";
	// In prod, point at the deployed backend via env. Absent → assume same
	// origin (e.g. when frontend is served by the backend itself).
	return import.meta.env.VITE_API_URL || "";
};

export const API_BASE_URL = getApiBaseUrl();

// Socket configuration
export const getSocketUrl = () => {
	if (import.meta.env.DEV) return "http://localhost:5000";
	return import.meta.env.VITE_SOCKET_URL || window.location.origin;
};

// Build a URL from an endpoint that always starts with `/api/...`. Callers
// don't need to know about the base URL.
const buildUrl = (endpoint) => {
	if (!endpoint.startsWith("/")) endpoint = "/" + endpoint;
	return `${API_BASE_URL}${endpoint}`;
};

// Read JSON safely. If the body isn't JSON, return null.
const readJson = async (res) => {
	const text = await res.text();
	if (!text) return null;
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
};

// Core request — returns parsed JSON on success, throws on { error } or non-OK.
const request = async (endpoint, { method = "GET", body, headers, ...rest } = {}) => {
	const isFormData = body instanceof FormData;
	const opts = {
		method,
		credentials: "include",
		headers: {
			...(isFormData ? {} : { "Content-Type": "application/json" }),
			...headers,
		},
		...rest,
	};
	if (body !== undefined) {
		opts.body = isFormData ? body : JSON.stringify(body);
	}

	const res = await fetch(buildUrl(endpoint), opts);
	const data = await readJson(res);

	if (!res.ok) {
		const message = data?.error || data?.message || `Request failed (${res.status})`;
		const err = new Error(message);
		err.status = res.status;
		err.data = data;
		throw err;
	}
	if (data && typeof data === "object" && data.error) {
		throw new Error(data.error);
	}
	return data;
};

export const apiGet = (endpoint, opts) => request(endpoint, { ...opts, method: "GET" });
export const apiPost = (endpoint, body, opts) => request(endpoint, { ...opts, method: "POST", body });
export const apiPut = (endpoint, body, opts) => request(endpoint, { ...opts, method: "PUT", body });
export const apiDelete = (endpoint, opts) => request(endpoint, { ...opts, method: "DELETE" });

// Backwards-compatible helper (still used by some older code paths).
export const apiCall = async (endpoint, options = {}) => request(endpoint, options);
