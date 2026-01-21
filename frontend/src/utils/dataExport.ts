// Data export is now handled by the Go backend via native file dialogs
// This file is kept for compatibility but delegates to Wails bindings

import { ExportData } from '../../wailsjs/go/main/App';

export const SCHEMA_VERSION = '1.0.0';

/**
 * Triggers export via native file dialog
 * This replaces the browser download approach
 */
export async function downloadExportFile(): Promise<boolean> {
    try {
        return await ExportData();
    } catch (e) {
        console.error('Export failed:', e);
        return false;
    }
}
