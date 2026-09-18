let store: any = null;

export const injectStoreToFetch = (_store: any) => {
    store = _store;
};

const fetchJWT = async (url: string, options: RequestInit = {}) => {
    if (!store) {
        return fetch(url, options);
    }

    const state = store.getState();
    const { expire, accessToken } = (state as any).auth;

    let currentToken = accessToken;
    const now = new Date().getTime();

    // 1. Cek apakah token sudah expired
    if (expire * 1000 < now) {
        // Import dynamic untuk menghindari circular dependency
        const { refreshToken } = await import("@/store/authSlice");
        const res: any = await store.dispatch(refreshToken());

        if (res.payload?.accessToken) {
            currentToken = res.payload.accessToken;
        }
    }

    // 2. Gabungkan headers
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${currentToken}`);

    // 3. Jalankan fetch dengan headers baru
    return fetch(url, {
        ...options,
        headers: headers
    });
};

export default fetchJWT;