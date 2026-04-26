import { useEffect, useState } from "react";
import { apiGet, apiPut } from "../config/api";

const useAdminSystemSettings = (enabled = true) => {
	const [settings, setSettings] = useState(null);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);

	const fetchSettings = async () => {
		if (!enabled) return null;
		setLoading(true);
		setError(null);
		try {
			const data = await apiGet("/api/admin/settings");
			setSettings(data);
			return data;
		} catch (err) {
			setError(err.message);
			return null;
		} finally {
			setLoading(false);
		}
	};

	const saveSettings = async (formData) => {
		if (!enabled) return null;
		setSaving(true);
		setError(null);
		try {
			const data = await apiPut("/api/admin/settings", formData);
			if (data?.settings) setSettings(data.settings);
			return data;
		} catch (err) {
			setError(err.message);
			return null;
		} finally {
			setSaving(false);
		}
	};

	useEffect(() => {
		if (enabled) fetchSettings();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enabled]);

	return { settings, loading, saving, error, fetchSettings, saveSettings, setError };
};

export default useAdminSystemSettings;
