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
        <div className={`empty-state ${className}`}>
            <div className="empty-state__content">
                <div className="empty-state__icon">
                    {icon}
                </div>
                <h2 className="empty-state__title">{title}</h2>
                <p className="empty-state__description">{description}</p>

                {(primaryAction || secondaryAction) && (
                    <div className="empty-state__actions">
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
