import { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => {
	return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
	const [authUser, setAuthUser] = useState(null);
	const [admin, setAdmin] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Safely get user from localStorage
		try {
			const user = localStorage.getItem("chat-user");
			if (user) {
				const parsedUser = JSON.parse(user);
				// Validate that the user object has required fields
				if (parsedUser && parsedUser._id && parsedUser.username) {
					setAuthUser(parsedUser);
				} else {
					// Invalid user data, clear it
					localStorage.removeItem("chat-user");
					setAuthUser(null);
				}
			}
		} catch (error) {
			console.error("Error parsing user from localStorage:", error);
			localStorage.removeItem("chat-user");
			setAuthUser(null);
		}

		// Check for admin session only if user is logged in
		const checkAdminSession = async () => {
			try {
				const res = await fetch("/api/admin/profile", {
					credentials: "include",
				});
				if (res.ok) {
					const adminData = await res.json();
					setAdmin(adminData);
				} else if (res.status === 401) {
					// User is not an admin, which is normal
					setAdmin(null);
				}
			} catch (error) {
				// Only log error if it's not a network error
				if (error.name !== 'TypeError') {
					console.error("Error checking admin session:", error);
				}
				setAdmin(null);
			} finally {
				setLoading(false);
			}
		};

		// Only check admin session if user is logged in
		if (authUser) {
			checkAdminSession();
		} else {
			setLoading(false);
		}
	}, []);

	const updateAuthUser = (user) => {
		setAuthUser(user);
		if (user) {
			localStorage.setItem("chat-user", JSON.stringify(user));
		} else {
			localStorage.removeItem("chat-user");
		}
	};

	const updateAdmin = (adminData) => {
		setAdmin(adminData);
	};

	return (
		<AuthContext.Provider value={{ 
			authUser, 
			setAuthUser: updateAuthUser,
			admin,
			setAdmin: updateAdmin,
			loading 
		}}>
			{children}
		</AuthContext.Provider>
	);
};
