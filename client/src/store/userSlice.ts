// store/userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
    userRole: "mentor" | "mentee" | null;
    user: any | null;
    token: string | null;
}

const savedUser = localStorage.getItem("user");
const savedRole = localStorage.getItem("userRole");
const savedToken = localStorage.getItem("token");

const initialState: UserState = {
    user: savedUser ? JSON.parse(savedUser) : null,
    userRole: savedRole ? (savedRole as "mentor" | "mentee") : null,
    token: savedToken ?? null,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserRole: (state, action: PayloadAction<"mentor" | "mentee">) => {
            state.userRole = action.payload;
            localStorage.setItem("userRole", action.payload);
        },
        setToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
            localStorage.setItem("token", action.payload);
        },
        setUser: (state, action: PayloadAction<any>) => {
            state.user = action.payload;
            localStorage.setItem("user", JSON.stringify(action.payload));
        },
        logout: (state) => {
            state.userRole = null;
            state.user = null;
            state.token = null;
            localStorage.removeItem("user");
            localStorage.removeItem("userRole");
            localStorage.removeItem("token");
        },
    },
});

export const { setUserRole, setUser, setToken, logout } = userSlice.actions;
export default userSlice.reducer;
