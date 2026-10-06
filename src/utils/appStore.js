import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice.js";
import notificationsReducer from "./notificationsSlice.js";

const appStore = configureStore({
  reducer: {
    user: userReducer,
    notifications: notificationsReducer,
  },
});

export default appStore;
