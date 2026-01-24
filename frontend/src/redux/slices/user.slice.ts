import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoggedIn: false,
  name: "",
  token: "",
  userId: "",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action) => {
      state.isLoggedIn = true;
      state.name = action.payload.name;
      state.userId = action.payload.userId;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.name = "";
      state.userId = "";
      state.token = "";
    },
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
