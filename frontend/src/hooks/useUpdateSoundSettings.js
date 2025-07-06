import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

const useUpdateSoundSettings = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser } = useAuthContext();

	const updateSoundSettings = async (soundSettings) => {
		setLoading(true);
		try {
			const res = await fetch("/api/users/sound-settings", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ soundSettings }),
			});

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}
			
			// Update the auth user with new data
			setAuthUser(data.user);
			return true;
		} catch (error) {
			toast.error(error.message);
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { loading, updateSoundSettings };
};

export default useUpdateSoundSettings; 