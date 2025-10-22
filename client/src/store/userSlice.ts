// store/userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
    userRole: "mentor" | "mentee" | null;
    user: any | null;
}

const savedUser = localStorage.getItem("user");
const savedRole = localStorage.getItem("userRole");

const initialState: UserState = {
    user: savedUser ? JSON.parse(savedUser) : null,
    userRole: savedRole ? (savedRole as "mentor" | "mentee") : null,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserRole: (state, action: PayloadAction<"mentor" | "mentee">) => {
            state.userRole = action.payload;
            localStorage.setItem("userRole", action.payload);
        },
        setUser: (state, action: PayloadAction<any>) => {
            state.user = action.payload;
            localStorage.setItem("user", JSON.stringify(action.payload));
        },
        logout: (state) => {
            state.userRole = null;
            state.user = null;
            localStorage.removeItem("user");
            localStorage.removeItem("userRole");
        },
    },
});

export const { setUserRole, setUser, logout } = userSlice.actions;
export default userSlice.reducer;
