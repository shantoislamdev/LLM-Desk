import React from 'react';
import { ChevronRight, Plus, Server, Download } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui';
import { Provider } from '@/types';

interface ProvidersListProps {
    providers: Provider[];
    onSelect: (provider: Provider) => void;
    onAddProvider: () => void;
    onNavigateToSettings?: () => void;
}

export const ProvidersList: React.FC<ProvidersListProps> = React.memo(({
    providers,
    onSelect,
    onAddProvider,
    onNavigateToSettings
}) => {
    // Empty state
    if (providers.length === 0) {
        return (
            <div className="animate-fade-in pb-mobile">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Providers</h1>
                        <p className="page-subtitle">Manage your API connections.</p>
                    </div>
                    <button
                        onClick={onAddProvider}
                        className="btn btn--primary"
                    >
                        <Plus size={16} />
                        Add Provider
                    </button>
                </div>

                <EmptyState
                    icon={<Server size={32} />}
                    title="No providers yet"
                    description="Add your first LLM provider to get started, or import a configuration file with your existing setup."
                    primaryAction={{
                        label: 'Add Provider',
                        onClick: onAddProvider,
                        icon: <Plus size={16} />
                    }}
                    secondaryAction={onNavigateToSettings ? {
                        label: 'Import Config',
                        onClick: onNavigateToSettings,
                        icon: <Download size={16} />
                    } : undefined}
                />
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-mobile">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Providers</h1>
                    <p className="page-subtitle">Manage your API connections.</p>
                </div>
                <button
                    onClick={onAddProvider}
                    className="btn btn--primary"
                >
                    <Plus size={16} />
                    Add Provider
                </button>
            </div>

            <div className="grid-3">
                {providers.map((provider) => {
                    const hasVision = provider.models.some(m => m.modalities.includes('vision'));

                    return (
                        <Card
                            key={provider.id}
                            className="provider-card"
                            onClick={() => onSelect(provider)}
                        >
                            <div className="provider-card__header">
                                <div className="provider-card__avatar">
                                    {provider.name.charAt(0)}
                                </div>
                                <div className={`provider-card__status ${provider.credentials.apiKeys.length > 0 ? 'provider-card__status--active' : 'provider-card__status--inactive'}`}>
                                    {provider.credentials.apiKeys.length > 0 ? 'ACTIVE' : 'NO KEY'}
                                </div>
                            </div>

                            <div className="provider-card__body">
                                <h3 className="provider-card__name">{provider.name}</h3>
                                <p className="provider-card__url">{provider.endpoints.openai}</p>
                            </div>

                            <div className="provider-card__pills">
                                {provider.features.streaming && (
                                    <span className="provider-card__pill">Stream</span>
                                )}
                                {provider.features.toolCalling && (
                                    <span className="provider-card__pill">Tools</span>
                                )}
                                {hasVision && (
                                    <span className="provider-card__pill">Vision</span>
                                )}
                            </div>

                            <div className="provider-card__footer">
                                <span className="provider-card__model-count">{provider.models.length} Models</span>
                                <ChevronRight size={16} className="provider-card__arrow" />
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
});
