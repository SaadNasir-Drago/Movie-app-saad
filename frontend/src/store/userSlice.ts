import {
  getUserCookie,
  removeUserCookie,
  setUserCookie,
} from "@/utils/cookie";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  userID: number | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  token: string | null;
  email: string | null;
  isAuthenticated: boolean;
}

export const initialState: UserState = {
  userID: null,
  username: "",
  firstName: null,
  lastName: "",
  token: null,
  email: "",
  isAuthenticated: false,
};

const savedUser = getUserCookie();

const userSlice = createSlice({
  name: "user",
  initialState: savedUser || initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<Omit<UserState, "isAuthenticated">>
    ) => {
      // console.log(`${action.payload.userID}`);
      state.userID = action.payload.userID;
      state.username = action.payload.username;
      state.firstName = action.payload.firstName;
      state.lastName = action.payload.lastName;
      state.token = action.payload.token;
      state.email = action.payload.email;
      state.isAuthenticated = true;
      // Persist to cookies
      setUserCookie(state);
    },
    logout: (state) => {
      // state.userID = null;
      // state.firstName = "";
      // state.lastName = "";
      // state.token = null;
      // state.email = "";
      // state.isAuthenticated = false;
      Object.assign(state, initialState);
      // Remove user cookie
      removeUserCookie();
    },
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
