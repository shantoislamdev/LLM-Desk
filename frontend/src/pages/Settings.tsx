import React, { useState, useRef, useCallback } from 'react';
import { Sun, Moon, Download, Upload, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui';
import { ImportMode, ImportResult } from '@/utils/dataImport';

interface SettingsProps {
    theme: string;
    toggleTheme: () => void;
    onClearData: () => void;
    onExportData: () => void;
    onImportData: (file: File, mode: ImportMode) => Promise<ImportResult>;
}

type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

export const Settings: React.FC<SettingsProps> = ({
    theme,
    toggleTheme,
    onClearData,
    onExportData,
    onImportData
}) => {
    const [importMode, setImportMode] = useState<ImportMode>('merge');
    const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
    const [importMessage, setImportMessage] = useState<string>('');
    const [importWarnings, setImportWarnings] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (file: File) => {
        if (!file.name.endsWith('.json')) {
            setImportStatus('error');
            setImportMessage('Please select a JSON file');
            return;
        }

        setImportStatus('loading');
        setImportMessage('Importing...');
        setImportWarnings([]);

        try {
            const result = await onImportData(file, importMode);

            if (result.success) {
                setImportStatus('success');
                setImportMessage(result.message);
            } else {
                setImportStatus('error');
                setImportMessage(result.message);
            }
            setImportWarnings(result.warnings);
        } catch (e) {
            setImportStatus('error');
            setImportMessage(e instanceof Error ? e.message : 'Import failed');
        }
    }, [onImportData, importMode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
        // Reset input so the same file can be selected again
        e.target.value = '';
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="settings-section animate-fade-in pb-mobile">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Customize your experience.</p>
                </div>
            </div>

            <Card className="settings-panel">
                <h3 className="settings-panel__title">Appearance</h3>

                <div className="setting-row">
                    <div className="setting-row__info">
                        <h4 className="setting-row__label">Theme Preference</h4>
                        <p className="setting-row__description">Switch between light and dark mode.</p>
                    </div>

                    <div className="theme-toggle">
                        <button
                            onClick={() => theme === 'dark' && toggleTheme()}
                            className={`theme-toggle__btn ${theme === 'light' ? 'theme-toggle__btn--active' : ''}`}
                        >
                            <Sun size={18} />
                        </button>
                        <button
                            onClick={() => theme === 'light' && toggleTheme()}
                            className={`theme-toggle__btn ${theme === 'dark' ? 'theme-toggle__btn--active' : ''}`}
                        >
                            <Moon size={18} />
                        </button>
                    </div>
                </div>

                <div className="setting-row setting-row--divider setting-row--disabled">
                    <div className="setting-row__info">
                        <h4 className="setting-row__label">Compact Mode</h4>
                        <p className="setting-row__description">Increase information density.</p>
                    </div>
                    <div className="toggle-switch">
                        <div className="toggle-switch__knob"></div>
                    </div>
                </div>
            </Card>

            <Card className="settings-panel">
                <h3 className="settings-panel__title">Data Management</h3>

                {/* Export Section */}
                <div className="setting-row">
                    <div className="setting-row__info">
                        <h4 className="setting-row__label">Export Data</h4>
                        <p className="setting-row__description">
                            Download all your data as a JSON backup file.
                        </p>
                    </div>
                    <button onClick={onExportData} className="btn btn--primary">
                        <Download size={16} />
                        Export
                    </button>
                </div>

                {/* Import Section */}
                <div className="setting-row setting-row--divider setting-row--column">
                    <div className="setting-row__header">
                        <div className="setting-row__info">
                            <h4 className="setting-row__label">Import Data</h4>
                            <p className="setting-row__description">
                                Restore data from a backup file.
                            </p>
                        </div>

                        {/* Import Mode Toggle */}
                        <div className="import-mode-toggle">
                            <button
                                type="button"
                                onClick={() => setImportMode('merge')}
                                className={`import-mode-toggle__btn ${importMode === 'merge' ? 'import-mode-toggle__btn--active' : ''}`}
                            >
                                Merge
                            </button>
                            <button
                                type="button"
                                onClick={() => setImportMode('replace')}
                                className={`import-mode-toggle__btn ${importMode === 'replace' ? 'import-mode-toggle__btn--active' : ''}`}
                            >
                                Replace
                            </button>
                        </div>
                    </div>

                    <p className="import-mode-hint">
                        {importMode === 'merge'
                            ? 'Merge: Add new items without overwriting existing data.'
                            : 'Replace: Clear existing data and import everything fresh.'}
                    </p>

                    {/* File Drop Zone */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleInputChange}
                        className="visually-hidden"
                    />

                    <div
                        className={`file-drop-zone ${isDragging ? 'file-drop-zone--active' : ''} ${importStatus === 'loading' ? 'file-drop-zone--loading' : ''}`}
                        onClick={triggerFileInput}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        {importStatus === 'loading' ? (
                            <RefreshCw size={24} className="file-drop-zone__icon file-drop-zone__icon--spin" />
                        ) : (
                            <Upload size={24} className="file-drop-zone__icon" />
                        )}
                        <span className="file-drop-zone__text">
                            {importStatus === 'loading'
                                ? 'Importing...'
                                : 'Click or drop a JSON file here'}
                        </span>
                    </div>

                    {/* Import Status Feedback */}
                    {importStatus !== 'idle' && importStatus !== 'loading' && (
                        <div className={`import-status import-status--${importStatus}`}>
                            {importStatus === 'success' ? (
                                <CheckCircle size={18} />
                            ) : (
                                <AlertCircle size={18} />
                            )}
                            <span>{importMessage}</span>
                        </div>
                    )}

                    {/* Warnings */}
                    {importWarnings.length > 0 && (
                        <div className="import-warnings">
                            {importWarnings.map((warning, i) => (
                                <div key={i} className="import-warning">
                                    <AlertCircle size={14} />
                                    <span>{warning}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            <Card className="settings-panel">
                <h3 className="settings-panel__title">Data & Privacy</h3>
                <div className="setting-row">
                    <div className="setting-row__info">
                        <h4 className="setting-row__label">Local Storage</h4>
                        <p className="setting-row__description">Clear all locally stored API keys.</p>
                    </div>
                    <button
                        onClick={onClearData}
                        className="btn btn--danger"
                    >
                        Clear Data
                    </button>
                </div>
            </Card>
        </div>
    );
};

