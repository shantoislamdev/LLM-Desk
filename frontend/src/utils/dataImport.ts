// Data import is now handled by the Go backend via native file dialogs
// This file is kept for compatibility but delegates to Wails bindings

import { ImportData } from '../../wailsjs/go/main/App';

export type ImportMode = 'replace' | 'merge';

export interface ImportResult {
    success: boolean;
    message: string;
    warnings: string[];
    imported: { providers: number; models: number };
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    data: any | null;
}

/**
 * Validates import data (kept for interface compatibility)
 * In Wails, validation is done on the Go side
 */
export function validateImportData(_content: string): ValidationResult {
    // Validation now happens in Go backend
    return {
        valid: true,
        errors: [],
        warnings: [],
        data: null
    };
}

/**
 * Performs import via native file dialog
 * @param mode - 'replace' to replace all data, 'merge' to merge with existing
 */
export async function importData(mode: ImportMode): Promise<ImportResult> {
    try {
        const result = await ImportData(mode);
        return {
            success: result.success,
            message: result.message,
            warnings: result.warnings || [],
            imported: result.imported || { providers: 0, models: 0 }
        };
    } catch (e) {
        return {
            success: false,
            message: `Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
            warnings: [],
            imported: { providers: 0, models: 0 }
        };
    }
}

/**
 * Read file as text (kept for interface compatibility)
 * In Wails, file reading is done via native dialog on Go side
 */
export function readFileAsText(_file: File): Promise<string> {
    // Not used in Wails - native dialog handles file reading
    return Promise.resolve('');
}
