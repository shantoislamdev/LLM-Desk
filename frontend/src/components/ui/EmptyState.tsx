import React from 'react';

interface EmptyStateAction {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
}

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    primaryAction?: EmptyStateAction;
    secondaryAction?: EmptyStateAction;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    primaryAction,
    secondaryAction,
    className = ''
}) => {
    return (
        <div className={`empty-state-container ${className}`}>
            <div className="empty-state-content">
                <div className="empty-state-icon">
                    {icon}
                </div>
                <h2 className="empty-state-title">{title}</h2>
                <p className="empty-state-description">{description}</p>

                {(primaryAction || secondaryAction) && (
                    <div className="empty-state-actions">
                        {primaryAction && (
                            <button
                                onClick={primaryAction.onClick}
                                className="btn btn--primary"
                            >
                                {primaryAction.icon}
                                {primaryAction.label}
                            </button>
                        )}
                        {secondaryAction && (
                            <button
                                onClick={secondaryAction.onClick}
                                className="btn btn--secondary"
                            >
                                {secondaryAction.icon}
                                {secondaryAction.label}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
