import { useCallback, useEffect, useRef, useState } from "react";
import api, { getErrorMessage } from "../utils/api.js";
import useAuthUser from "../utils/useAuthUser.js";
import UserCard from "./UserCard.jsx";

const PAGE_SIZE = 10;
const PREFETCH_WHEN_REMAINING = 2;

const Feed = () => {
  const user = useAuthUser();
  const isLoggedIn = !!user;

  const [queue, setQueue] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const fetchingRef = useRef(false);
  const seenIdsRef = useRef(new Set());

  // Swiped users are excluded by the backend, so the next unseen batch is always on page 1.
  const loadMore = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setFetching(true);
    setError("");
    try {
      const res = await api.get("/user/feed", { params: { page: 1, limit: PAGE_SIZE } });
      const data = res.data.data ?? [];
      const fresh = data.filter((person) => !seenIdsRef.current.has(person._id));
      fresh.forEach((person) => seenIdsRef.current.add(person._id));
      setQueue((prev) => [...prev, ...fresh]);
      if (data.length < PAGE_SIZE || fresh.length === 0) setHasMore(false);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load your feed."));
    } finally {
      fetchingRef.current = false;
      setFetching(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadMore();
  }, [isLoggedIn, loadMore]);

  const handleSwipe = async (direction) => {
    const person = queue[0];
    if (!person) return;

    const status = direction === "right" ? "interested" : "ignored";
    const remaining = queue.length - 1;
    setQueue((prev) => prev.slice(1));
    setActionError("");

    try {
      await api.post(`/request/send/${status}/${person._id}`);
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not save your choice. Please try again."));
    }

    if (remaining <= PREFETCH_WHEN_REMAINING && hasMore) loadMore();
  };

  if (!user || initialLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-violet-600" />
      </div>
    );
  }

  const [current, next] = queue;

  return (
    <section className="flex w-full flex-1 flex-col items-center px-4 py-8 sm:px-6">
      <div className="mb-6 text-center">
        <h2>Discover developers</h2>
        <p className="text-sm text-base-content/60">
          Swipe right if you&apos;re interested, left to ignore
        </p>
      </div>

      {(error || actionError) && (
        <div role="alert" className="alert alert-error alert-soft mb-4 w-full max-w-sm text-sm">
          <span>{error || actionError}</span>
          {error && (
            <button type="button" onClick={loadMore} className="btn btn-sm btn-ghost">
              Retry
            </button>
          )}
        </div>
      )}

      {current ? (
        <div className="grid w-full max-w-sm justify-items-center [&>*]:col-start-1 [&>*]:row-start-1">
          {next && (
            <div className="pointer-events-none w-full translate-y-3 scale-95 opacity-60" aria-hidden="true">
              <UserCard user={next} />
            </div>
          )}
          <UserCard key={current._id} user={current} onSwipe={handleSwipe} />
        </div>
      ) : fetching ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <span className="loading loading-spinner loading-lg text-violet-600" />
        </div>
      ) : (
        !error && (
          <div className="w-full max-w-sm rounded-3xl border border-dashed border-base-300 p-10 text-center">
            <p className="text-4xl">🎉</p>
            <p className="mt-3 font-semibold">You&apos;re all caught up!</p>
            <p className="mt-1 text-sm text-base-content/60">
              No new developers right now. Check back later.
            </p>
          </div>
        )
      )}
    </section>
  );
};

export default Feed;
