import { createContext, useContext, useState, useEffect } from "react";
import { apiGet } from "../config/api";

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

		// Safely get admin from localStorage
		try {
			const adminData = localStorage.getItem("chat-admin");
			if (adminData) {
				const parsedAdmin = JSON.parse(adminData);
				// Validate that the admin object has required fields
				if (parsedAdmin && parsedAdmin._id && parsedAdmin.username) {
					setAdmin(parsedAdmin);
				} else {
					// Invalid admin data, clear it
					localStorage.removeItem("chat-admin");
					setAdmin(null);
				}
			}
		} catch (error) {
			console.error("Error parsing admin from localStorage:", error);
			localStorage.removeItem("chat-admin");
			setAdmin(null);
		}

		// Check for admin session independently
		const checkAdminSession = async () => {
			try {
				const adminData = await apiGet("/api/admin/profile");
				setAdmin(adminData);
				localStorage.setItem("chat-admin", JSON.stringify(adminData));
			} catch (error) {
				// 401 = no session; anything else = log it (but ignore network errors)
				if (error.status !== 401 && error.name !== "TypeError") {
					console.error("Error checking admin session:", error);
				}
				setAdmin(null);
				localStorage.removeItem("chat-admin");
			} finally {
				setLoading(false);
			}
		};

		// Check admin session regardless of user login status
			checkAdminSession();
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
		if (adminData) {
			localStorage.setItem("chat-admin", JSON.stringify(adminData));
		} else {
			localStorage.removeItem("chat-admin");
		}
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
