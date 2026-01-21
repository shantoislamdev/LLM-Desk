import { useState, useEffect, useCallback } from 'react';
import { GetTheme, SetTheme, GetFollowSystemTheme, SetFollowSystemTheme, GetCrashReporting, SetCrashReporting, CheckForUpdates } from '../../wailsjs/go/main/App';
import { updater } from '../../wailsjs/go/models';

export function useSettings() {
    const [theme, setThemeState] = useState<string>('dark');
    const [followSystem, setFollowSystemState] = useState<boolean>(true);
    const [crashReporting, setCrashReportingState] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState(true);
    const [updateInfo, setUpdateInfo] = useState<updater.UpdateInfo | null>(null);

    // Load settings from Go backend on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const [savedTheme, savedFollowSystem, savedCrashReporting] = await Promise.all([
                    GetTheme(),
                    GetFollowSystemTheme(),
                    GetCrashReporting()
                ]);
                setThemeState(savedTheme || 'dark');
                setFollowSystemState(savedFollowSystem);
                setCrashReportingState(savedCrashReporting !== false);
            } catch (e) {
                console.error('Failed to load settings:', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    // Handle system theme changes
    useEffect(() => {
        if (!followSystem) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
            const systemTheme = e.matches ? 'dark' : 'light';
            if (theme !== systemTheme) {
                setThemeState(systemTheme);
                // We don't save this to backend as "theme" preference, 
                // just update local state for the UI
            }
        };

        // Initial check
        handleChange(mediaQuery);

        // Listener
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [followSystem, theme]);

    // Apply theme to document when it changes
    useEffect(() => {
        if (!isLoading) {
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(theme);
        }
    }, [theme, isLoading]);

    const toggleTheme = useCallback(async () => {
        if (followSystem) return; // Disable manual toggle if following system

        const newTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(newTheme);
        try {
            await SetTheme(newTheme);
        } catch (e) {
            console.error('Failed to save theme:', e);
        }
    }, [theme, followSystem]);

    const toggleFollowSystem = useCallback(async () => {
        const newValue = !followSystem;
        setFollowSystemState(newValue);

        // If enabling, immediately apply system theme
        if (newValue) {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const newTheme = isDark ? 'dark' : 'light';
            setThemeState(newTheme);
            // We might want to save the "calculated" theme or just leave the old preference?
            // Usually treating "followSystem" as an override is best.
        }

        try {
            await SetFollowSystemTheme(newValue);
        } catch (e) {
            console.error('Failed to save system theme preference:', e);
        }
    }, [followSystem]);

    const toggleCrashReporting = useCallback(async () => {
        const newValue = !crashReporting;
        setCrashReportingState(newValue);
        try {
            await SetCrashReporting(newValue);
        } catch (e) {
            console.error('Failed to save crash reporting setting:', e);
        }
    }, [crashReporting]);

    const checkForUpdates = useCallback(async () => {
        try {
            const info = await CheckForUpdates();
            setUpdateInfo(info);
            return info;
        } catch (e) {
            console.error('Failed to check for updates:', e);
            return null;
        }
    }, []);

    return {
        theme,
        toggleTheme,
        followSystem,
        toggleFollowSystem,
        crashReporting,
        toggleCrashReporting,
        isLoading,
        updateInfo,
        checkForUpdates
    };
}
