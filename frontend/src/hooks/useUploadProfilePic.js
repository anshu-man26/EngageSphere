import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

const useUploadProfilePic = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser } = useAuthContext();

	const uploadProfilePic = async (file) => {
		if (!file) {
			toast.error("Please select a file");
			return;
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error("Please select an image file");
			return;
		}

		// Validate file size (5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error("File size must be less than 5MB");
			return;
		}

		setLoading(true);
		try {
			const formData = new FormData();
			formData.append('profilePic', file);

			const res = await fetch("/api/users/profile/upload-pic", {
				method: "POST",
				credentials: "include",
				body: formData,
			});

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}
			
			// Update the auth user with new data
			setAuthUser(data.user);
			toast.success("Profile picture uploaded successfully!");
			return data.profilePic;
		} catch (error) {
			toast.error(error.message);
			return null;
		} finally {
			setLoading(false);
		}
	};

	return { loading, uploadProfilePic };
};

export default useUploadProfilePic; 