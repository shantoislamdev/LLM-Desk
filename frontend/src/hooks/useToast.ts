import { useState, useCallback, useRef, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastState {
    toasts: Toast[];
    addToast: (type: ToastType, message: string, duration?: number) => void;
    removeToast: (id: string) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

// Default durations by type (in ms)
const DEFAULT_DURATIONS: Record<ToastType, number> = {
    success: 3000,
    error: 5000,
    warning: 4000,
    info: 3000,
};

let toastIdCounter = 0;

export function useToast(): ToastState {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Clean up timers on unmount
    useEffect(() => {
        return () => {
            timersRef.current.forEach((timer) => clearTimeout(timer));
            timersRef.current.clear();
        };
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
    }, []);

    const addToast = useCallback(
        (type: ToastType, message: string, duration?: number) => {
            const id = `toast-${++toastIdCounter}`;
            const finalDuration = duration ?? DEFAULT_DURATIONS[type];

            const newToast: Toast = {
                id,
                type,
                message,
                duration: finalDuration,
            };

            setToasts((prev) => [...prev, newToast]);

            // Auto-remove after duration
            if (finalDuration > 0) {
                const timer = setTimeout(() => {
                    removeToast(id);
                }, finalDuration);
                timersRef.current.set(id, timer);
            }
        },
        [removeToast]
    );

    const success = useCallback(
        (message: string, duration?: number) => addToast('success', message, duration),
        [addToast]
    );

    const error = useCallback(
        (message: string, duration?: number) => addToast('error', message, duration),
        [addToast]
    );

    const warning = useCallback(
        (message: string, duration?: number) => addToast('warning', message, duration),
        [addToast]
    );

    const info = useCallback(
        (message: string, duration?: number) => addToast('info', message, duration),
        [addToast]
    );

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
    };
}
