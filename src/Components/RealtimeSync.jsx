import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../utils/api.js";
import { connectSocket, disconnectSocket } from "../utils/socket.js";
import {
  clearUnread,
  incrementUnread,
  resetNotifications,
  setRequestsCount,
  setUnreadCounts,
} from "../utils/notificationsSlice.js";

// Keeps the request and unread-message counters in the header live while logged in.
const RealtimeSync = () => {
  const userId = useSelector((state) => state.user?._id);
  const activeChatUserId = useSelector((state) => state.notifications.activeChatUserId);
  const dispatch = useDispatch();
  const activeChatRef = useRef(activeChatUserId);

  useEffect(() => {
    activeChatRef.current = activeChatUserId;
  }, [activeChatUserId]);

  useEffect(() => {
    if (!userId) {
      disconnectSocket();
      dispatch(resetNotifications());
      return;
    }

    const refreshRequests = () =>
      api
        .get("/user/request/recieved")
        .then((res) => dispatch(setRequestsCount(res.data.data?.length ?? 0)))
        .catch(() => {});

    const refreshUnread = () =>
      api
        .get("/chat/unread")
        .then((res) => dispatch(setUnreadCounts(res.data.data ?? {})))
        .catch(() => {});

    const socket = connectSocket();

    const handleConnect = () => {
      refreshRequests();
      refreshUnread();
    };
    const handleNewMessage = (message) => {
      if (message.from !== userId && message.from !== activeChatRef.current) {
        dispatch(incrementUnread(message.from));
      }
    };
    const handleMessagesRead = ({ userId: otherId }) => dispatch(clearUnread(otherId));

    socket.on("connect", handleConnect);
    socket.on("newMessage", handleNewMessage);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("requestReceived", refreshRequests);
    handleConnect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("requestReceived", refreshRequests);
    };
  }, [userId, dispatch]);

  return null;
};

export default RealtimeSync;
