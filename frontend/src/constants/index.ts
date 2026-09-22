/**
 * Application-wide constants.
 */

/** Base API URL resolved from Vite env vars (falls back to dev URL). */
export const BASE_API_URL = import.meta.env.VITE_NODE_ENV !== 'production'
    ? (import.meta.env.VITE_DEV_API_URL as string)
    : (import.meta.env.VITE_API_URL as string);

export const APP_NAME = 'Personal Finance';
export const TITLE_SUFFIX = `| ${APP_NAME}`;

/** Refresh the access token this many ms before it actually expires. */
export const TOKEN_REFRESH_SKEW_MS = 10_000;
