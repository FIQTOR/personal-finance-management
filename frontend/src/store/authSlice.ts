// store/authSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import type { RootState } from "./store";
import apiClient from "@/services/apiClient";
import type { ApiResponse, DecodedToken, Permission, User } from "@/types";

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
            // The refresh-token cookie is sent automatically (withCredentials).
            const res = await apiClient.get<ApiResponse<{ accessToken: string }>>(
                "/token",
                { skipAuthRefresh: true }
            );

            const accessToken = res.data.data.accessToken;
            const decoded = jwtDecode<DecodedToken>(accessToken);

            // The access token carries only { id, role }; fetch the full profile.
            const permissionsRes = await apiClient.get<
                ApiResponse<{ user: Omit<User, 'role'>; permissions: Permission[] }>
            >("/get-auth-permissions", {
                headers: { Authorization: `Bearer ${accessToken}` },
                skipAuthRefresh: true,
            });

            const { user, permissions } = permissionsRes.data.data;

            return {
                user: {
                    ...user,
                    role: {
                        name: decoded.role,
                        permissions,
                    },
                } as User,
                accessToken,
                expire: decoded.exp,
                blocked: (user as User).is_blocked ?? false,
            };
        } catch (err: unknown) {
            const error = err as { response?: { data?: unknown } };
            return rejectWithValue(error.response?.data || "Failed to refresh token");
        }
    }
);

export const signOut = createAsyncThunk(
    "auth/signOut",
    async (_, { rejectWithValue }) => {
        try {
            await apiClient.delete("/signout");
            return true;
        } catch (err: unknown) {
            const error = err as { response?: { data?: unknown } };
            return rejectWithValue(error.response?.data || "Failed to sign out");
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
            state.isReady = true;
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
    return new Set<string>(permissions.map((p) => p.name));
};
export const selectUserRole = (state: RootState) => state.auth.user?.role?.name;
export default authSlice.reducer;
