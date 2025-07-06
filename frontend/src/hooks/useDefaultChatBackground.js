import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

const useDefaultChatBackground = () => {
	const [loading, setLoading] = useState(false);
	const { authUser, setAuthUser } = useAuthContext();

	const updateDefaultChatBackground = async (backgroundImage) => {
		setLoading(true);
		try {
			const res = await fetch("/api/users/default-chat-background", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ defaultChatBackground: backgroundImage }),
			});

			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}
			
			// Update the authUser with the new default background
			if (authUser) {
				const updatedUser = { ...authUser, defaultChatBackground: backgroundImage };
				setAuthUser(updatedUser);
			}
			
			toast.success("Default chat background updated successfully!");
			return true;
		} catch (error) {
			toast.error(error.message);
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { loading, updateDefaultChatBackground };
};

export default useDefaultChatBackground; 