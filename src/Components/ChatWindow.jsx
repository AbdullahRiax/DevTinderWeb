import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../utils/api.js";
import { clearUnread, setActiveChat } from "../utils/notificationsSlice.js";
import { connectSocket, emitWithAck } from "../utils/socket.js";
import Avatar from "./Avatar.jsx";

const MESSAGE_MAX_LENGTH = 1000;

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDay = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

const mergeMessages = (existing, incoming) => {
  const ids = new Set(existing.map((m) => m._id));
  const fresh = incoming.filter((m) => !ids.has(m._id));
  return fresh.length ? [...existing, ...fresh] : existing;
};

// Mount with key={peer._id} so each conversation starts with fresh state.
const ChatWindow = ({ me, peer }) => {
  const dispatch = useDispatch();
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [connected, setConnected] = useState(() => connectSocket().connected);

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const scrollModeRef = useRef("bottom");
  const prevScrollHeightRef = useRef(0);

  useEffect(() => {
    dispatch(setActiveChat(peer._id));
    return () => dispatch(setActiveChat(null));
  }, [peer._id, dispatch]);

  useEffect(() => {
    api
      .get(`/chat/${peer._id}`)
      .then((res) => {
        setMessages(res.data.data ?? []);
        setHasMore(!!res.data.hasMore);
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load messages.")))
      .finally(() => setLoading(false));

    emitWithAck("markRead", { userId: peer._id });
    dispatch(clearUnread(peer._id));
  }, [peer._id, dispatch]);

  useEffect(() => {
    const socket = connectSocket();

    const handleNewMessage = (message) => {
      const isThisChat =
        (message.from === peer._id && message.to === me._id) ||
        (message.from === me._id && message.to === peer._id);
      if (!isThisChat) return;

      scrollModeRef.current = "bottom";
      setMessages((prev) => mergeMessages(prev, [message]));
      if (message.from === peer._id) {
        emitWithAck("markRead", { userId: peer._id });
        dispatch(clearUnread(peer._id));
      }
    };
    const handleSeen = ({ by }) => {
      if (by !== peer._id) return;
      setMessages((prev) =>
        prev.map((m) => (m.from === me._id && !m.read ? { ...m, read: true } : m))
      );
    };
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesSeen", handleSeen);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesSeen", handleSeen);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [peer._id, me._id, dispatch]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (scrollModeRef.current === "preserve") {
      container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
    } else {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
    scrollModeRef.current = "bottom";
  }, [messages]);

  const loadOlder = async () => {
    if (!messages.length || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const res = await api.get(`/chat/${peer._id}`, {
        params: { before: messages[0].createdAt },
      });
      prevScrollHeightRef.current = scrollRef.current?.scrollHeight ?? 0;
      scrollModeRef.current = "preserve";
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m._id));
        return [...(res.data.data ?? []).filter((m) => !ids.has(m._id)), ...prev];
      });
      setHasMore(!!res.data.hasMore);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load older messages."));
    } finally {
      setLoadingOlder(false);
    }
  };

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setSendError("");

    const response = await emitWithAck("sendMessage", { to: peer._id, text: trimmed });
    if (response?.ok) {
      setText("");
      scrollModeRef.current = "bottom";
      setMessages((prev) => mergeMessages(prev, [response.message]));
    } else {
      setSendError(response?.error ?? "Could not send message.");
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const lastMineIndex = messages.findLastIndex((m) => m.from === me._id);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-base-100">
      <div className="flex items-center gap-3 border-b border-base-300 px-3 py-3 sm:px-5">
        <Link to="/chat" className="btn btn-ghost btn-sm btn-circle md:hidden" aria-label="Back to chats">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <Avatar user={peer} />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate font-semibold">
            {peer.firstName} {peer.lastName}
          </p>
          {!connected && <p className="text-xs text-warning">Reconnecting...</p>}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-base-200/40 px-3 py-4 sm:px-6">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <span className="loading loading-spinner loading-md text-violet-600" />
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="mb-4 text-center">
                <button type="button" onClick={loadOlder} disabled={loadingOlder} className="btn btn-ghost btn-xs">
                  {loadingOlder ? <span className="loading loading-spinner loading-xs" /> : "Load earlier messages"}
                </button>
              </div>
            )}

            {error && (
              <div role="alert" className="alert alert-error alert-soft mb-4 text-sm">
                {error}
              </div>
            )}

            {!error && messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center text-base-content/60">
                <Avatar user={peer} className="mb-3 h-16 w-16 text-xl" />
                <p className="font-medium text-base-content">You matched with {peer.firstName}!</p>
                <p className="text-sm">Say hi and start the conversation 👋</p>
              </div>
            )}

            <ul className="space-y-1.5">
              {messages.map((message, index) => {
                const mine = message.from === me._id;
                const previous = messages[index - 1];
                const showDay =
                  !previous ||
                  new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();

                return (
                  <li key={message._id}>
                    {showDay && (
                      <p className="my-3 text-center text-xs font-medium text-base-content/50">
                        {formatDay(message.createdAt)}
                      </p>
                    )}
                    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-left text-sm shadow-sm sm:max-w-[65%] ${
                          mine
                            ? "rounded-br-md bg-gradient-to-br from-pink-500 to-violet-600 text-white"
                            : "rounded-bl-md bg-base-100 text-base-content"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.text}</p>
                        <p className={`mt-0.5 text-right text-[10px] ${mine ? "text-white/70" : "text-base-content/50"}`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                    {mine && index === lastMineIndex && message.read && (
                      <p className="mt-0.5 text-right text-[10px] text-base-content/50">Seen</p>
                    )}
                  </li>
                );
              })}
            </ul>
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="border-t border-base-300 p-3 sm:px-5"
      >
        {sendError && <p role="alert" className="mb-2 text-left text-xs text-error">{sendError}</p>}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MESSAGE_MAX_LENGTH}
            placeholder={`Message ${peer.firstName}...`}
            aria-label={`Message ${peer.firstName}`}
            className="textarea max-h-32 min-h-11 flex-1 resize-none border-gray-200 bg-gray-100 py-2.5 leading-snug focus:border-gray-300 focus:outline-gray-300"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            aria-label="Send message"
            className="btn btn-circle border-0 bg-gradient-to-br from-pink-500 to-violet-600 text-white disabled:opacity-50"
          >
            {sending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
