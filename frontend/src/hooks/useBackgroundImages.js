import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiDelete, apiGet } from "../config/api";

const useBackgroundImages = () => {
	const [backgroundImages, setBackgroundImages] = useState([]);
	const [loading, setLoading] = useState(true);
	const [deletingImage, setDeletingImage] = useState(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const data = await apiGet("/api/users/background-images");
				if (!cancelled) setBackgroundImages(data?.backgroundImages || []);
			} catch (err) {
				if (!cancelled) {
					toast.error("Failed to fetch background images");
					console.error("Error fetching background images:", err);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => { cancelled = true; };
	}, []);

	const deleteImage = async (imageUrl, conversationId) => {
		setDeletingImage(imageUrl);
		try {
			await apiDelete("/api/users/background-image", {
				body: { imageUrl, conversationId },
			});
			toast.success("Background image deleted successfully");
			setBackgroundImages((prev) => prev.filter((img) => img.url !== imageUrl));
			return true;
		} catch (err) {
			toast.error(err.message);
			return false;
		} finally {
			setDeletingImage(null);
		}
	};

	return { backgroundImages, loading, deletingImage, deleteImage };
};

export default useBackgroundImages;
