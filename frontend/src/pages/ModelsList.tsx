import React, { useState, useMemo } from 'react';
import { Snackbar } from 'minisnackbar';
import { Search, Cpu, Copy, Check, Box, Download } from 'lucide-react';
import { Card, Badge, EmptyState } from '@/components/ui';
import { Provider } from '@/types';

interface ModelsListProps {
    providers: Provider[];
    onNavigateToSettings?: () => void;
    onNavigateToProviders?: () => void;
}

export const ModelsList: React.FC<ModelsListProps> = ({
    providers,
    onNavigateToSettings,
    onNavigateToProviders
}) => {
    const [filter, setFilter] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = async (id: string) => {
        try {
            await navigator.clipboard.writeText(id);
            setCopiedId(id);
            Snackbar.add('Model ID copied to clipboard');
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            Snackbar.add('Failed to copy');
        }
    };

    const allModels = useMemo(() => {
        return providers.flatMap(p =>
            p.models.map(m => ({
                ...m,
                providerName: p.name,
                providerId: p.id
            }))
        );
    }, [providers]);

    const filtered = useMemo(() => {
        const query = filter.toLowerCase();
        return allModels.filter(m =>
            m.name.toLowerCase().includes(query) ||
            m.providerName.toLowerCase().includes(query) ||
            m.id.toLowerCase().includes(query)
        );
    }, [allModels, filter]);

    // Empty state - no providers at all
    if (providers.length === 0) {
        return (
            <div className="animate-fade-in u-pb-mobile">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">All Models</h1>
                        <p className="page-subtitle">A unified catalog of large language models.</p>
                    </div>
                </div>

                <EmptyState
                    icon={<Box size={32} />}
                    title="No models available"
                    description="Import a configuration file or add providers to see available models here."
                    primaryAction={onNavigateToSettings ? {
                        label: 'Import Config',
                        onClick: onNavigateToSettings,
                        icon: <Download size={16} />
                    } : undefined}
                    secondaryAction={onNavigateToProviders ? {
                        label: 'Add Provider',
                        onClick: onNavigateToProviders
                    } : undefined}
                />
            </div>
        );
    }

    return (
        <div className="animate-fade-in u-pb-mobile">
            <div className="page-header">
                <div>
                    <h1 className="page-title">All Models</h1>
                    <p className="page-subtitle">A unified catalog of {allModels.length} large language models.</p>
                </div>
                <div className="input-wrapper">
                    <Search className="input-wrapper__icon" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name, provider, or ID..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="input search-input"
                    />
                </div>
            </div>

            <div className="grid--models">
                {filtered.map((model) => (
                    <Card key={`${model.providerId}-${model.id}`} className="model-card">
                        <div className="model-card__header">
                            <div>
                                <span className="model-card__provider">{model.providerName}</span>
                                <h3 className="model-card__name">{model.name}</h3>
                            </div>
                            <div className="model-card__icon">
                                <Cpu size={14} />
                            </div>
                        </div>

                        <div className="model-card__body">
                            <div className="model-card__badges">
                                <Badge variant="outline">{Math.round(model.context.maxInput / 1000)}k Context</Badge>
                                {model.modalities.map(m => (
                                    <Badge key={m} variant="default">{m}</Badge>
                                ))}
                            </div>

                            <div className="model-card__pricing">
                                <div>
                                    <span className="model-card__price-label">Input / 1M</span>
                                    <span className="model-card__price-value">
                                        {model.pricing.input === 0 ? "Free" : `$${model.pricing.input}`}
                                    </span>
                                </div>
                                <div>
                                    <span className="model-card__price-label">Output / 1M</span>
                                    <span className="model-card__price-value">
                                        {model.pricing.output === 0 ? "Free" : `$${model.pricing.output}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="model-card__footer">
                            <span className="model-card__id">{model.id}</span>
                            <button
                                className="model-card__copy-btn"
                                onClick={() => handleCopy(model.id)}
                            >
                                {copiedId === model.id ? (
                                    <>Copied <Check size={12} /></>
                                ) : (
                                    <>Copy ID <Copy size={12} /></>
                                )}
                            </button>
                        </div>
                    </Card>
                ))}
                {filtered.length === 0 && allModels.length > 0 && (
                    <div className="empty-state">
                        <div className="empty-state__icon">
                            <Search size={24} />
                        </div>
                        <p className="empty-state__text">No models found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
