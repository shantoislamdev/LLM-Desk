import React from 'react';

interface CardProps {
    children?: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = "", onClick }) => (
    <div
        onClick={onClick}
        className={`card ${onClick ? 'card--clickable' : ''} ${className}`}
    >
        {children}
    </div>
);
