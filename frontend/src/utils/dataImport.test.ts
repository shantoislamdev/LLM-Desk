import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importData, validateImportData } from './dataImport';
import * as WailsApp from '../../wailsjs/go/main/App';

vi.mock('../../wailsjs/go/main/App', () => ({
    ImportData: vi.fn(),
}));

describe('dataImport', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validateImportData', () => {
        it('should return valid true (delegated to Go)', () => {
            const result = validateImportData('some content');
            expect(result.valid).toBe(true);
        });
    });

    describe('importData', () => {
        it('should return success when ImportData succeeds', async () => {
            const mockResult = {
                success: true,
                message: 'Imported successfully',
                warnings: [],
                imported: { providers: 2, models: 5 }
            };
            (WailsApp.ImportData as any).mockResolvedValue(mockResult);

            const result = await importData('merge');

            expect(result.success).toBe(true);
            expect(result.imported.providers).toBe(2);
            expect(WailsApp.ImportData).toHaveBeenCalledWith('merge');
        });

        it('should handle errors from ImportData', async () => {
            (WailsApp.ImportData as any).mockRejectedValue(new Error('File reading failed'));

            const result = await importData('replace');

            expect(result.success).toBe(false);
            expect(result.message).toContain('File reading failed');
        });
    });
});
