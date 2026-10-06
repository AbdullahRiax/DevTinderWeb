import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: null,
  reducers: {
    storeUser: (_state, action) => action.payload,
    clearUser: () => null,
  },
});

export const { storeUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
