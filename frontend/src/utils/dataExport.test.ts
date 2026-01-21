import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadExportFile } from './dataExport';
import * as WailsApp from '../../wailsjs/go/main/App';

vi.mock('../../wailsjs/go/main/App', () => ({
    ExportData: vi.fn(),
}));

describe('dataExport', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return true when ExportData succeeds', async () => {
        (WailsApp.ExportData as any).mockResolvedValue(true);
        const result = await downloadExportFile();
        expect(result).toBe(true);
        expect(WailsApp.ExportData).toHaveBeenCalled();
    });

    it('should return false when ExportData fails', async () => {
        (WailsApp.ExportData as any).mockRejectedValue(new Error('Export error'));
        const result = await downloadExportFile();
        expect(result).toBe(false);
    });
});
