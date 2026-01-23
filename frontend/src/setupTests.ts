import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});

// Mock Wails runtime since it won't be available in the test environment
// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: any) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { }, // Deprecated
        removeListener: () => { }, // Deprecated
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => { },
    }),
});

if (typeof window !== 'undefined') {
    (window as any).go = {
        main: {
            App: {
                GetVersion: () => Promise.resolve('v0.0.1-test'),
            },
        },
    };
    (window as any).runtime = {
        LogInfo: () => { },
        LogError: () => { },
        BrowserOpenURL: () => { },
    };
}
