// utils/axiosJWT.ts
import axios from "axios";

let store: any = null;

const axiosJWT = axios.create({ withCredentials: true });

// Function to inject store instance
export const injectStore = (_store: any) => {
    store = _store;
};

axiosJWT.interceptors.request.use(async (config) => {
    if (!store) {
        return config;
    }

    const state = store.getState();
    const authState = (state as any).auth;
    const { expire, accessToken } = authState;

    const now = new Date().getTime();
    if (expire * 1000 < now) {
        // Import dynamically to avoid circular dependency
        const { refreshToken } = await import("@/store/authSlice");
        const res: any = await store.dispatch(refreshToken());
        if (res.payload?.accessToken) {
            config.headers.Authorization = `Bearer ${res.payload.accessToken}`;
        }
    } else {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

export default axiosJWT;
