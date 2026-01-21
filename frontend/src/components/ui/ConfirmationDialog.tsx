import React from 'react';
import { Modal } from './Modal';

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string | null;
    isDangerous?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <div className="flex justify-end gap-3">
                    {cancelText && (
                        <button
                            onClick={onClose}
                            className="btn btn--secondary"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`btn ${isDangerous ? 'btn--danger' : 'btn--primary'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            }
        >
            <p className="text-gray-600 dark:text-gray-300">
                {message}
            </p>
        </Modal>
    );
};
