import { useState, useCallback, useEffect, useMemo } from 'react';
import { Provider, Model } from '@/types';
import {
    GetAllProviders,
    CreateProvider,
    UpdateProvider as UpdateProviderAPI,
    DeleteProvider as DeleteProviderAPI,
    UpdateCredentials,
    AddModel as AddModelAPI,
    UpdateModel as UpdateModelAPI,
    DeleteModel as DeleteModelAPI,
    SaveProviders,
    ClearAllData,
    ExportData,
    ImportData
} from '../../wailsjs/go/main/App';
import type { models } from '../../wailsjs/go/models';

export type ImportMode = 'replace' | 'merge';

export interface ImportResult {
    success: boolean;
    message: string;
    warnings: string[];
    imported: { providers: number; models: number };
}

/**
 * Generates a unique provider ID from name
 */
function generateProviderId(name: string): string {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const timestamp = Date.now().toString(36);
    return `${base}-${timestamp}`;
}

/**
 * Creates a default new provider structure
 */
function createDefaultProvider(name: string): Provider {
    return {
        id: generateProviderId(name),
        name,
        enabled: true,
        credentials: { apiKeys: [] },
        endpoints: { openai: '', anthropic: null },
        limits: [],
        features: { streaming: true, toolCalling: true, jsonMode: true },
        models: [],
        isCustom: true
    };
}

/**
 * Creates a default new model structure
 */
function createDefaultModel(id: string, name: string): Model {
    return {
        id,
        name,
        enabled: true,
        parameters: null,
        pricing: { input: 0, output: 0, cached: null, currency: 'USD' },
        context: { maxInput: 128000, maxOutput: null },
        modalities: ['text'],
        features: {},
        limits: []
    };
}

// Convert Wails model to our Provider type
function convertProvider(p: models.Provider): Provider {
    return {
        id: p.id,
        name: p.name,
        enabled: p.enabled,
        credentials: { apiKeys: p.credentials?.apiKeys || [] },
        endpoints: {
            openai: p.endpoints?.openai || '',
            anthropic: p.endpoints?.anthropic || null
        },
        limits: p.limits || [],
        features: p.features || { streaming: true, toolCalling: true, jsonMode: true },
        models: (p.models || []).map(m => ({
            id: m.id,
            name: m.name,
            enabled: m.enabled,
            parameters: m.parameters || null,
            pricing: m.pricing || { input: 0, output: 0, cached: null, currency: 'USD' },
            context: m.context || { maxInput: 128000, maxOutput: null },
            modalities: m.modalities || ['text'],
            features: m.features || {},
            limits: m.limits || []
        })),
        isCustom: p.isCustom
    };
}

export function useProviders() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load providers on mount
    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        try {
            const loaded = await GetAllProviders();
            setProviders((loaded || []).map(convertProvider));
        } catch (e) {
            console.error('Failed to load providers:', e);
            setProviders([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Update API keys for a provider
    const updateProviderKeys = useCallback(async (providerId: string, newKeys: string[]) => {
        try {
            await UpdateCredentials(providerId, newKeys);
            await loadProviders();

            // Update selected provider if it matches
            if (selectedProvider?.id === providerId) {
                setSelectedProvider(prev => prev ? {
                    ...prev,
                    credentials: { ...prev.credentials, apiKeys: newKeys }
                } : null);
            }
        } catch (e) {
            console.error('Failed to update credentials:', e);
        }
    }, [selectedProvider]);

    // Add a new provider
    const addProvider = useCallback(async (providerData: Partial<Provider> & { name: string }) => {
        const newProvider: Provider = {
            ...createDefaultProvider(providerData.name),
            ...providerData,
            id: generateProviderId(providerData.name),
            isCustom: true
        };

        try {
            await CreateProvider(newProvider as any);
            await loadProviders();
            return newProvider;
        } catch (e) {
            console.error('Failed to create provider:', e);
            return newProvider;
        }
    }, []);

    // Update an existing provider
    const updateProvider = useCallback(async (providerId: string, updates: Partial<Provider>) => {
        try {
            const current = providers.find(p => p.id === providerId);
            if (current) {
                const updated = { ...current, ...updates };
                await UpdateProviderAPI(providerId, updated as any);
                await loadProviders();

                if (selectedProvider?.id === providerId) {
                    setSelectedProvider(prev => prev ? { ...prev, ...updates } : null);
                }
            }
        } catch (e) {
            console.error('Failed to update provider:', e);
        }
    }, [providers, selectedProvider]);

    // Delete a provider
    const deleteProvider = useCallback(async (providerId: string) => {
        try {
            await DeleteProviderAPI(providerId);
            await loadProviders();

            if (selectedProvider?.id === providerId) {
                setSelectedProvider(null);
            }
        } catch (e) {
            console.error('Failed to delete provider:', e);
        }
    }, [selectedProvider]);

    // Add a model to a provider
    const addModel = useCallback(async (providerId: string, model: Model) => {
        try {
            await AddModelAPI(providerId, model as any);
            await loadProviders();

            if (selectedProvider?.id === providerId) {
                setSelectedProvider(prev => prev ? {
                    ...prev,
                    models: [...prev.models, model]
                } : null);
            }
        } catch (e) {
            console.error('Failed to add model:', e);
        }
    }, [selectedProvider]);

    // Update a model
    const updateModel = useCallback(async (providerId: string, modelId: string, updates: Partial<Model>) => {
        try {
            const provider = providers.find(p => p.id === providerId);
            if (provider) {
                const model = provider.models.find(m => m.id === modelId);
                if (model) {
                    const updated = { ...model, ...updates };
                    await UpdateModelAPI(providerId, modelId, updated as any);
                    await loadProviders();

                    if (selectedProvider?.id === providerId) {
                        setSelectedProvider(prev => prev ? {
                            ...prev,
                            models: prev.models.map(m =>
                                m.id === modelId ? { ...m, ...updates } : m
                            )
                        } : null);
                    }
                }
            }
        } catch (e) {
            console.error('Failed to update model:', e);
        }
    }, [providers, selectedProvider]);

    // Delete a model
    const deleteModel = useCallback(async (providerId: string, modelId: string) => {
        try {
            await DeleteModelAPI(providerId, modelId);
            await loadProviders();

            if (selectedProvider?.id === providerId) {
                setSelectedProvider(prev => prev ? {
                    ...prev,
                    models: prev.models.filter(m => m.id !== modelId)
                } : null);
            }
        } catch (e) {
            console.error('Failed to delete model:', e);
        }
    }, [selectedProvider]);

    // Clear all data
    const clearAllData = useCallback(async () => {
        try {
            await ClearAllData();
            setProviders([]);
            setSelectedProvider(null);
        } catch (e) {
            console.error('Failed to clear data:', e);
        }
    }, []);

    // Export data (uses native file dialog)
    const exportData = useCallback(async (): Promise<boolean> => {
        try {
            const success = await ExportData();
            return success;
        } catch (e) {
            console.error('Failed to export data:', e);
            throw e;
        }
    }, []);

    // Import data from file (uses native file dialog)
    const importDataFromFile = useCallback(async (
        mode: ImportMode
    ): Promise<ImportResult> => {
        try {
            const result = await ImportData(mode);
            if (result.success) {
                await loadProviders();
            }
            return {
                success: result.success,
                message: result.message,
                warnings: result.warnings || [],
                imported: result.imported || { providers: 0, models: 0 }
            };
        } catch (e) {
            return {
                success: false,
                message: `Failed to import: ${e instanceof Error ? e.message : 'Unknown error'}`,
                warnings: [],
                imported: { providers: 0, models: 0 }
            };
        }
    }, []);

    return useMemo(() => ({
        providers,
        selectedProvider,
        setSelectedProvider,
        updateProviderKeys,
        clearAllData,
        isLoading,
        // Provider CRUD
        addProvider,
        updateProvider,
        deleteProvider,
        // Model CRUD
        addModel,
        updateModel,
        deleteModel,
        // Import/Export
        exportData,
        importDataFromFile,
        // Utilities
        createDefaultProvider,
        createDefaultModel
    }), [
        providers,
        selectedProvider,
        // setSelectedProvider is stable (useState setter)
        updateProviderKeys,
        clearAllData,
        isLoading,
        addProvider,
        updateProvider,
        deleteProvider,
        addModel,
        updateModel,
        deleteModel,
        exportData,
        importDataFromFile
        // createDefaultProvider/Model are static functions, could be moved out of hook or memoized if constructed here (they are function declarations outside currently?)
        // Actually, createDefaultProvider/Model serve as utilities. If they are defined outside, they are stable.
        // Looking at file content, they are defined outside.
    ]);
}
