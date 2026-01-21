import { useState, useEffect } from 'react';
import { GetTheme, SetTheme } from '../../wailsjs/go/main/App';

export function useTheme() {
    const [theme, setThemeState] = useState<string>('dark');
    const [isLoading, setIsLoading] = useState(true);

    // Load theme from Go backend on mount
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await GetTheme();
                setThemeState(savedTheme || 'dark');
            } catch (e) {
                console.error('Failed to load theme:', e);
                setThemeState('dark');
            } finally {
                setIsLoading(false);
            }
        };
        loadTheme();
    }, []);

    // Apply theme to document when it changes
    useEffect(() => {
        if (!isLoading) {
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(theme);
        }
    }, [theme, isLoading]);

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(newTheme);

        try {
            await SetTheme(newTheme);
        } catch (e) {
            console.error('Failed to save theme:', e);
        }
    };

    return { theme, toggleTheme, isLoading };
}
