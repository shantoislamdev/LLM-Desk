import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTheme } from './useTheme';
import * as WailsApp from '../../wailsjs/go/main/App';

// Mock the Wails bindings
vi.mock('../../wailsjs/go/main/App', () => ({
    GetTheme: vi.fn(),
    SetTheme: vi.fn(),
}));

describe('useTheme', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock implementation
        (WailsApp.GetTheme as any).mockResolvedValue('dark');
        (WailsApp.SetTheme as any).mockResolvedValue(undefined);

        // Mock document.documentElement.classList
        document.documentElement.className = '';
    });

    it('should initialize with dark theme by default and load from backend', async () => {
        (WailsApp.GetTheme as any).mockResolvedValue('light');

        const { result } = renderHook(() => useTheme());

        // Initially loading
        expect(result.current.isLoading).toBe(true);

        // Wait for effect to run
        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.theme).toBe('light');
        expect(result.current.isLoading).toBe(false);
        expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('should toggle theme correctly', async () => {
        const { result } = renderHook(() => useTheme());

        // Wait for initial load
        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.theme).toBe('dark');

        await act(async () => {
            await result.current.toggleTheme();
        });

        expect(result.current.theme).toBe('light');
        expect(WailsApp.SetTheme).toHaveBeenCalledWith('light');
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should fallback to dark if GetTheme fails', async () => {
        (WailsApp.GetTheme as any).mockRejectedValue(new Error('Backend error'));

        const { result } = renderHook(() => useTheme());

        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.theme).toBe('dark');
        expect(result.current.isLoading).toBe(false);
    });
});
