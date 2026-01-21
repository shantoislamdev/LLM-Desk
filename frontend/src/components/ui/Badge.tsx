import React from 'react';

interface BadgeProps {
    children?: React.ReactNode;
    variant?: 'default' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => {
    return (
        <span className={`badge badge--${variant}`}>
            {children}
        </span>
    );
};
