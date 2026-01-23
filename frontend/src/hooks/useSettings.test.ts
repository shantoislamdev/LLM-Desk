import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSettings } from './useSettings';
import * as WailsApp from '../../wailsjs/go/main/App';

// Mock the Wails bindings
vi.mock('../../wailsjs/go/main/App', () => ({
    GetTheme: vi.fn(),
    SetTheme: vi.fn(),
    GetCrashReporting: vi.fn(),
    SetCrashReporting: vi.fn(),
    CheckForUpdates: vi.fn(),
    GetFollowSystemTheme: vi.fn(),
    SetFollowSystemTheme: vi.fn(),
}));

describe('useSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (WailsApp.GetTheme as any).mockResolvedValue('dark');
        (WailsApp.GetCrashReporting as any).mockResolvedValue(true);
        (WailsApp.GetFollowSystemTheme as any).mockResolvedValue(false);
    });

    it('should initialize with values from the backend', async () => {
        const { result } = renderHook(() => useSettings());

        // Wait for initial load
        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.theme).toBe('dark');
        expect(result.current.crashReporting).toBe(true);
        expect(WailsApp.GetTheme).toHaveBeenCalled();
        expect(WailsApp.GetCrashReporting).toHaveBeenCalled();
    });

    it('should toggle theme correctly', async () => {
        const { result } = renderHook(() => useSettings());

        await act(async () => {
            await Promise.resolve();
        });

        await act(async () => {
            await result.current.toggleTheme();
        });

        expect(result.current.theme).toBe('light');
        expect(WailsApp.SetTheme).toHaveBeenCalledWith('light');
    });

    it('should toggle crash reporting correctly', async () => {
        const { result } = renderHook(() => useSettings());

        await act(async () => {
            await Promise.resolve();
        });

        await act(async () => {
            await result.current.toggleCrashReporting();
        });

        expect(result.current.crashReporting).toBe(false);
        expect(WailsApp.SetCrashReporting).toHaveBeenCalledWith(false);
    });

    it('should check for updates', async () => {
        const mockUpdate = { available: true, version: 'v1.1.0' };
        (WailsApp.CheckForUpdates as any).mockResolvedValue(mockUpdate);

        const { result } = renderHook(() => useSettings());

        let info;
        await act(async () => {
            info = await result.current.checkForUpdates();
        });

        expect(info).toEqual(mockUpdate);
        expect(result.current.updateInfo).toEqual(mockUpdate);
        expect(WailsApp.CheckForUpdates).toHaveBeenCalled();
    });
});
