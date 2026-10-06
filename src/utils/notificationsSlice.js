import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  requestsCount: 0,
  unreadByUser: {},
  activeChatUserId: null,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setRequestsCount: (state, action) => {
      state.requestsCount = action.payload;
    },
    decrementRequests: (state) => {
      state.requestsCount = Math.max(state.requestsCount - 1, 0);
    },
    setUnreadCounts: (state, action) => {
      state.unreadByUser = action.payload;
    },
    incrementUnread: (state, action) => {
      const userId = action.payload;
      state.unreadByUser[userId] = (state.unreadByUser[userId] ?? 0) + 1;
    },
    clearUnread: (state, action) => {
      delete state.unreadByUser[action.payload];
    },
    setActiveChat: (state, action) => {
      state.activeChatUserId = action.payload;
    },
    resetNotifications: () => initialState,
  },
});

export const selectTotalUnread = (state) =>
  Object.values(state.notifications.unreadByUser).reduce((sum, count) => sum + count, 0);

export const formatCount = (count) => (count > 10 ? "10+" : String(count));

export const {
  setRequestsCount,
  decrementRequests,
  setUnreadCounts,
  incrementUnread,
  clearUnread,
  setActiveChat,
  resetNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
