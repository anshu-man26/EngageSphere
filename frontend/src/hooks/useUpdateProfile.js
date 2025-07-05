import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

const useUpdateProfile = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser } = useAuthContext();

	const updateProfile = async ({ fullName, profilePic, bio }) => {
		const success = handleInputErrors({ fullName, profilePic, bio });
		if (!success) return false;

		setLoading(true);
		try {
			const res = await fetch("/api/users/profile", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ fullName, profilePic, bio }),
			});

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}
			
			// Update the auth user with new data
			setAuthUser(data.user);
			toast.success("Profile updated successfully!");
			return true;
		} catch (error) {
			toast.error(error.message);
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { loading, updateProfile };
};

function handleInputErrors({ fullName, profilePic, bio }) {
	if (!fullName || fullName.trim().length < 2) {
		toast.error("Full name must be at least 2 characters long");
		return false;
	}

	if (bio && bio.length > 150) {
		toast.error("Bio must be 150 characters or less");
		return false;
	}

	return true;
}

export default useUpdateProfile; 