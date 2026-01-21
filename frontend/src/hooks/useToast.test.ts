import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useToast } from './useToast';

describe('useToast', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it('should initialize with an empty array of toasts', () => {
        const { result } = renderHook(() => useToast());
        expect(result.current.toasts).toEqual([]);
    });

    it('should add a success toast', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            result.current.success('Operation successful');
        });

        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0]).toMatchObject({
            type: 'success',
            message: 'Operation successful',
        });
    });

    it('should add an error toast', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            result.current.error('Operation failed');
        });

        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0].type).toBe('error');
    });

    it('should remove a toast by id', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            result.current.info('Hello');
        });

        const id = result.current.toasts[0].id;

        act(() => {
            result.current.removeToast(id);
        });

        expect(result.current.toasts).toHaveLength(0);
    });

    it('should automatically remove a toast after duration', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            result.current.success('Auto remove', 1000);
        });

        expect(result.current.toasts).toHaveLength(1);

        act(() => {
            vi.advanceTimersByTime(1001);
        });

        expect(result.current.toasts).toHaveLength(0);
    });

    it('should support multiple toasts', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            result.current.info('Toast 1');
            result.current.info('Toast 2');
        });

        expect(result.current.toasts).toHaveLength(2);
    });
});
