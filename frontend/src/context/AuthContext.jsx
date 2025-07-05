import { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => {
	return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
	const [authUser, setAuthUser] = useState(null);
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
		} finally {
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

	return (
		<AuthContext.Provider value={{ 
			authUser, 
			setAuthUser: updateAuthUser,
			loading 
		}}>
			{children}
		</AuthContext.Provider>
	);
};
