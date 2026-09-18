// store/authSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import type { RootState } from "./store";
import axiosJWT from "@/utils/axiosJWT";
import AppConfig from "@/config/AppConfig";

interface User {
    [key: string]: any;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    expire: number;
    isReady: boolean;
    isLoading: boolean;
    blocked: boolean;
}

const initialState: AuthState = {
    user: null,
    accessToken: null,
    expire: 0,
    isReady: false,
    isLoading: false,
    blocked: false,
};

// === Async Thunks ===
export const refreshToken = createAsyncThunk(
    "auth/refreshToken",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${AppConfig.baseApiUrl}/token`, {
                withCredentials: true,
            });

            const decoded: any = jwtDecode(res.data.accessToken);

            const responsePermissions: any = await axios.get(
                `${AppConfig.baseApiUrl}/get-auth-permissions`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${res.data.accessToken}`
                    }
                }
            );
            return {
                user: {
                    ...decoded,
                    exp: undefined,
                    iat: undefined,
                    refreshToken: undefined,
                    role: {
                        name: decoded.role,
                        permissions: responsePermissions.data.permissions
                    }
                },
                accessToken: res.data.accessToken,
                expire: decoded.exp,
                blocked: decoded.is_blocked ?? false,
                isVerified: decoded.is_verified,
            };
        } catch (err: any) {
            return rejectWithValue(err.response?.data || "Failed to refresh token");
        }
    }
);

export const signOut = createAsyncThunk(
    "auth/signOut",
    async (accessToken: string | null, { rejectWithValue }) => {
        try {
            await axiosJWT.delete(`${AppConfig.baseApiUrl}/signout`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                withCredentials: true,
            });
            return true;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || "Failed to sign out");
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User | null>) => {
            state.user = action.payload;
        },
        loginSuccess: (state, action: PayloadAction<{ user: User; accessToken: string; expire: number; blocked: boolean }>) => {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.expire = action.payload.expire;
            state.blocked = action.payload.blocked;
            state.isReady = true; // Langsung siap
        },
    },
    extraReducers: (builder) => {
        builder
            // refreshToken
            .addCase(refreshToken.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
                state.expire = action.payload.expire;
                state.blocked = action.payload.blocked;
                state.isReady = true;
            })
            .addCase(refreshToken.rejected, (state) => {
                state.isReady = true;
                state.user = null;
                state.accessToken = null;
            })

            // signOut
            .addCase(signOut.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(signOut.fulfilled, (state) => {
                state.user = null;
                state.accessToken = null;
                state.expire = 0;
                state.isLoading = false;
            })
            .addCase(signOut.rejected, (state) => {
                state.isLoading = false;
            });
    },
});

export const { setUser, loginSuccess } = authSlice.actions;
export const selectAuth = (state: RootState) => state.auth;
export const selectUserPermissions = (state: RootState) => {
    const permissions = state.auth.user?.role?.permissions;
    if (!Array.isArray(permissions)) return new Set<string>();
    return new Set<string>(permissions.map((p: any) => p.name));
};
export const selectUserRole = (state: RootState) => state.auth.user?.role?.name;
export default authSlice.reducer;
