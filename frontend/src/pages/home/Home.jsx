import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import MessageContainer from "../../components/messages/MessageContainer";
import Sidebar from "../../components/sidebar/Sidebar";
import { useAuthContext } from "../../context/AuthContext";

const Home = () => {
	const { authUser, loading } = useAuthContext();
	const location = useLocation();
	const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
		if (location.state?.focusChat) return window.innerWidth >= 1024;
		return true;
	});

	useEffect(() => {
		if (location.state?.focusChat && window.innerWidth < 1024) {
			setIsSidebarOpen(false);
		}
	}, [location.state]);

	// Lock body scroll while on the chat page so the chat header / input bar
	// stay pinned. Removed on unmount so other pages (/profile, /user/:id)
	// scroll normally.
	useEffect(() => {
		document.body.classList.add("chat-locked");
		return () => document.body.classList.remove("chat-locked");
	}, []);

	// Track the visual viewport so the chat fills exactly the visible area on
	// mobile when the soft keyboard opens. Without this, mobile Chrome scrolls
	// the page to keep the focused input on-screen and pushes the chat header
	// above the viewport.
	useEffect(() => {
		const vv = window.visualViewport;
		const apply = () => {
			const h = vv ? vv.height : window.innerHeight;
			document.documentElement.style.setProperty("--app-vh", `${h}px`);
		};
		apply();
		if (vv) {
			vv.addEventListener("resize", apply);
			vv.addEventListener("scroll", apply);
		}
		window.addEventListener("resize", apply);
		return () => {
			if (vv) {
				vv.removeEventListener("resize", apply);
				vv.removeEventListener("scroll", apply);
			}
			window.removeEventListener("resize", apply);
		};
	}, []);

	if (!loading && !authUser) {
		return <Navigate to='/login' replace />;
	}

	if (loading) {
		return (
			<div className='flex h-screen items-center justify-center bg-[#0B141A]'>
				<div className='animate-spin rounded-full h-8 w-8 border-2 border-[#00A884] border-t-transparent' />
			</div>
		);
	}

	return (
		<div
			className='flex bg-[#0B141A] overflow-hidden mobile-chat-container'
			style={{ height: "var(--app-vh, 100dvh)" }}
		>
			<div className='flex w-full h-full overflow-hidden mobile-chat-main'>
				<Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
				<main className='flex-1 min-w-0 overflow-hidden'>
					<MessageContainer isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
				</main>
			</div>
		</div>
	);
};

export default Home;
