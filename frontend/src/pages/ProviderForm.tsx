import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { FormInput, Toggle } from '@/components/ui';
import { Provider, Model, ProviderFeatures, Limit, FetchedModel } from '@/types';
import { fetchModels, transformFetchedModel } from '@/utils/modelFetcher';

interface ProviderFormProps {
    provider?: Provider;
    onBack: () => void;
    onSubmit: (provider: Partial<Provider> & { name: string }) => void;
}

const defaultFeatures: ProviderFeatures = {
    streaming: true,
    toolCalling: false,
    jsonMode: false
};

const defaultLimit: Limit = {
    type: 'requests',
    limit: 60,
    window: 60
};

export const ProviderForm: React.FC<ProviderFormProps> = ({
    provider,
    onBack,
    onSubmit
}) => {
    const isEditing = !!provider;

    // Form state
    const [name, setName] = useState('');
    const [openaiUrl, setOpenaiUrl] = useState('');
    const [anthropicUrl, setAnthropicUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [features, setFeatures] = useState<ProviderFeatures>(defaultFeatures);
    const [limits, setLimits] = useState<Limit[]>([]);
    const [models, setModels] = useState<Model[]>([]);

    // Fetch state
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [fetchedModels, setFetchedModels] = useState<FetchedModel[]>([]);

    // Validation
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Initialize form when provider changes
    useEffect(() => {
        if (provider) {
            setName(provider.name);
            setOpenaiUrl(provider.endpoints.openai);
            setAnthropicUrl(provider.endpoints.anthropic || '');
            setApiKey(provider.credentials.apiKeys?.[0] || '');
            setFeatures(provider.features);
            setLimits(provider.limits || []);
            setModels(provider.models || []);
        } else {
            setName('');
            setOpenaiUrl('');
            setAnthropicUrl('');
            setApiKey('');
            setFeatures(defaultFeatures);
            setLimits([]);
            setModels([]);
        }
        setFetchedModels([]);
        setFetchError(null);
        setErrors({});
    }, [provider]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = 'Provider name is required';
        }

        if (!openaiUrl.trim()) {
            newErrors.openaiUrl = 'OpenAI URL is required';
        } else {
            try {
                new URL(openaiUrl);
            } catch {
                newErrors.openaiUrl = 'Please enter a valid URL';
            }
        }

        if (anthropicUrl.trim()) {
            try {
                new URL(anthropicUrl);
            } catch {
                newErrors.anthropicUrl = 'Please enter a valid URL';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFetchModels = async () => {
        if (!openaiUrl || !apiKey) {
            setFetchError('Please provide both OpenAI URL and API Key to fetch models');
            return;
        }

        setIsFetching(true);
        setFetchError(null);

        try {
            const result = await fetchModels({
                baseUrl: openaiUrl.replace(/\/$/, ''),
                apiKey,
                anthropicUrl: anthropicUrl ? anthropicUrl.replace(/\/$/, '') : undefined
            });

            if (result.error) {
                setFetchError(result.error);
            } else if (result.models.length === 0) {
                setFetchError('No models found at the specified endpoint');
            } else {
                setFetchedModels(result.models);
            }
        } catch (error) {
            setFetchError('Failed to fetch models. Please check your credentials and try again.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleAddFetchedModel = (fetchedModel: FetchedModel) => {
        const model = transformFetchedModel(fetchedModel);
        if (!models.some(m => m.id === model.id)) {
            setModels([...models, model]);
        }
        setFetchedModels(fetchedModels.filter(m => m.id !== fetchedModel.id));
    };

    const handleAddAllFetchedModels = () => {
        const newModels = fetchedModels
            .filter(fm => !models.some(m => m.id === fm.id))
            .map(transformFetchedModel);
        setModels([...models, ...newModels]);
        setFetchedModels([]);
    };

    const handleRemoveModel = (modelId: string) => {
        setModels(models.filter(m => m.id !== modelId));
    };

    const handleAddLimit = () => {
        setLimits([...limits, { ...defaultLimit }]);
    };

    const handleRemoveLimit = (index: number) => {
        setLimits(limits.filter((_, i) => i !== index));
    };

    const handleUpdateLimit = (index: number, field: keyof Limit, value: string | number) => {
        const updated = [...limits];
        updated[index] = { ...updated[index], [field]: value } as Limit;
        setLimits(updated);
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const providerData: Partial<Provider> & { name: string } = {
            name: name.trim(),
            enabled: true,
            endpoints: {
                openai: openaiUrl.trim().replace(/\/$/, ''),
                anthropic: anthropicUrl.trim() ? anthropicUrl.trim().replace(/\/$/, '') : null
            },
            credentials: {
                apiKeys: apiKey ? [apiKey] : []
            },
            features,
            limits,
            models
        };

        onSubmit(providerData);
    };

    const featureLabels: Record<keyof ProviderFeatures, string> = {
        streaming: 'Streaming',
        toolCalling: 'Tool Calling',
        jsonMode: 'JSON Mode'
    };

    return (
        <div className="form-page animate-fade-in u-pb-mobile">
            <button onClick={onBack} className="form-page__back-btn">
                <ChevronRight className="form-page__back-icon" size={16} />
                Back to {isEditing ? provider?.name : 'Providers'}
            </button>

            <div className="form-page__container">
                <div className="form-page__header">
                    <h1 className="page-title">{isEditing ? 'Edit Provider' : 'Add New Provider'}</h1>
                    <p className="page-subtitle">Configure provider settings, features, and models.</p>
                </div>

                <div className="form-page__content">
                    {/* Basic Info */}
                    <div className="form-section">
                        <h4 className="form-section__title">Basic Information</h4>
                        <FormInput
                            label="Provider Name"
                            name="name"
                            value={name}
                            onChange={setName}
                            placeholder="e.g., OpenAI, Anthropic, Custom Provider"
                            required
                            error={errors.name}
                        />

                        <div className="form-row">
                            <FormInput
                                label="OpenAI-compatible URL"
                                name="openaiUrl"
                                value={openaiUrl}
                                onChange={setOpenaiUrl}
                                type="url"
                                placeholder="https://api.example.com/v1"
                                required
                                error={errors.openaiUrl}
                                helperText="OpenAI-compatible endpoint"
                            />
                            <FormInput
                                label="Anthropic URL (Optional)"
                                name="anthropicUrl"
                                value={anthropicUrl}
                                onChange={setAnthropicUrl}
                                type="url"
                                placeholder="https://api.example.com/anthropic"
                                error={errors.anthropicUrl}
                                helperText="For Anthropic-style requests"
                            />
                        </div>

                        <FormInput
                            label="API Key"
                            name="apiKey"
                            value={apiKey}
                            onChange={setApiKey}
                            placeholder="sk-..."
                            helperText="Used for fetching models and stored locally"
                        />
                    </div>

                    {/* Features */}
                    <div className="form-section">
                        <h4 className="form-section__title">Features</h4>
                        <div className="capability-grid">
                            {(Object.keys(featureLabels) as Array<keyof ProviderFeatures>).map(key => (
                                <div key={key} className="capability-item">
                                    <span className="capability-item__label">{featureLabels[key]}</span>
                                    <Toggle
                                        checked={features[key] || false}
                                        onChange={(checked) => setFeatures({ ...features, [key]: checked })}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rate Limits */}
                    <div className="form-section">
                        <div className="form-section__header">
                            <h4 className="form-section__title">Rate Limits</h4>
                            <button onClick={handleAddLimit} className="btn btn--secondary btn--sm">
                                <Plus size={14} /> Add Limit
                            </button>
                        </div>
                        {limits.length === 0 ? (
                            <p className="form-helper">No rate limits configured</p>
                        ) : (
                            <div className="rate-limits-list">
                                {limits.map((rl, idx) => (
                                    <div key={idx} className="rate-limit-item">
                                        <select
                                            value={rl.type}
                                            onChange={(e) => handleUpdateLimit(idx, 'type', e.target.value)}
                                            className="input input--sm"
                                        >
                                            <option value="requests">Requests</option>
                                            <option value="tokens">Tokens</option>
                                        </select>
                                        <input
                                            type="number"
                                            value={rl.limit}
                                            onChange={(e) => handleUpdateLimit(idx, 'limit', parseInt(e.target.value) || 0)}
                                            className="input input--sm"
                                            placeholder="Limit"
                                        />
                                        <span className="rate-limit-item__separator">per</span>
                                        <input
                                            type="number"
                                            value={rl.window}
                                            onChange={(e) => handleUpdateLimit(idx, 'window', parseInt(e.target.value) || 60)}
                                            className="input input--sm"
                                            placeholder="Seconds"
                                        />
                                        <span className="rate-limit-item__unit">sec</span>
                                        <button onClick={() => handleRemoveLimit(idx)} className="btn btn--icon btn--icon-danger">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Models */}
                    <div className="form-section">
                        <div className="form-section__header">
                            <h4 className="form-section__title">Models ({models.length})</h4>
                            <button
                                onClick={handleFetchModels}
                                disabled={isFetching || !openaiUrl || !apiKey}
                                className="btn btn--secondary btn--sm"
                            >
                                <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                                {isFetching ? 'Fetching...' : 'Fetch Models'}
                            </button>
                        </div>

                        {fetchError && (
                            <div className="fetch-error">
                                <AlertCircle size={14} />
                                <span>{fetchError}</span>
                            </div>
                        )}

                        {fetchedModels.length > 0 && (
                            <div className="fetch-section">
                                <div className="fetch-section__header">
                                    <span className="fetch-section__title">Found {fetchedModels.length} models</span>
                                    <button onClick={handleAddAllFetchedModels} className="btn btn--secondary btn--sm">
                                        Add All
                                    </button>
                                </div>
                                <div className="fetch-section__models no-scrollbar">
                                    {fetchedModels.map(fm => (
                                        <div key={fm.id} className="fetched-model-item">
                                            <span className="fetched-model-item__name">{fm.id}</span>
                                            <button onClick={() => handleAddFetchedModel(fm)} className="btn btn--secondary btn--sm">
                                                <Plus size={12} /> Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {models.length > 0 && (
                            <div className="models-list">
                                {models.map(model => (
                                    <div key={model.id} className="model-list-item">
                                        <div className="model-list-item__info">
                                            <span className="model-list-item__name">{model.name}</span>
                                            <span className="model-list-item__id">{model.id}</span>
                                        </div>
                                        <div className="model-list-item__meta">
                                            <span className="model-list-item__context">
                                                {Math.round(model.context.maxInput / 1000)}k
                                            </span>
                                            <button onClick={() => handleRemoveModel(model.id)} className="btn btn--icon btn--icon-danger">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {models.length === 0 && fetchedModels.length === 0 && !fetchError && (
                            <p className="form-helper">
                                No models added yet. Use "Fetch Models" to auto-discover models from the API.
                            </p>
                        )}
                    </div>
                </div>

                <div className="form-page__actions">
                    <button onClick={onBack} className="btn btn--secondary">Cancel</button>
                    <button onClick={handleSubmit} className="btn btn--primary">
                        {isEditing ? 'Save Changes' : 'Add Provider'}
                    </button>
                </div>
            </div>
        </div>
    );
};
