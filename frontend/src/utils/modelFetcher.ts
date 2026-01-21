import { FetchModels, TransformFetchedModel } from '../../wailsjs/go/main/App';
import { FetchedModel, Model } from '@/types';

interface FetchModelsOptions {
    baseUrl: string;
    apiKey: string;
    anthropicUrl?: string;
}

interface FetchModelsResult {
    models: FetchedModel[];
    error?: string;
}

export async function fetchModels(options: FetchModelsOptions): Promise<FetchModelsResult> {
    const { baseUrl, apiKey, anthropicUrl } = options;

    try {
        const result = await FetchModels(baseUrl, apiKey, anthropicUrl || null);
        return {
            models: result.models || [],
            error: result.error
        };
    } catch (e) {
        return {
            models: [],
            error: `Failed to fetch models: ${e instanceof Error ? e.message : 'Unknown error'}`
        };
    }
}

// Format model ID into a readable name
function formatModelName(id: string): string {
    return id
        .split(/[-_/]/)
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Transform fetched models to our Model type with sensible defaults
export function transformFetchedModel(fetched: FetchedModel): Model {
    return {
        id: fetched.id,
        name: formatModelName(fetched.id),
        enabled: true,
        parameters: null,
        pricing: { input: 0, output: 0, cached: null, currency: 'USD' },
        context: { maxInput: 128000, maxOutput: null },
        modalities: ['text'],
        features: {},
        limits: []
    };
}

// Generate a URL-safe ID from a name
export function generateProviderId(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 32);
}
