// Paginated message fetcher.
//
// Initial load: newest 30 messages.
// Scroll up: `loadMoreMessages()` fetches the next 30 older ones.
//
// StrictMode-safe: in dev React runs every effect twice (run → cleanup →
// run again). We don't try to dedupe with refs — each invocation is just
// a cheap idempotent GET. The `cancelled` flag only discards stale results
// during conversation switches.

import { useCallback, useEffect, useState } from "react";
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

	const partnerId =
		selectedConversation?.participant?._id || selectedConversation?._id || null;

	useEffect(() => {
		if (!partnerId) {
			setMessages([]);
			setHasMoreMessages(false);
			setLoading(false);
			return;
		}

		let cancelled = false;
		setLoading(true);

		apiGet(`/api/messages/${partnerId}?limit=${PAGE_SIZE}`)
			.then((data) => {
				if (cancelled) return;
				const list = Array.isArray(data) ? data : data?.messages || [];
				const more = Array.isArray(data) ? false : !!data?.hasMore;
				setMessages(list);
				setHasMoreMessages(more);
			})
			.catch((err) => {
				if (cancelled) return;
				console.error("Error fetching messages:", err);
				toast.error(err.message || "Failed to load messages");
				setMessages([]);
				setHasMoreMessages(false);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [partnerId, setMessages, setHasMoreMessages]);

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
