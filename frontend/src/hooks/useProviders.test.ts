import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProviders } from './useProviders';
import * as WailsApp from '../../wailsjs/go/main/App';
import { Provider } from '@/types';

// Mock the Wails bindings
vi.mock('../../wailsjs/go/main/App', () => ({
    GetAllProviders: vi.fn(),
    CreateProvider: vi.fn(),
    UpdateProvider: vi.fn(),
    DeleteProvider: vi.fn(),
    UpdateCredentials: vi.fn(),
    AddModel: vi.fn(),
    UpdateModel: vi.fn(),
    DeleteModel: vi.fn(),
    SaveProviders: vi.fn(),
    ClearAllData: vi.fn(),
    ExportData: vi.fn(),
    ImportData: vi.fn(),
}));

const mockProvider: Provider = {
    id: 'test-id',
    name: 'Test Provider',
    enabled: true,
    credentials: { apiKeys: ['key1'] },
    endpoints: { openai: 'url', anthropic: null },
    limits: [],
    features: { streaming: true, toolCalling: true, jsonMode: true },
    models: [],
    isCustom: true
};

describe('useProviders', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (WailsApp.GetAllProviders as any).mockResolvedValue([mockProvider]);
    });

    it('should load providers on mount', async () => {
        const { result } = renderHook(() => useProviders());

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.providers).toHaveLength(1);
        expect(result.current.providers[0].name).toBe('Test Provider');
        expect(WailsApp.GetAllProviders).toHaveBeenCalled();
    });

    it('should add a new provider', async () => {
        const { result } = renderHook(() => useProviders());

        // Wait for mount load
        await act(async () => {
            await Promise.resolve();
        });

        const newProviderData = { name: 'New Provider' };

        let created: any;
        await act(async () => {
            created = await result.current.addProvider(newProviderData as any);
        });

        expect(WailsApp.CreateProvider).toHaveBeenCalled();
        expect(created.name).toBe('New Provider');
        expect(created.id).toBeDefined();
        // Check if loadProviders was called again
        expect(WailsApp.GetAllProviders).toHaveBeenCalledTimes(2);
    });

    it('should update an existing provider', async () => {
        const { result } = renderHook(() => useProviders());

        await act(async () => {
            await Promise.resolve();
        });

        await act(async () => {
            await result.current.updateProvider('test-id', { name: 'Updated Name' });
        });

        expect(WailsApp.UpdateProvider).toHaveBeenCalledWith('test-id', expect.objectContaining({
            name: 'Updated Name'
        }));
    });

    it('should delete a provider', async () => {
        const { result } = renderHook(() => useProviders());

        await act(async () => {
            await Promise.resolve();
        });

        await act(async () => {
            await result.current.deleteProvider('test-id');
        });

        expect(WailsApp.DeleteProvider).toHaveBeenCalledWith('test-id');
    });

    it('should manage selected provider', async () => {
        const { result } = renderHook(() => useProviders());

        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.selectedProvider).toBeNull();

        act(() => {
            result.current.setSelectedProvider(mockProvider);
        });

        expect(result.current.selectedProvider?.id).toBe('test-id');
    });

    it('should update selected provider when model is added', async () => {
        const { result } = renderHook(() => useProviders());

        await act(async () => {
            await Promise.resolve();
        });

        act(() => {
            result.current.setSelectedProvider(mockProvider);
        });

        const newModel = { id: 'm1', name: 'Model 1', enabled: true } as any;

        await act(async () => {
            await result.current.addModel('test-id', newModel);
        });

        expect(WailsApp.AddModel).toHaveBeenCalled();
        expect(result.current.selectedProvider?.models).toHaveLength(1);
        expect(result.current.selectedProvider?.models[0].name).toBe('Model 1');
    });

    it('should handle export data', async () => {
        (WailsApp.ExportData as any).mockResolvedValue(true);
        const { result } = renderHook(() => useProviders());

        let success: boolean = false;
        await act(async () => {
            success = await result.current.exportData();
        });

        expect(success).toBe(true);
        expect(WailsApp.ExportData).toHaveBeenCalled();
    });
});
