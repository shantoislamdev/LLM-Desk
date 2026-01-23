import React, { useState, useEffect } from 'react';
import { Snackbar } from 'minisnackbar';
import { Sun, Moon, Download, Upload, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui';
import { ImportMode, ImportResult } from '@/utils/dataImport';
import { GetVersion } from '../../wailsjs/go/main/App';

interface SettingsProps {
    theme: string;
    toggleTheme: () => void;
    followSystem: boolean;
    toggleFollowSystem: () => void;
    onClearData: () => void;
    onExportData: () => void;
    onImportData: (mode: ImportMode) => Promise<ImportResult>;
    crashReporting: boolean;
    toggleCrashReporting: () => void;
    onCheckForUpdates: () => Promise<any>;
}


export const Settings: React.FC<SettingsProps> = React.memo(({
    theme,
    toggleTheme,
    followSystem,
    toggleFollowSystem,
    onClearData,
    onExportData,
    onImportData,
    crashReporting,
    toggleCrashReporting,
    onCheckForUpdates
}) => {
    const [importMode, setImportMode] = useState<ImportMode>('merge');
    const [importWarnings, setImportWarnings] = useState<string[]>([]);
    const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
    const [updateResult, setUpdateResult] = useState<any>(null);
    const [appVersion, setAppVersion] = useState<string>('Loading...');

    // Fetch version from backend on mount
    useEffect(() => {
        GetVersion()
            .then(setAppVersion)
            .catch(() => setAppVersion('Unknown'));
    }, []);

    const handleImportClick = async () => {
        Snackbar.add('Importing...');
        setImportWarnings([]);

        try {
            const result = await onImportData(importMode);

            if (result.success) {
                Snackbar.add(result.message, {
                    text: 'VIEW',
                    handler: () => { /* Logic to navigate to providers if needed, or just let user explore */ }
                });
            } else if (result.message !== 'Import cancelled') {
                Snackbar.add(result.message);
            }
            setImportWarnings(result.warnings);
        } catch (e) {
            Snackbar.add(e instanceof Error ? e.message : 'Import failed');
        }
    };

    const handleCheckUpdates = async () => {
        setIsCheckingUpdates(true);
        setUpdateResult(null);
        try {
            const result = await onCheckForUpdates();
            setUpdateResult(result);
        } catch (e) {
            setUpdateResult({ error: 'Failed to check for updates' });
        } finally {
            setIsCheckingUpdates(false);
        }
    };

    return (
        <div className="settings-section animate-fade-in u-pb-mobile">
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
                        <h4 className="setting-row__label">Follow System Theme</h4>
                        <p className="setting-row__description">Automatically switch between light and dark mode.</p>
                    </div>
                    <button
                        type="button"
                        className={`toggle ${followSystem ? 'toggle--active' : ''}`}
                        onClick={toggleFollowSystem}
                    >
                        <span className="toggle__knob"></span>
                    </button>
                </div>

                <div className={`setting-row setting-row--divider ${followSystem ? 'setting-row--disabled' : ''}`}>
                    <div className="setting-row__info">
                        <h4 className="setting-row__label">Theme Preference</h4>
                        <p className="setting-row__description">Switch between light and dark mode.</p>
                    </div>

                    <div className="theme-toggle">
                        <button
                            onClick={() => !followSystem && theme === 'dark' && toggleTheme()}
                            disabled={followSystem}
                            className={`theme-toggle__btn ${theme === 'light' ? 'theme-toggle__btn--active' : ''}`}
                        >
                            <Sun size={18} />
                        </button>
                        <button
                            onClick={() => !followSystem && theme === 'light' && toggleTheme()}
                            disabled={followSystem}
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
                    <button type="button" className="toggle toggle--disabled">
                        <span className="toggle__knob"></span>
                    </button>
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
                    {/* Import Trigger Zone */}
                    <div
                        className="file-drop-zone"
                        onClick={handleImportClick}
                    >
                        <Upload size={24} className="file-drop-zone__icon" />
                        <span className="file-drop-zone__text">
                            Click to select a JSON file
                        </span>
                    </div>



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
                        <h4 className="setting-row__label">Crash Reporting</h4>
                        <p className="setting-row__description">Help improve LLM Desk by sending anonymous crash logs.</p>
                    </div>
                    <button
                        type="button"
                        className={`toggle ${crashReporting ? 'toggle--active' : ''}`}
                        onClick={toggleCrashReporting}
                    >
                        <span className="toggle__knob"></span>
                    </button>
                </div>

                <div className="setting-row setting-row--divider">
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

            <Card className="settings-panel">
                <h3 className="settings-panel__title">Updates</h3>
                <div className="setting-row">
                    <div className="setting-row__info">
                        <h4 className="setting-row__label">Check for Updates</h4>
                        <p className="setting-row__description">
                            Current Version: <span className="u-text-secondary">{appVersion}</span>
                        </p>
                    </div>
                    <button
                        onClick={handleCheckUpdates}
                        className="btn btn--secondary"
                        disabled={isCheckingUpdates}
                    >
                        {isCheckingUpdates ? <RefreshCw size={16} className="animate-spin mr-2" /> : null}
                        {isCheckingUpdates ? 'Checking...' : 'Check for Updates'}
                    </button>
                </div>

                {updateResult && (
                    <div className={`update-status ${updateResult.available ? 'update-status--available' : 'update-status--latest'}`}>
                        {updateResult.available ? (
                            <>
                                <CheckCircle size={18} className="text-success" />
                                <div className="update-status__info">
                                    <p className="update-status__message">Version {updateResult.version} is available!</p>
                                    <a
                                        href={updateResult.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="update-status__link"
                                    >
                                        Download Now
                                    </a>
                                </div>
                            </>
                        ) : (
                            <>
                                <CheckCircle size={18} className="u-text-secondary" />
                                <p className="update-status__message">You are running the latest version.</p>
                            </>
                        )}
                    </div>
                )}
            </Card>

        </div>
    );
});

