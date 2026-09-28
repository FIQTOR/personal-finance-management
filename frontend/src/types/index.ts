/**
 * Shared domain types for the application.
 */

export interface Role {
    name: string;
    permissions?: Permission[];
}

export interface Permission {
    name: string;
    description?: string;
}

/** Per-user preferences mirrored from the account (cross-device). */
export interface UserPreferences {
    theme?: 'light' | 'dark';
    language?: string;
}

/** The authenticated user as stored in the Redux store. */
export interface User {
    id: number;
    name: string;
    email: string;
    role: Role | null;
    is_verified?: boolean;
    isVerified?: boolean;
    is_blocked?: boolean;
    avatar_url?: string | null;
    created_at?: string;
    updated_at?: string;
    preferences?: UserPreferences;
}

/** Standard API envelope used by every backend response. */
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data: T;
    code?: string;
    errors?: Array<{ path?: string; message: string } | string>;
}

/** Decoded JWT payload (matches the minimal backend payload `{ id, role }`). */
export interface DecodedToken {
    id: number;
    role: string | null;
    exp: number;
    iat: number;
}

export interface LoginCredentials {
    email: string;
    password: string;
    remember_me?: boolean;
}
