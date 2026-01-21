import React, { useState } from 'react';
import {
    Key,
    ChevronRight,
    Copy,
    Eye,
    EyeOff,
    Activity,
    Database,
    Trash2,
    Plus,
    Settings,
    Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Provider, Model } from '@/types';

interface ProviderDetailProps {
    provider: Provider;
    onBack: () => void;
    onUpdateKeys: (id: string, keys: string[]) => void;
    onEditProvider: () => void;
    onDeleteProvider?: () => void;
    onEditModel: (model: Model) => void;
    onAddModel: () => void;
}

export const ProviderDetail: React.FC<ProviderDetailProps> = ({
    provider,
    onBack,
    onUpdateKeys,
    onEditProvider,
    onDeleteProvider,
    onEditModel,
    onAddModel
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newKeyInput, setNewKeyInput] = useState('');
    const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({});
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);

    const toggleVisibility = (index: number) => {
        setVisibleKeys(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const addKey = () => {
        if (!newKeyInput.trim()) return;
        const updatedKeys = [...provider.credentials.apiKeys, newKeyInput.trim()];
        onUpdateKeys(provider.id, updatedKeys);
        setNewKeyInput('');
    };

    const deleteKey = (index: number) => {
        const updatedKeys = [...provider.credentials.apiKeys];
        updatedKeys.splice(index, 1);
        onUpdateKeys(provider.id, updatedKeys);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleDeleteProvider = () => {
        if (onDeleteProvider && window.confirm(`Are you sure you want to delete "${provider.name}"? This action cannot be undone.`)) {
            onDeleteProvider();
        }
    };

    return (
        <div className="provider-detail animate-fade-in pb-mobile">
            <button onClick={onBack} className="provider-detail__back-btn">
                <ChevronRight className="provider-detail__back-icon" size={16} />
                Back to Providers
            </button>

            <div className="provider-detail__container">
                <div className="provider-detail__header">
                    <div className="provider-detail__header-top">
                        <div className="provider-detail__info">
                            <div className="provider-detail__avatar">
                                {provider.name.charAt(0)}
                            </div>
                            <div>
                                <div className="provider-detail__name-row">
                                    <h1 className="provider-detail__name">{provider.name}</h1>
                                </div>
                                <div className="provider-detail__meta">
                                    <span className="provider-detail__id">{provider.id}</span>
                                    <span>•</span>
                                    <span>{provider.models.length} Models Available</span>
                                </div>
                            </div>
                        </div>

                        <div className="provider-detail__actions">
                            <button
                                onClick={onEditProvider}
                                className="btn btn--secondary btn--flex"
                            >
                                <Settings size={16} />
                                Edit Provider
                            </button>
                            <button onClick={() => setIsEditing(!isEditing)} className="btn btn--secondary btn--flex">
                                <Key size={16} />
                                {isEditing ? 'Close Key Manager' : 'Manage Keys'}
                            </button>
                            {onDeleteProvider && (
                                <button onClick={handleDeleteProvider} className="btn btn--danger" title="Delete Provider">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="url-display">
                        <div className="url-display__item">
                            <div className="url-display__content">
                                <span className="url-display__label">OpenAI-compatible URL</span>
                                <code className="url-display__value">{provider.endpoints.openai}</code>
                            </div>
                            <button onClick={() => copyToClipboard(provider.endpoints.openai)} className="btn btn--icon" title="Copy URL">
                                <Copy size={14} />
                            </button>
                        </div>

                        {provider.endpoints.anthropic && (
                            <div className="url-display__item">
                                <div className="url-display__content">
                                    <span className="url-display__label">Anthropic URL</span>
                                    <code className="url-display__value">{provider.endpoints.anthropic}</code>
                                </div>
                                <button onClick={() => copyToClipboard(provider.endpoints.anthropic!)} className="btn btn--icon" title="Copy Anthropic URL">
                                    <Copy size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {isEditing && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="key-manager"
                        >
                            <div className="key-manager__header">
                                <h4 className="key-manager__title">API Credentials</h4>
                                <span className="key-manager__count">{provider.credentials.apiKeys.length} Keys Configured</span>
                            </div>

                            <div className="key-manager__list">
                                {provider.credentials.apiKeys.map((key, idx) => (
                                    <div key={idx} className="key-item">
                                        <div className="key-item__display">
                                            <span className="key-item__value">
                                                {visibleKeys[idx] ? key : key.length > 8 ? key.slice(0, 4) + '••••••••' + key.slice(-4) : '••••••••'}
                                            </span>
                                            <div className="key-item__actions">
                                                <button onClick={() => toggleVisibility(idx)} className="btn btn--icon">
                                                    {visibleKeys[idx] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button onClick={() => copyToClipboard(key)} className="btn btn--icon">
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="key-item__delete-group">
                                            <button onClick={() => deleteKey(idx)} className="btn btn--icon btn--icon-danger"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}

                                <div className="key-manager__add">
                                    <div className="key-manager__input-wrapper">
                                        <div className="key-manager__input-icon">
                                            <Plus size={16} />
                                        </div>
                                        <input
                                            value={newKeyInput}
                                            onChange={(e) => setNewKeyInput(e.target.value)}
                                            placeholder="Add new API key..."
                                            className="input input--with-icon"
                                            onKeyDown={(e) => e.key === 'Enter' && addKey()}
                                        />
                                    </div>
                                    <button
                                        onClick={addKey}
                                        disabled={!newKeyInput.trim()}
                                        className="btn btn--primary"
                                    >
                                        Add Key
                                    </button>
                                </div>
                            </div>
                            <div className="key-manager__notice">
                                <Activity size={12} className="key-manager__notice-icon" />
                                <span>Keys are stored securely in your browser's local storage and never transmitted to our servers.</span>
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="inventory-section">
                    <button
                        onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                        className={`inventory-toggle ${isInventoryOpen ? 'inventory-toggle--open' : ''}`}
                    >
                        <div className="inventory-toggle__content">
                            <div className="inventory-toggle__icon">
                                <Database size={18} />
                            </div>
                            <div>
                                <h3 className="inventory-toggle__title">Model Inventory</h3>
                                <p className="inventory-toggle__subtitle">View and edit pricing, context window, and capabilities for {provider.models.length} models.</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="inventory-toggle__arrow" />
                    </button>

                    <AnimatePresence>
                        {isInventoryOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div className="inventory-content">
                                    <div className="inventory-header">
                                        <span className="inventory-header__count">{provider.models.length} models</span>
                                        <button onClick={onAddModel} className="btn btn--secondary btn--sm">
                                            <Plus size={14} /> Add Model
                                        </button>
                                    </div>
                                    <div className="inventory-table-wrapper">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Model Name</th>
                                                    <th>ID</th>
                                                    <th>Context</th>
                                                    <th>Input Cost</th>
                                                    <th>Output Cost</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {provider.models.map((model) => (
                                                    <tr key={model.id}>
                                                        <td>
                                                            <div className="data-table__model-name">{model.name}</div>
                                                            <div className="data-table__modality-badges">
                                                                {model.modalities.map(m => (
                                                                    <span key={m} className="data-table__modality-badge">{m}</span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="data-table__id" title={model.id}>{model.id}</td>
                                                        <td className="data-table__context">{(model.context.maxInput / 1000).toFixed(0)}k</td>
                                                        <td className="data-table__price">
                                                            {model.pricing.input === 0 ? (
                                                                <span className="data-table__price--free">Free</span>
                                                            ) : (
                                                                <span className="data-table__price--paid">${model.pricing.input}</span>
                                                            )}
                                                        </td>
                                                        <td className="data-table__price">
                                                            {model.pricing.output === 0 ? (
                                                                <span className="data-table__price--free">Free</span>
                                                            ) : (
                                                                <span className="data-table__price--paid">${model.pricing.output}</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="data-table__actions">
                                                                <button
                                                                    onClick={() => onEditModel(model)}
                                                                    className="btn btn--icon"
                                                                    title="Edit model"
                                                                >
                                                                    <Edit3 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
