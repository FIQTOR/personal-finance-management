import React, { createContext, useEffect, useState, useCallback, useMemo } from 'react';
import { savePreferences } from '@/services/preferencesService';
import { debounce } from '@/utils/debounce';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    /** Toggle between light/dark. Pass a MouseEvent for a circular reveal from the cursor. */
    toggleTheme: (event?: React.MouseEvent<HTMLElement>) => void;
    /** Explicitly set the theme (bypasses the reveal animation). */
    setTheme: (theme: Theme) => void;
    /**
     * Apply a theme coming from the authenticated account (e.g. on login/refresh).
     * When `persist` is true, subsequent user changes are synced to the server.
     */
    setThemeFromAccount: (theme: Theme, persist: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export { ThemeContext };

const STORAGE_KEY = 'theme';
/** Class applied to <html> while a color transition is running (see index.css). */
const TRANSITION_CLASS = 'theme-transition';
const TRANSITION_DURATION = 300;
/** Debounce window for persisting the theme to the account. */
const PERSIST_DEBOUNCE_MS = 600;

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
        if (saved === 'light' || saved === 'dark') return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    // Whether account persistence is active (enabled once an authenticated user
    // with preferences is available; stays false for guests/offline).
    const [persistEnabled, setPersistEnabled] = useState(false);

    const applyTheme = useCallback((nextTheme: Theme) => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(nextTheme);
        root.style.colorScheme = nextTheme;
        localStorage.setItem(STORAGE_KEY, nextTheme);
    }, []);

    // Debounced, fire-and-forget persistence to the account (errors ignored).
    const persistTheme = useMemo(
        () => debounce((next: Theme) => {
            if (!persistEnabled) return;
            void savePreferences({ theme: next }).catch(() => undefined);
        }, PERSIST_DEBOUNCE_MS),
        [persistEnabled]
    );

    // Keep the DOM in sync with the current theme (also covers first paint).
    useEffect(() => {
        applyTheme(theme);
    }, [theme, applyTheme]);

    /** Extra-safe setter used by the reveal path (state already updated). */
    const setTheme = useCallback((next: Theme) => {
        setThemeState(next);
        persistTheme(next);
    }, [persistTheme]);

    const setThemeFromAccount = useCallback((next: Theme, persist: boolean) => {
        setPersistEnabled(persist);
        setThemeState(next);
    }, []);

    const toggleTheme = useCallback((event?: React.MouseEvent<HTMLElement>) => {
        const next: Theme = theme === 'light' ? 'dark' : 'light';

        const doc = document as Document & {
            startViewTransition?: (callback: () => void) => { ready: Promise<void>; finished: Promise<void> };
        };

        // Fallback: add a short CSS transition class so colors animate smoothly
        // even without the View Transitions API.
        if (!doc.startViewTransition || prefersReducedMotion()) {
            const root = window.document.documentElement;
            root.classList.add(TRANSITION_CLASS);
            window.setTimeout(() => root.classList.remove(TRANSITION_CLASS), TRANSITION_DURATION + 50);
            applyTheme(next);
            setThemeState(next);
            persistTheme(next);
            return;
        }

        const x = event?.clientX ?? window.innerWidth / 2;
        const y = event?.clientY ?? window.innerHeight / 2;
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        // Apply the DOM change synchronously inside the callback so the view
        // transition captures the "new" snapshot; state keeps React in sync.
        const transition = doc.startViewTransition(() => {
            applyTheme(next);
            setThemeState(next);
            persistTheme(next);
        });

        transition.ready
            .then(() => {
                document.documentElement.animate(
                    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
                    {
                        duration: 500,
                        easing: 'ease-in-out',
                        pseudoElement: '::view-transition-new(root)',
                    }
                );
            })
            .catch(() => undefined);
    }, [theme, applyTheme, persistTheme]);

    const value = useMemo(
        () => ({ theme, toggleTheme, setTheme, setThemeFromAccount }),
        [theme, toggleTheme, setTheme, setThemeFromAccount]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
