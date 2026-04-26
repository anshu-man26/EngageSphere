import { useEffect, useState } from "react";
import { apiGet } from "../config/api";

const useGetUserProfile = (userId) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!userId) {
			setLoading(false);
			return;
		}
		let cancelled = false;
		setLoading(true);
		setError(null);
		apiGet(`/api/users/profile/${userId}`)
			.then((data) => {
				if (cancelled) return;
				setUser(data?.user || null);
			})
			.catch((err) => {
				if (cancelled) return;
				setError(err.message || "Failed to load user profile");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [userId]);

	return { user, loading, error };
};

export default useGetUserProfile;
