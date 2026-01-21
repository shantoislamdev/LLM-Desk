import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastContainer } from './Toast';
import { Toast } from '@/hooks/useToast';
import React from 'react';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ToastContainer', () => {
    it('should render a list of toasts', () => {
        const testToasts: Toast[] = [
            { id: '1', type: 'success', message: 'Success message' },
            { id: '2', type: 'error', message: 'Error message' },
        ];
        const onRemove = vi.fn();

        render(<ToastContainer toasts={testToasts} onRemove={onRemove} />);

        expect(screen.getByText('Success message')).toBeDefined();
        expect(screen.getByText('Error message')).toBeDefined();
    });

    it('should call onRemove when the dismiss button is clicked', () => {
        const testToasts: Toast[] = [
            { id: '1', type: 'info', message: 'Click me' },
        ];
        const onRemove = vi.fn();

        render(<ToastContainer toasts={testToasts} onRemove={onRemove} />);

        const closeButton = screen.getByLabelText('Dismiss');
        fireEvent.click(closeButton);

        expect(onRemove).toHaveBeenCalledWith('1');
    });

    it('should apply the correct CSS class based on toast type', () => {
        const testToasts: Toast[] = [
            { id: '1', type: 'warning', message: 'Warning' },
        ];
        const onRemove = vi.fn();

        const { container } = render(<ToastContainer toasts={testToasts} onRemove={onRemove} />);

        const toastElement = container.querySelector('.toast--warning');
        expect(toastElement).toBeDefined();
    });
});
