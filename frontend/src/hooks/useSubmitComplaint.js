import { useState } from "react";
import { apiPost } from "../config/api";

const useSubmitComplaint = () => {
	const [loading, setLoading] = useState(false);

	const submitComplaint = async (complaintData) => {
		setLoading(true);
		try {
			await apiPost("/api/complaints/submit", complaintData);
			return { ok: true };
		} catch (err) {
			return { ok: false, message: err.message || "An error occurred. Please try again." };
		} finally {
			setLoading(false);
		}
	};

	return { loading, submitComplaint };
};

export default useSubmitComplaint;
