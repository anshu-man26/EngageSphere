import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
	const [isVisible, setIsVisible] = useState(true);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [transitionType, setTransitionType] = useState('fade');
	const location = useLocation();
	const prevLocationRef = useRef(location.pathname);

	// Determine transition type based on route
	const getTransitionType = (currentPath, prevPath) => {
		// Different transitions for different route types
		if (currentPath === '/' && prevPath !== '/') {
			return 'scale'; // Home page gets scale transition
		}
		if (currentPath.includes('/user/') || currentPath === '/profile') {
			return 'slide'; // Profile pages get slide transition
		}
		if (currentPath === '/login' || currentPath === '/signup') {
			return 'fade'; // Auth pages get fade transition
		}
		return 'fade'; // Default fade transition
	};

	useEffect(() => {
		const currentPath = location.pathname;
		const prevPath = prevLocationRef.current;
		
		// Set transition type
		setTransitionType(getTransitionType(currentPath, prevPath));
		
		// Start transition out
		setIsTransitioning(true);
		setIsVisible(false);
		
		// Wait for fade out, then change route and fade in
		const transitionTimer = setTimeout(() => {
			setIsVisible(true);
			setIsTransitioning(false);
		}, 400); // Slightly longer for smoother effect

		// Update previous location
		prevLocationRef.current = currentPath;

		return () => clearTimeout(transitionTimer);
	}, [location.pathname]);

	// Get transition classes based on type
	const getTransitionClasses = () => {
		const baseClasses = 'transform transition-all duration-500 ease-out';
		
		switch (transitionType) {
			case 'slide':
				return `${baseClasses} ${
					isVisible 
						? 'opacity-100 translate-x-0 scale-100' 
						: 'opacity-0 translate-x-full scale-95'
				}`;
			case 'scale':
				return `${baseClasses} ${
					isVisible 
						? 'opacity-100 translate-y-0 scale-100' 
						: 'opacity-0 translate-y-0 scale-90'
				}`;
			case 'fade':
			default:
				return `${baseClasses} ${
					isVisible 
						? 'opacity-100 translate-y-0 scale-100' 
						: 'opacity-0 translate-y-4 scale-95'
				}`;
		}
	};

	return (
		<div className="relative page-transition-container">
			{/* Enhanced transition overlay with backdrop blur */}
			{isTransitioning && (
				<div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 z-50 flex items-center justify-center loading-overlay">
					<div className="text-center">
						<div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
						</div>
						<p className="text-white text-lg animate-pulse font-medium">Loading...</p>
						<div className="mt-2 w-24 h-1 bg-gray-700 rounded-full overflow-hidden">
							<div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
						</div>
					</div>
				</div>
			)}
			
			{/* Main content with dynamic transitions */}
			<div 
				className={`${getTransitionClasses()} ${isTransitioning ? 'transitioning' : ''}`}
				style={{
					transitionProperty: 'opacity, transform, scale',
					willChange: 'opacity, transform, scale',
					backfaceVisibility: 'hidden', // Improve performance
					perspective: '1000px'
				}}
			>
				{children}
			</div>
		</div>
	);
};

export default PageTransition; 