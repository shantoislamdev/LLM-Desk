import React, { useMemo } from 'react';
import {
    Server,
    Activity,
    Key,
    ArrowUpRight,
    Box,
    Zap,
    Eye,
    Download,
    Plus,
    Sparkles
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Card } from '@/components/ui';
import { Provider } from '@/types';

interface DashboardProps {
    providers: Provider[];
    onNavigateToSettings?: () => void;
    onNavigateToAddProvider?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = React.memo(({
    providers,
    onNavigateToSettings,
    onNavigateToAddProvider
}) => {
    const stats = useMemo(() => {
        let totalModels = 0;
        let totalProviders = providers.length;
        let freeModels = 0;
        let capabilities = { vision: 0, tools: 0 };

        providers.forEach(p => {
            totalModels += p.models.length;
            p.models.forEach(m => {
                if (m.pricing.input === 0 && m.pricing.output === 0) freeModels++;
                if (m.modalities.includes('vision')) capabilities.vision++;
                if (p.features.toolCalling) capabilities.tools++;
            });
        });

        return { totalModels, totalProviders, freeModels, capabilities };
    }, [providers]);

    const costData = useMemo(() => {
        const allModels: { name: string, cost: number, provider: string }[] = [];
        providers.forEach(p => {
            p.models.forEach(m => {
                if (m.pricing.output > 0) {
                    allModels.push({
                        name: m.name,
                        cost: m.pricing.output,
                        provider: p.name
                    });
                }
            });
        });
        return allModels.sort((a, b) => b.cost - a.cost).slice(0, 8);
    }, [providers]);

    // Empty state - Welcome screen
    if (providers.length === 0) {
        return (
            <div className="animate-fade-in u-pb-mobile">
                <div className="welcome">
                    <div className="welcome__header">
                        <span className="welcome__badge">
                            <Sparkles size={14} />
                            Getting Started
                        </span>
                        <h1 className="welcome__title">Welcome to LLM Desk</h1>
                        <p className="welcome__subtitle">
                            Your personal dashboard for managing LLM providers and models.
                            Get started by importing your configuration or adding providers manually.
                        </p>
                    </div>

                    <div className="welcome__grid">
                        <div className="welcome-card" onClick={onNavigateToSettings}>
                            <div className="welcome-card__icon">
                                <Download size={24} />
                            </div>
                            <h3 className="welcome-card__title">Import Configuration</h3>
                            <p className="welcome-card__description">
                                Have a backup file? Import your providers and models in one click.
                            </p>
                            <ArrowUpRight size={20} className="welcome-card__arrow" />
                        </div>

                        <div className="welcome-card" onClick={onNavigateToAddProvider}>
                            <div className="welcome-card__icon">
                                <Plus size={24} />
                            </div>
                            <h3 className="welcome-card__title">Add Provider</h3>
                            <p className="welcome-card__description">
                                Manually configure a new LLM provider with your API credentials.
                            </p>
                            <ArrowUpRight size={20} className="welcome-card__arrow" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in u-pb-mobile">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Overview</h1>
                    <p className="page-subtitle">Your personal AI infrastructure at a glance.</p>
                </div>
                <div>
                    <button className="btn btn--primary" onClick={onNavigateToSettings}>Export Config</button>
                </div>
            </div>

            <div className="grid--cols-4 u-mb-6">
                <Card className="stat-card">
                    <div className="stat-card__header">
                        <Box size={16} />
                        <span className="stat-card__label">Total Models</span>
                    </div>
                    <p className="stat-card__value">{stats.totalModels}</p>
                </Card>
                <Card className="stat-card">
                    <div className="stat-card__header">
                        <Server size={16} />
                        <span className="stat-card__label">Providers</span>
                    </div>
                    <p className="stat-card__value">{stats.totalProviders}</p>
                </Card>
                <Card className="stat-card stat-card--accent">
                    <div className="stat-card__header">
                        <Zap size={16} />
                        <span className="stat-card__label">Free Tier</span>
                    </div>
                    <p className="stat-card__value">{stats.freeModels}</p>
                </Card>
                <Card className="stat-card">
                    <div className="stat-card__header">
                        <Eye size={16} />
                        <span className="stat-card__label">Vision Capable</span>
                    </div>
                    <p className="stat-card__value">{stats.capabilities.vision}</p>
                </Card>
            </div>

            <div className="dashboard-grid">
                <Card className="dashboard-grid__chart">
                    <h3 className="chart-title">Output Cost per Million Tokens ($)</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <BarChart data={costData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="u-text-muted" opacity={0.5} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12, fill: 'currentColor' }} className="u-text-secondary" />
                                <Tooltip
                                    cursor={{ fill: 'currentColor', opacity: 0.1 }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        backgroundColor: 'var(--color-surface)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                    itemStyle={{ color: 'inherit' }}
                                />
                                <Bar dataKey="cost" radius={[0, 4, 4, 0]} barSize={24}>
                                    {costData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index < 3 ? '#D9795F' : '#a8a29e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="dashboard-grid__aside">
                    <div className="quick-actions__bg"></div>
                    <h3 className="quick-actions__title">Quick Actions</h3>
                    <div className="quick-actions__list">
                        <button className="quick-action-btn">
                            <div className="quick-action-btn__content">
                                <div className="quick-action-btn__icon">
                                    <Key size={16} />
                                </div>
                                <span className="quick-action-btn__text">Rotate API Keys</span>
                            </div>
                            <ArrowUpRight size={16} className="quick-action-btn__arrow" />
                        </button>
                        <button className="quick-action-btn">
                            <div className="quick-action-btn__content">
                                <div className="quick-action-btn__icon">
                                    <Activity size={16} />
                                </div>
                                <span className="quick-action-btn__text">Check Latency</span>
                            </div>
                            <ArrowUpRight size={16} className="quick-action-btn__arrow" />
                        </button>
                        <div className="quick-actions__quote">
                            <p className="quick-actions__quote-text">"Efficiency is doing things right; effectiveness is doing the right things."</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
});
