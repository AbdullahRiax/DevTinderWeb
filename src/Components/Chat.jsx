import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, NavLink, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../utils/api.js";
import { formatCount } from "../utils/notificationsSlice.js";
import useAuthUser from "../utils/useAuthUser.js";
import Avatar from "./Avatar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import CountBadge from "./CountBadge.jsx";

const Chat = () => {
  const user = useAuthUser();
  const isLoggedIn = !!user;
  const { userId } = useParams();
  const unreadByUser = useSelector((state) => state.notifications.unreadByUser);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isLoggedIn) return;
    api
      .get("/user/connections")
      .then((res) => setConnections(res.data.data ?? []))
      .catch((err) => {
        if (err.response?.status === 404) setConnections([]);
        else setError(getErrorMessage(err, "Could not load your connections."));
      })
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (!user || loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-violet-600" />
      </div>
    );
  }

  const peer = connections.find((c) => c._id === userId);
  const query = search.trim().toLowerCase();
  const visibleConnections = query
    ? connections.filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(query))
    : connections;

  // Unread conversations first, then alphabetical.
  const sortedConnections = [...visibleConnections].sort(
    (a, b) =>
      (unreadByUser[b._id] ?? 0) - (unreadByUser[a._id] ?? 0) ||
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
  );

  return (
    <section className="flex h-[calc(100svh-4rem-1px)] w-full overflow-hidden">
      <aside
        className={`${userId ? "hidden md:flex" : "flex"} w-full flex-col border-r border-base-300 bg-base-100 md:w-80 lg:w-96`}
      >
        <div className="border-b border-base-300 p-4 text-left">
          <h2 className="mb-3!">Messages</h2>
          <label className="input input-sm w-full border-gray-200 bg-gray-100 shadow-none focus-within:outline-gray-300">
            <svg className="h-4 w-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search connections"
              aria-label="Search connections"
              className="bg-transparent"
            />
          </label>
        </div>

        {error && (
          <div role="alert" className="alert alert-error alert-soft m-4 text-sm">
            {error}
          </div>
        )}

        {!error && connections.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <p className="text-4xl">💬</p>
            <p className="mt-3 font-semibold">No connections to chat with</p>
            <p className="mt-1 text-sm text-base-content/60">
              Once someone accepts your request, you can message them here.
            </p>
            <Link to="/feed" className="btn btn-sm mt-5 border-0 bg-gradient-to-r from-pink-500 to-violet-600 text-white">
              Find developers
            </Link>
          </div>
        )}

        {connections.length > 0 && sortedConnections.length === 0 && (
          <p className="p-6 text-center text-sm text-base-content/60">No connections match “{search}”.</p>
        )}

        <ul className="flex-1 overflow-y-auto">
          {sortedConnections.map((connection) => {
            const unread = unreadByUser[connection._id] ?? 0;
            return (
              <li key={connection._id}>
                <NavLink
                  to={`/chat/${connection._id}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-left transition hover:bg-base-200 ${
                      isActive ? "bg-violet-50 hover:bg-violet-50" : ""
                    }`
                  }
                >
                  <Avatar user={connection} className="h-12 w-12 text-base" />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate ${unread ? "font-bold" : "font-medium"}`}>
                      {connection.firstName} {connection.lastName}
                    </p>
                    <p className="truncate text-xs text-base-content/60">
                      {unread
                        ? `${formatCount(unread)} new message${unread === 1 ? "" : "s"}`
                        : connection.skills?.length
                          ? connection.skills.join(" · ")
                          : "Tap to chat"}
                    </p>
                  </div>
                  <CountBadge count={unread} label="unread messages" />
                </NavLink>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className={`${userId ? "flex" : "hidden md:flex"} min-w-0 flex-1`}>
        {peer ? (
          <ChatWindow key={peer._id} me={user} peer={peer} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center bg-base-200/40 p-8 text-center text-base-content/60">
            <p className="text-5xl">💬</p>
            {userId ? (
              <>
                <p className="mt-3 font-semibold text-base-content">Conversation not available</p>
                <p className="mt-1 text-sm">You can only chat with your connections.</p>
                <Link to="/chat" className="btn btn-ghost btn-sm mt-4 md:hidden">
                  Back to chats
                </Link>
              </>
            ) : (
              <>
                <p className="mt-3 font-semibold text-base-content">Your messages</p>
                <p className="mt-1 text-sm">Pick a connection on the left to start chatting.</p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Chat;
