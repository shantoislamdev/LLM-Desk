import React from 'react';
import {
    LayoutDashboard,
    Server,
    Cpu,
    Settings as SettingsIcon
} from 'lucide-react';
import { NavItem } from './NavItem';
import { Provider, ViewState } from '@/types';

interface SidebarProps {
    view: ViewState;
    providers: Provider[];
    selectedProvider: Provider | null;
    onNavigate: (target: ViewState) => void;
    onProviderSelect: (provider: Provider) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    view,
    providers,
    selectedProvider,
    onNavigate,
    onProviderSelect
}) => {
    return (
        <aside className="sidebar">
            <nav className="sidebar__nav">
                <NavItem
                    icon={<LayoutDashboard size={20} />}
                    label="Dashboard"
                    isActive={view === 'dashboard'}
                    onClick={() => onNavigate('dashboard')}
                />
                <NavItem
                    icon={<Server size={20} />}
                    label="Providers"
                    isActive={view === 'providers' || view === 'provider-detail'}
                    onClick={() => onNavigate('providers')}
                />
                <NavItem
                    icon={<Cpu size={20} />}
                    label="Models"
                    isActive={view === 'models'}
                    onClick={() => onNavigate('models')}
                />
                <div className="sidebar__section">
                    <p className="sidebar__section-title">Library</p>
                    {providers.slice(0, 5).map(p => (
                        <button
                            key={p.id}
                            onClick={() => onProviderSelect(p)}
                            className={`sidebar__link ${selectedProvider?.id === p.id ? 'sidebar__link--active' : ''}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            </nav>

            <div className="sidebar__footer">
                <NavItem
                    icon={<SettingsIcon size={20} />}
                    label="Settings"
                    isActive={view === 'settings'}
                    onClick={() => onNavigate('settings')}
                />
            </div>
        </aside>
    );
};
