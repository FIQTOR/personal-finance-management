import axios from 'axios';

/**
 * Extracts a human-readable message from an unknown thrown value,
 * preferring the backend `{ message }` payload on Axios errors.
 */
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        return data?.message || error.message || fallback;
    }
    if (error instanceof Error) {
        return error.message || fallback;
    }
    return fallback;
};

/**
 * Returns the backend error payload on an Axios error, or the provided fallback.
 */
export const getErrorData = <T>(error: unknown, fallback: T): T => {
    if (axios.isAxiosError(error) && error.response?.data) {
        return error.response.data as T;
    }
    return fallback;
};
