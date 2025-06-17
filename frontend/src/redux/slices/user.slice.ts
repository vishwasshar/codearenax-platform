import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoggedIn: false,
  user: {
    name: "",
    token: "",
  },
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action) => {
      state.isLoggedIn = true;
      state.user = action.payload;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.user = { name: "", token: "" };
    },
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
