// ============================================
// LLM Desk Enterprise Data Types v1.0.0
// ============================================

// Pricing structure (per million tokens)
export interface Pricing {
    input: number;
    output: number;
    cached?: number | null;
    currency: string;
}

// Rate limit structure
export interface Limit {
    type: string;
    limit: number;
    window: number;
}

// Context window structure
export interface Context {
    maxInput: number;
    maxOutput?: number | null;
}

// Model features/capabilities
export interface ModelFeatures {
    toolCalling?: boolean;
    reasoning?: boolean;
    search?: boolean;
    codeExecution?: boolean;
    vision?: boolean;
}

// Provider features/capabilities
export interface ProviderFeatures {
    streaming?: boolean;
    toolCalling?: boolean;
    jsonMode?: boolean;
}

// API Endpoints
export interface Endpoints {
    openai: string;
    anthropic?: string | null;
}

// API Credentials
export interface Credentials {
    apiKeys: string[];
}

// Model definition
export interface Model {
    id: string;
    name: string;
    enabled: boolean;
    parameters: string | null;
    pricing: Pricing;
    context: Context;
    modalities: string[];
    features?: ModelFeatures;
    limits?: Limit[];
}

// Provider definition
export interface Provider {
    id: string;
    name: string;
    enabled: boolean;
    credentials: Credentials;
    endpoints: Endpoints;
    limits: Limit[];
    features: ProviderFeatures;
    models: Model[];
    isCustom?: boolean;
}

// Export/Import metadata
export interface Metadata {
    createdAt: string;
    modifiedAt: string;
    generator: string;
    description?: string;
}

// Unified data structure for import/export
export interface LLMDeskData {
    version: string;
    metadata: Metadata;
    providers: Provider[];
}

// For fetched model data transformation (API response)
export interface FetchedModel {
    id: string;
    object?: string;
    created?: number;
    owned_by?: string;
}

// Application view states
export type ViewState =
    | 'dashboard'
    | 'providers'
    | 'models'
    | 'provider-detail'
    | 'settings'
    | 'provider-form'
    | 'model-form';
