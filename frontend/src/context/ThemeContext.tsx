import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: (event?: React.MouseEvent<any>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme') as Theme;
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const applyTheme = useCallback((nextTheme: Theme) => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(nextTheme);
        localStorage.setItem('theme', nextTheme);
    }, []);

    useEffect(() => {
        applyTheme(theme);
    }, [theme, applyTheme]);

    const toggleTheme = useCallback((event?: React.MouseEvent<any>) => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);

        const doc = document as Document & {
            startViewTransition?: (callback: () => void) => { ready: Promise<void> };
        };

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!doc.startViewTransition || reducedMotion) {
            applyTheme(next);
            return;
        }

        const x = event?.clientX ?? window.innerWidth / 2;
        const y = event?.clientY ?? window.innerHeight / 2;
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const transition = doc.startViewTransition(() => {
            applyTheme(next);
        });

        transition.ready.then(() => {
            document.documentElement.animate(
                { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
                {
                    duration: 500,
                    easing: 'ease-in-out',
                    pseudoElement: '::view-transition-new(root)',
                }
            );
        }).catch(() => undefined);
    }, [theme, applyTheme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
