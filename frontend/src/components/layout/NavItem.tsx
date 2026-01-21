import React from 'react';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
    >
        <span className="nav-item__icon">{icon}</span>
        <span className="nav-item__label">{label}</span>
    </button>
);

interface MobileNavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

export const MobileNavItem: React.FC<MobileNavItemProps> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`mobile-nav-item ${isActive ? 'mobile-nav-item--active' : ''}`}
    >
        <div className="mobile-nav-item__icon">
            {icon}
        </div>
        <span className="mobile-nav-item__label">{label}</span>
    </button>
);
