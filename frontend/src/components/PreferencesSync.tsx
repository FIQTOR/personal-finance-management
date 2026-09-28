import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectAuth } from '@/store/authSlice';
import { useTheme } from '@/context/useTheme';
import { useLanguage } from '@/context/useLanguage';
import type { Language } from '@/context/LanguageContext';

const SUPPORTED_LANGUAGES: Language[] = ['en', 'id', 'zh', 'ar', 'hi'];

/**
 * Bridges the authenticated user's account preferences (Redux) into the Theme
 * and Language contexts. It is mounted *inside* both the Redux Provider and the
 * Theme/Language providers (see App.tsx), which is required because the Theme
 * and Language providers sit *outside* the Redux store and therefore cannot
 * read the store themselves.
 *
 * On login/refresh (or when the user object changes) it applies the account's
 * theme/language and enables server persistence for subsequent user changes.
 * When unauthenticated it leaves the localStorage-based behaviour untouched.
 */
const PreferencesSync = () => {
    const { user } = useAppSelector(selectAuth);
    const { theme, setThemeFromAccount } = useTheme();
    const { language, setLanguageFromAccount } = useLanguage();

    // Track the last account user we synced so we only react to real changes.
    const syncedUserIdRef = useRef<number | null>(null);

    const userId = user?.id ?? null;
    const accountTheme = user?.preferences?.theme;
    const accountLanguage = user?.preferences?.language;

    useEffect(() => {
        if (userId === null) {
            // Logged out: keep the current (localStorage-backed) values, no
            // account persistence. Reset so a re-login re-syncs.
            syncedUserIdRef.current = null;
            return;
        }

        // Only sync once per user identity to avoid clobbering local changes.
        if (syncedUserIdRef.current === userId) return;
        syncedUserIdRef.current = userId;

        // Authenticated: always enable server persistence for subsequent user
        // changes, then apply the account values when present (preferring them
        // over the localStorage fallback).
        if (accountTheme === 'light' || accountTheme === 'dark') {
            setThemeFromAccount(accountTheme, true);
        } else {
            // No account value yet: keep the current (localStorage) theme but
            // enable persistence so further changes sync to the account.
            setThemeFromAccount(theme, true);
        }
        if (accountLanguage && SUPPORTED_LANGUAGES.includes(accountLanguage as Language)) {
            setLanguageFromAccount(accountLanguage as Language, true);
        } else {
            setLanguageFromAccount(language, true);
        }
    }, [userId, accountTheme, accountLanguage, theme, language, setThemeFromAccount, setLanguageFromAccount]);

    return null;
};

export default PreferencesSync;
