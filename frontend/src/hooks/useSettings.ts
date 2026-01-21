import { useState, useEffect, useCallback } from 'react';
import { GetTheme, SetTheme, GetCrashReporting, SetCrashReporting, CheckForUpdates } from '../../wailsjs/go/main/App';
import { updater } from '../../wailsjs/go/models';

export function useSettings() {
    const [theme, setThemeState] = useState<string>('dark');
    const [crashReporting, setCrashReportingState] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState(true);
    const [updateInfo, setUpdateInfo] = useState<updater.UpdateInfo | null>(null);

    // Load settings from Go backend on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const [savedTheme, savedCrashReporting] = await Promise.all([
                    GetTheme(),
                    GetCrashReporting()
                ]);
                setThemeState(savedTheme || 'dark');
                setCrashReportingState(savedCrashReporting !== false); // Default to true
            } catch (e) {
                console.error('Failed to load settings:', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    // Apply theme to document when it changes
    useEffect(() => {
        if (!isLoading) {
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(theme);
        }
    }, [theme, isLoading]);

    const toggleTheme = useCallback(async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(newTheme);
        try {
            await SetTheme(newTheme);
        } catch (e) {
            console.error('Failed to save theme:', e);
        }
    }, [theme]);

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
        crashReporting,
        toggleCrashReporting,
        isLoading,
        updateInfo,
        checkForUpdates
    };
}
