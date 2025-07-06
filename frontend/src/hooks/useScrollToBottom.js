import { useCallback, useRef } from 'react';

const useScrollToBottom = () => {
	const scrollTimeoutRef = useRef(null);
	const imageLoadPromisesRef = useRef([]);

	const waitForImagesToLoad = useCallback((messages) => {
		// Clear any existing promises
		imageLoadPromisesRef.current = [];
		
		// Find all images and GIFs in the messages
		const images = document.querySelectorAll('.message-image img, .gif-message img');
		
		// Create promises for each image to load
		images.forEach(img => {
			if (img.complete) {
				// Image is already loaded
				imageLoadPromisesRef.current.push(Promise.resolve());
			} else {
				// Wait for image to load
				imageLoadPromisesRef.current.push(
					new Promise((resolve) => {
						img.onload = resolve;
						img.onerror = resolve; // Resolve even on error to not block
					})
				);
			}
		});
		
		return Promise.all(imageLoadPromisesRef.current);
	}, []);

	const scrollToBottom = useCallback((behavior = 'smooth', delay = 0) => {
		// Clear any existing timeout
		if (scrollTimeoutRef.current) {
			clearTimeout(scrollTimeoutRef.current);
		}

		scrollTimeoutRef.current = setTimeout(() => {
			const messagesContainer = document.querySelector('.messages-container');
			if (messagesContainer) {
				// Use smooth scrolling with scrollIntoView for better animation
				const lastMessage = messagesContainer.lastElementChild;
				if (lastMessage) {
					lastMessage.scrollIntoView({ 
						behavior: 'smooth', 
						block: 'end',
						inline: 'nearest'
					});
				} else {
					// Fallback to direct scrollTop if no last element
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
				}
			}
		}, delay);
	}, []);

	// Custom smooth scroll with easing
	const smoothScrollToBottom = useCallback((duration = 800) => {
		const messagesContainer = document.querySelector('.messages-container');
		if (!messagesContainer) return;

		const startPosition = messagesContainer.scrollTop;
		const targetPosition = messagesContainer.scrollHeight - messagesContainer.clientHeight;
		const distance = targetPosition - startPosition;
		
		if (distance <= 0) return; // Already at bottom

		let startTime = null;

		const animateScroll = (currentTime) => {
			if (startTime === null) startTime = currentTime;
			const timeElapsed = currentTime - startTime;
			const progress = Math.min(timeElapsed / duration, 1);
			
			// Easing function for smooth animation
			const easeOutCubic = 1 - Math.pow(1 - progress, 3);
			
			messagesContainer.scrollTop = startPosition + (distance * easeOutCubic);
			
			if (progress < 1) {
				requestAnimationFrame(animateScroll);
			}
		};

		requestAnimationFrame(animateScroll);
	}, []);

	// Cleanup function to clear timeouts
	const cleanup = useCallback(() => {
		if (scrollTimeoutRef.current) {
			clearTimeout(scrollTimeoutRef.current);
		}
	}, []);

	const scrollToBottomAfterImagesLoad = useCallback(async (messages, behavior = 'smooth') => {
		try {
			// Wait for images to load first (with a timeout to prevent hanging)
			await Promise.race([
				waitForImagesToLoad(messages),
				new Promise(resolve => setTimeout(resolve, 3000)) // 3 second timeout
			]);
			
			// Then scroll to bottom
			scrollToBottom(behavior, 100);
		} catch (error) {
			console.log('Error waiting for images to load:', error);
			// Fallback: scroll anyway
			scrollToBottom(behavior, 100);
		}
	}, [waitForImagesToLoad, scrollToBottom]);

	return {
		scrollToBottom,
		smoothScrollToBottom,
		scrollToBottomAfterImagesLoad,
		waitForImagesToLoad,
		cleanup
	};
};

export default useScrollToBottom; 