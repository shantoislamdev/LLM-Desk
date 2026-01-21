import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import { FormInput, Toggle } from '@/components/ui';
import { Model, ModelFeatures, Pricing, Limit, Provider, Context } from '@/types';

interface ModelFormProps {
    provider: Provider;
    model?: Model;
    onBack: () => void;
    onSubmit: (model: Model) => void;
    onDelete?: () => void;
}

const defaultPricing: Pricing = {
    input: 0,
    output: 0,
    cached: null,
    currency: 'USD'
};

const defaultContext: Context = {
    maxInput: 128000,
    maxOutput: null
};

const defaultFeatures: ModelFeatures = {
    toolCalling: false,
    reasoning: false,
    search: false,
    codeExecution: false,
    vision: false
};

const modalityOptions = ['text', 'vision', 'audio', 'video'];

export const ModelForm: React.FC<ModelFormProps> = ({
    provider,
    model,
    onBack,
    onSubmit,
    onDelete
}) => {
    const isEditing = !!model;

    // Form state
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [enabled, setEnabled] = useState(true);
    const [parameters, setParameters] = useState('');
    const [maxInput, setMaxInput] = useState('128000');
    const [maxOutput, setMaxOutput] = useState('');
    const [pricing, setPricing] = useState<Pricing>(defaultPricing);
    const [modalities, setModalities] = useState<string[]>(['text']);
    const [features, setFeatures] = useState<ModelFeatures>(defaultFeatures);
    const [limits, setLimits] = useState<Limit[]>([]);

    // Validation
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Initialize form when model changes
    useEffect(() => {
        if (model) {
            setId(model.id);
            setName(model.name);
            setEnabled(model.enabled);
            setParameters(model.parameters || '');
            setMaxInput(model.context.maxInput.toString());
            setMaxOutput(model.context.maxOutput?.toString() || '');
            setPricing(model.pricing);
            setModalities(model.modalities);
            setFeatures(model.features || defaultFeatures);
            setLimits(model.limits || []);
        } else {
            setId('');
            setName('');
            setEnabled(true);
            setParameters('');
            setMaxInput('128000');
            setMaxOutput('');
            setPricing(defaultPricing);
            setModalities(['text']);
            setFeatures(defaultFeatures);
            setLimits([]);
        }
        setErrors({});
    }, [model]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!id.trim()) {
            newErrors.id = 'Model ID is required';
        }

        if (!name.trim()) {
            newErrors.name = 'Model name is required';
        }

        const ctx = parseInt(maxInput);
        if (isNaN(ctx) || ctx <= 0) {
            newErrors.maxInput = 'Please enter a valid context window';
        }

        if (modalities.length === 0) {
            newErrors.modalities = 'At least one modality is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleModalityToggle = (mod: string) => {
        if (modalities.includes(mod)) {
            if (modalities.length > 1) {
                setModalities(modalities.filter(m => m !== mod));
            }
        } else {
            setModalities([...modalities, mod]);
        }
    };

    const handleAddLimit = () => {
        setLimits([...limits, { type: 'requests', limit: 60, window: 60 }]);
    };

    const handleRemoveLimit = (index: number) => {
        setLimits(limits.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const modelData: Model = {
            id: id.trim(),
            name: name.trim(),
            enabled,
            parameters: parameters.trim() || null,
            context: {
                maxInput: parseInt(maxInput),
                maxOutput: maxOutput ? parseInt(maxOutput) : null
            },
            pricing: {
                input: pricing.input || 0,
                output: pricing.output || 0,
                cached: pricing.cached,
                currency: pricing.currency || 'USD'
            },
            modalities,
            features,
            limits: limits.length > 0 ? limits : undefined
        };

        onSubmit(modelData);
    };

    const handleDelete = () => {
        if (onDelete && window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            onDelete();
        }
    };

    const featureLabels: Record<keyof ModelFeatures, string> = {
        toolCalling: 'Tool Calling',
        reasoning: 'Reasoning',
        search: 'Web Search',
        codeExecution: 'Code Execution',
        vision: 'Vision'
    };

    return (
        <div className="form-page animate-fade-in pb-mobile">
            <button onClick={onBack} className="form-page__back-btn">
                <ChevronRight className="form-page__back-icon" size={16} />
                Back to {provider.name}
            </button>

            <div className="form-page__container">
                <div className="form-page__header">
                    <h1 className="page-title">{isEditing ? 'Edit Model' : 'Add New Model'}</h1>
                    <p className="page-subtitle">Configure model settings for {provider.name}.</p>
                </div>

                <div className="form-page__content">
                    {/* Basic Info */}
                    <div className="form-section">
                        <h4 className="form-section__title">Basic Information</h4>
                        <FormInput
                            label="Model ID"
                            name="id"
                            value={id}
                            onChange={setId}
                            placeholder="e.g., gpt-4-turbo, claude-3-opus"
                            required
                            error={errors.id}
                            readOnly={isEditing}
                            helperText={isEditing ? 'Model ID cannot be changed' : 'Unique identifier for API calls'}
                        />
                        <FormInput
                            label="Display Name"
                            name="name"
                            value={name}
                            onChange={setName}
                            placeholder="e.g., GPT-4 Turbo, Claude 3 Opus"
                            required
                            error={errors.name}
                        />
                        <FormInput
                            label="Parameters"
                            name="parameters"
                            value={parameters}
                            onChange={setParameters}
                            placeholder="e.g., 70B, 671B (37B active)"
                            helperText="Model size or parameter count"
                        />
                    </div>

                    {/* Context */}
                    <div className="form-section">
                        <h4 className="form-section__title">Context Window</h4>
                        <div className="form-row">
                            <FormInput
                                label="Max Input Tokens"
                                name="maxInput"
                                value={maxInput}
                                onChange={setMaxInput}
                                type="number"
                                required
                                error={errors.maxInput}
                                helperText="Maximum context window size"
                            />
                            <FormInput
                                label="Max Output Tokens"
                                name="maxOutput"
                                value={maxOutput}
                                onChange={setMaxOutput}
                                type="number"
                                helperText="Max output tokens (optional)"
                            />
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="form-section">
                        <h4 className="form-section__title">Pricing (per 1M tokens, USD)</h4>
                        <div className="form-row">
                            <FormInput
                                label="Input Cost"
                                name="input"
                                value={pricing.input.toString()}
                                onChange={(v) => setPricing({ ...pricing, input: parseFloat(v) || 0 })}
                                type="number"
                                placeholder="0.00"
                            />
                            <FormInput
                                label="Output Cost"
                                name="output"
                                value={pricing.output.toString()}
                                onChange={(v) => setPricing({ ...pricing, output: parseFloat(v) || 0 })}
                                type="number"
                                placeholder="0.00"
                            />
                        </div>
                        <FormInput
                            label="Cached Input Cost"
                            name="cached"
                            value={pricing.cached?.toString() || ''}
                            onChange={(v) => setPricing({ ...pricing, cached: v ? parseFloat(v) : null })}
                            type="number"
                            placeholder="Optional"
                            helperText="Cost for cached input tokens"
                        />
                    </div>

                    {/* Modality */}
                    <div className="form-section">
                        <h4 className="form-section__title">Modalities</h4>
                        {errors.modalities && <span className="form-error">{errors.modalities}</span>}
                        <div className="modality-grid">
                            {modalityOptions.map(mod => (
                                <button
                                    key={mod}
                                    type="button"
                                    onClick={() => handleModalityToggle(mod)}
                                    className={`modality-btn ${modalities.includes(mod) ? 'modality-btn--active' : ''}`}
                                >
                                    {mod}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Features */}
                    <div className="form-section">
                        <h4 className="form-section__title">Features</h4>
                        <div className="capability-grid">
                            {(Object.keys(featureLabels) as Array<keyof ModelFeatures>).map(key => (
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
                            <h4 className="form-section__title">Model Rate Limits</h4>
                            <button onClick={handleAddLimit} className="btn btn--secondary btn--sm">
                                <Plus size={14} /> Add
                            </button>
                        </div>
                        {limits.length === 0 ? (
                            <p className="form-helper">No model-specific rate limits. Provider limits will apply.</p>
                        ) : (
                            <div className="rate-limits-list">
                                {limits.map((rl, idx) => (
                                    <div key={idx} className="rate-limit-item">
                                        <select
                                            value={rl.type}
                                            onChange={(e) => {
                                                const updated = [...limits];
                                                updated[idx] = { ...rl, type: e.target.value as 'requests' | 'tokens' };
                                                setLimits(updated);
                                            }}
                                            className="input input--sm"
                                        >
                                            <option value="requests">Requests</option>
                                            <option value="tokens">Tokens</option>
                                        </select>
                                        <input
                                            type="number"
                                            value={rl.limit}
                                            onChange={(e) => {
                                                const updated = [...limits];
                                                updated[idx] = { ...rl, limit: parseInt(e.target.value) || 0 };
                                                setLimits(updated);
                                            }}
                                            className="input input--sm"
                                        />
                                        <span className="rate-limit-item__separator">per</span>
                                        <input
                                            type="number"
                                            value={rl.window}
                                            onChange={(e) => {
                                                const updated = [...limits];
                                                updated[idx] = { ...rl, window: parseInt(e.target.value) || 60 };
                                                setLimits(updated);
                                            }}
                                            className="input input--sm"
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
                </div>

                <div className="form-page__actions">
                    {isEditing && onDelete && (
                        <button onClick={handleDelete} className="btn btn--danger">Delete Model</button>
                    )}
                    <div className="form-page__actions-right">
                        <button onClick={onBack} className="btn btn--secondary">Cancel</button>
                        <button onClick={handleSubmit} className="btn btn--primary">
                            {isEditing ? 'Save Changes' : 'Add Model'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
