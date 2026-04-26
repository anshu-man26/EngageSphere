// Single source of truth for /api/admin/settings/public.
// Multiple hooks consume the same fetch + same socket-bridged updates,
// so we hit the network once per session instead of once per consumer.

const DEFAULT_SETTINGS = {
	mobileAvailability: { enabled: true, message: "" },
	maintenanceMode: { enabled: false, message: "" },
	userLogin: true,
	userRegistration: true,
	videoCalls: true,
};

let currentSettings = null;
let inflightPromise = null;
let initialized = false;
const subscribers = new Set();

const notify = () => {
	subscribers.forEach((cb) => {
		try {
			cb(currentSettings);
		} catch {}
	});
};

const fetchSettings = async () => {
	if (inflightPromise) return inflightPromise;
	inflightPromise = (async () => {
		try {
			const res = await fetch("/api/admin/settings/public");
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			currentSettings = data;
		} catch (err) {
			console.warn("[systemSettings] fetch failed, using defaults:", err);
			if (!currentSettings) currentSettings = DEFAULT_SETTINGS;
		} finally {
			inflightPromise = null;
			notify();
		}
		return currentSettings;
	})();
	return inflightPromise;
};

const ensureInitialized = () => {
	if (initialized) return;
	initialized = true;

	// First fetch
	fetchSettings();

	// Real-time updates from the SocketContext bridge
	if (typeof window !== "undefined") {
		window.addEventListener("systemSettingsUpdated", (event) => {
			if (event?.detail) {
				currentSettings = { ...(currentSettings || {}), ...event.detail };
				notify();
			}
		});
	}
};

export const getSystemSettings = () => currentSettings;

export const subscribeToSystemSettings = (callback) => {
	ensureInitialized();
	subscribers.add(callback);
	// Push the current snapshot immediately if we already have one
	if (currentSettings) {
		try { callback(currentSettings); } catch {}
	}
	return () => {
		subscribers.delete(callback);
	};
};

export const refreshSystemSettings = () => {
	inflightPromise = null; // force refetch
	return fetchSettings();
};
