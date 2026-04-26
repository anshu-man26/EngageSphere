import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";
import { apiGet } from "../config/api";

const PAGE_SIZE = 30;

const useGetMessages = () => {
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);

	const messages = useConversation((s) => s.messages);
	const setMessages = useConversation((s) => s.setMessages);
	const prependMessages = useConversation((s) => s.prependMessages);
	const hasMoreMessages = useConversation((s) => s.hasMoreMessages);
	const setHasMoreMessages = useConversation((s) => s.setHasMoreMessages);
	const selectedConversation = useConversation((s) => s.selectedConversation);

	// Track which conversation we last fetched for so socket-driven changes
	// don't double-fetch.
	const fetchedForRef = useRef(null);

	const partnerId =
		selectedConversation?.participant?._id || selectedConversation?._id || null;

	// ── Initial fetch (newest page) ──────────────────────────────
	useEffect(() => {
		if (!partnerId) {
			setMessages([]);
			setHasMoreMessages(false);
			fetchedForRef.current = null;
			return;
		}
		if (fetchedForRef.current === partnerId) return; // already loaded
		fetchedForRef.current = partnerId;

		let cancelled = false;
		setLoading(true);
		(async () => {
			try {
				const data = await apiGet(`/api/messages/${partnerId}?limit=${PAGE_SIZE}`);
				if (cancelled) return;

				// Backwards compat: backend used to return an array directly.
				const list = Array.isArray(data) ? data : data?.messages || [];
				const more = Array.isArray(data) ? false : !!data?.hasMore;

				setMessages(list);
				setHasMoreMessages(more);
			} catch (err) {
				if (cancelled) return;
				console.error("Error fetching messages:", err);
				toast.error(err.message || "Failed to load messages");
				setMessages([]);
				setHasMoreMessages(false);
			} finally {
				// Always clear loading. In React StrictMode dev, the effect
				// runs → cleanup → runs again. If we gate this on `!cancelled`,
				// the first run's fetch resolves *after* cleanup set
				// cancelled=true, so loading would stay true forever (the
				// second run takes the fetchedForRef early-exit and doesn't
				// touch loading). Clearing unconditionally is safe because
				// `setMessages`/`setHasMoreMessages` are gated by `!cancelled`.
				setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [partnerId, setMessages, setHasMoreMessages]);

	// ── Load older messages (called when user scrolls to top) ────
	const loadMoreMessages = useCallback(async () => {
		if (!partnerId || !hasMoreMessages || loadingMore || loading) return null;
		const oldest = messages[0];
		if (!oldest?._id) return null;

		setLoadingMore(true);
		try {
			const data = await apiGet(
				`/api/messages/${partnerId}?limit=${PAGE_SIZE}&before=${oldest._id}`,
			);
			const older = Array.isArray(data) ? data : data?.messages || [];
			const more = Array.isArray(data) ? false : !!data?.hasMore;

			prependMessages(older);
			setHasMoreMessages(more);
			return older.length;
		} catch (err) {
			console.error("Error loading older messages:", err);
			toast.error(err.message || "Failed to load older messages");
			return null;
		} finally {
			setLoadingMore(false);
		}
	}, [partnerId, hasMoreMessages, loadingMore, loading, messages, prependMessages, setHasMoreMessages]);

	const safeMessages = Array.isArray(messages) ? messages : [];

	return {
		messages: safeMessages,
		loading,
		loadingMore,
		hasMore: hasMoreMessages,
		loadMoreMessages,
	};
};

export default useGetMessages;
