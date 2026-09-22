/**
 * Central axios client with:
 *  - request interceptor that attaches the access token
 *  - single-flight refresh on 401 (so concurrent requests share one refresh)
 *  - automatic retry of the original request after refreshing
 *
 * The Redux store is injected via `injectStore` to avoid a circular import.
 */
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AppStore, RootState } from '@/store/store';
import { BASE_API_URL, TOKEN_REFRESH_SKEW_MS } from '@/constants';

let store: AppStore | null = null;

/** Inject the Redux store once at bootstrap. */
export const injectStore = (_store: AppStore) => {
    store = _store;
};

const apiClient = axios.create({
    baseURL: BASE_API_URL,
    withCredentials: true,
});

/** True when the access token is missing or about to expire. */
const isTokenExpiring = (state: RootState): boolean => {
    const { expire, accessToken } = state.auth;
    if (!accessToken || !expire) return true;
    return expire * 1000 - TOKEN_REFRESH_SKEW_MS < Date.now();
};

// Single-flight refresh: all callers await the same promise.
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
    if (!store) return null;

    if (!refreshPromise) {
        // Import lazily to avoid a circular dependency (authSlice imports apiClient).
        refreshPromise = import('@/store/authSlice')
            .then(({ refreshToken }) => store!.dispatch(refreshToken() as never))
            .then((res) => {
                const payload = (res as { payload?: { accessToken?: string } } | undefined)?.payload;
                return payload?.accessToken ?? null;
            })
            .catch(() => null)
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

// --- Request interceptor: attach a fresh access token -------------------------
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    // Allow callers to opt out (e.g. the refresh flow itself).
    if ((config as { skipAuthRefresh?: boolean }).skipAuthRefresh) return config;
    if (!store) return config;

    const state = store.getState();
    let token = state.auth.accessToken;

    if (isTokenExpiring(state)) {
        const refreshed = await refreshAccessToken();
        if (refreshed) token = refreshed;
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// --- Response interceptor: refresh + retry on 401 -----------------------------
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        const isUnauthorized = error.response?.status === 401;
        const isRefreshCall = original?.url?.includes('/token');

        if (isUnauthorized && original && !original._retry && !isRefreshCall) {
            original._retry = true;
            const token = await refreshAccessToken();
            if (token) {
                original.headers.Authorization = `Bearer ${token}`;
                return apiClient(original);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
