import React from 'react';
import {
    LayoutDashboard,
    Server,
    Cpu,
    Settings as SettingsIcon
} from 'lucide-react';
import { MobileNavItem } from './NavItem';
import { ViewState } from '@/types';

interface MobileNavProps {
    view: ViewState;
    onNavigate: (target: ViewState) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ view, onNavigate }) => {
    return (
        <div className="mobile-nav">
            <div className="mobile-nav__inner">
                <MobileNavItem
                    icon={<LayoutDashboard size={20} />}
                    label="Home"
                    isActive={view === 'dashboard'}
                    onClick={() => onNavigate('dashboard')}
                />
                <MobileNavItem
                    icon={<Server size={20} />}
                    label="Providers"
                    isActive={view === 'providers' || view === 'provider-detail'}
                    onClick={() => onNavigate('providers')}
                />
                <MobileNavItem
                    icon={<Cpu size={20} />}
                    label="Models"
                    isActive={view === 'models'}
                    onClick={() => onNavigate('models')}
                />
                <MobileNavItem
                    icon={<SettingsIcon size={20} />}
                    label="Settings"
                    isActive={view === 'settings'}
                    onClick={() => onNavigate('settings')}
                />
            </div>
        </div>
    );
};
