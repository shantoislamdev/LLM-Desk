import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchModels, transformFetchedModel, generateProviderId } from './modelFetcher';
import * as WailsApp from '../../wailsjs/go/main/App';

vi.mock('../../wailsjs/go/main/App', () => ({
    FetchModels: vi.fn(),
    TransformFetchedModel: vi.fn(),
}));

describe('modelFetcher', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchModels', () => {
        it('should return models when FetchModels succeeds', async () => {
            const mockResult = {
                models: [{ id: 'gpt-4', object: 'model' }],
                error: ''
            };
            (WailsApp.FetchModels as any).mockResolvedValue(mockResult);

            const result = await fetchModels({ baseUrl: 'url', apiKey: 'key' });

            expect(result.models).toHaveLength(1);
            expect(result.models[0].id).toBe('gpt-4');
            expect(result.error).toBe('');
        });

        it('should handle errors from FetchModels', async () => {
            (WailsApp.FetchModels as any).mockRejectedValue(new Error('Network error'));

            const result = await fetchModels({ baseUrl: 'url', apiKey: 'key' });

            expect(result.models).toHaveLength(0);
            expect(result.error).toContain('Network error');
        });
    });

    describe('transformFetchedModel', () => {
        it('should format model names correctly', () => {
            const fetched = { id: 'gpt-4-turbo-preview' };
            const transformed = transformFetchedModel(fetched as any);

            expect(transformed.id).toBe('gpt-4-turbo-preview');
            expect(transformed.name).toBe('Gpt 4 Turbo Preview');
        });

        it('should handle complex IDs with slashes and underscores', () => {
            const fetched = { id: 'anthropic/claude-3_opus' };
            const transformed = transformFetchedModel(fetched as any);

            expect(transformed.name).toBe('Anthropic Claude 3 Opus');
        });
    });

    describe('generateProviderId', () => {
        it('should generate URL-safe IDs', () => {
            expect(generateProviderId('OpenAI (Official)')).toBe('openai-official');
            expect(generateProviderId('My Custom Provider!')).toBe('my-custom-provider');
        });

        it('should truncate long names', () => {
            const longName = 'A very very very very very very very very long name';
            const id = generateProviderId(longName);
            expect(id.length).toBeLessThanOrEqual(32);
        });
    });
});
