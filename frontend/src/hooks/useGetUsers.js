import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

const useGetUsers = () => {
	const [loading, setLoading] = useState(false);
	const [users, setUsers] = useState([]);

	const getUsers = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/users", {
				credentials: "include"
			});
			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}
			setUsers(data);
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		getUsers();
	}, []); // Only run once on mount, not on every getUsers change

	return { loading, users, setUsers, getUsers };
};
export default useGetUsers; 