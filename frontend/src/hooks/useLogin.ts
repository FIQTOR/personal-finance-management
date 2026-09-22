/**
 * useLogin — encapsulates the sign-in form logic.
 *
 * Handles local validation, calling the API, refreshing the auth state and
 * navigating to the original destination. Keeps the page component thin.
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { refreshToken } from '@/store/authSlice';
import authApi from '@/services/authApi';
import type { ApiResponse } from '@/types';

interface FieldErrors {
    email: string;
    password: string;
    general: string;
}

const EMPTY_ERRORS: FieldErrors = { email: '', password: '', general: '' };

export const useLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>(EMPTY_ERRORS);
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<ApiResponse | null>(null);

    const redirectTarget =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/panel/dashboard';

    const validate = (): boolean => {
        const next = { ...EMPTY_ERRORS };
        let valid = true;
        if (!email) {
            next.email = 'Email is required.';
            valid = false;
        }
        if (!password) {
            next.password = 'Password is required.';
            valid = false;
        }
        setErrors(next);
        return valid;
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors(EMPTY_ERRORS);
        setResponse(null);
        if (!validate()) return;

        try {
            setIsLoading(true);
            await authApi.login({ email, password, remember_me: rememberMe });
            const result = await dispatch(refreshToken());

            if (refreshToken.fulfilled.match(result)) {
                navigate(redirectTarget, { replace: true });
            } else {
                throw new Error('Failed to update auth state');
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: ApiResponse } };
            setResponse(
                err.response?.data || ({ success: false, message: 'Login failed. Please try again.' } as ApiResponse)
            );
            setIsLoading(false);
        }
    };

    const signInWithGoogle = () => {
        window.location.href = authApi.googleAuthUrl(redirectTarget);
    };

    return {
        email, setEmail,
        password, setPassword,
        rememberMe, setRememberMe,
        errors, response, setResponse, isLoading,
        submit, signInWithGoogle,
    };
};
