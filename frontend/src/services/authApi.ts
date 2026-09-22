/**
 * Auth API service.
 *
 * Thin wrappers around the backend auth endpoints so pages/hooks don't build
 * URLs or handle HTTP details directly.
 *
 * NOTE: Self-registration is disabled (setup-only). There is no `signup`.
 */
import apiClient from './apiClient';
import { BASE_API_URL } from '@/constants';
import type { ApiResponse, LoginCredentials } from '@/types';

export const authApi = {
    checkSetup: () =>
        apiClient.get<ApiResponse<{ setupRequired: boolean }>>(`${BASE_API_URL}/check-setup`),

    setup: (payload: { name: string; email: string; password: string; currency?: string; language?: string }) =>
        apiClient.post<ApiResponse<{ accessToken: string }>>(`${BASE_API_URL}/setup`, payload),

    login: (credentials: LoginCredentials) =>
        apiClient.post<ApiResponse<{ accessToken: string }>>(`${BASE_API_URL}/signin`, credentials),

    logout: () => apiClient.delete(`${BASE_API_URL}/signout`),

    checkAuth: () => apiClient.get<ApiResponse<{ auth: boolean }>>(`${BASE_API_URL}/checkauth`),

    resendVerification: () => apiClient.get(`${BASE_API_URL}/resend-verification-email`),

    verifyEmail: (token: string) =>
        apiClient.get(`${BASE_API_URL}/verify-email`, { params: { token } }),

    requestPasswordReset: (email: string) =>
        apiClient.post(`${BASE_API_URL}/forgot-password`, { email }),

    checkResetToken: (token: string) =>
        apiClient.get(`${BASE_API_URL}/check-reset-password-token`, { params: { token } }),

    resetPassword: (token: string, newPassword: string) =>
        apiClient.post(`${BASE_API_URL}/reset-password`, { token, newPassword }),

    updateProfile: (name: string) => apiClient.put(`${BASE_API_URL}/profile`, { name }),

    updateAvatar: (formData: FormData) =>
        apiClient.put(`${BASE_API_URL}/profile/avatar`, formData),

    getAuthPermissions: () =>
        apiClient.get<ApiResponse<{ user: unknown; permissions: unknown[] }>>(`${BASE_API_URL}/get-auth-permissions`),

    googleAuthUrl: (origin: string) =>
        `${BASE_API_URL}/auth/google?origin=${encodeURIComponent(origin)}`,
};

export default authApi;
