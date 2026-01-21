import React, { useState } from 'react';
import { Snackbar } from 'minisnackbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, MobileNav } from '@/components/layout';
import { Dashboard, ModelsList, ProvidersList, ProviderDetail, Settings, ProviderForm, ModelForm } from '@/pages';
import { useSettings, useProviders } from '@/hooks';
import { ViewState, Provider, Model } from '@/types';
import '@/styles/index.css';

import { ConfirmationDialog } from '@/components/ui';

const App: React.FC = () => {
    const [view, setView] = useState<ViewState>('dashboard');
    const {
        theme,
        toggleTheme,
        crashReporting,
        toggleCrashReporting,
        checkForUpdates
    } = useSettings();
    const {
        providers,
        selectedProvider,
        setSelectedProvider,
        updateProviderKeys,
        clearAllData,
        addProvider,
        updateProvider,
        deleteProvider,
        addModel,
        updateModel,
        deleteModel,
        exportData,
        importDataFromFile
    } = useProviders();

    // Form state for editing
    const [editingModel, setEditingModel] = useState<Model | null>(null);

    // Confirmation Dialog State
    const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);

    // Alert Dialog State (for notifications)
    const [alertDialog, setAlertDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        isError?: boolean;
    }>({ isOpen: false, title: '', message: '' });

    const handleClearDataClick = () => {
        setIsClearDataDialogOpen(true);
    };

    const handleConfirmClearData = async () => {
        await clearAllData();
        setIsClearDataDialogOpen(false);
    };

    const handleExportData = async () => {
        try {
            const success = await exportData();
            if (success) {
                Snackbar.add('Data exported successfully');
            }
        } catch (e) {
            Snackbar.add('Failed to export data', {
                text: 'RETRY',
                handler: handleExportData
            });
        }
    };

    const handleProviderSelect = (p: Provider) => {
        setSelectedProvider(p);
        setView('provider-detail');
    };

    const handleNav = (target: ViewState) => {
        setView(target);
        if (target !== 'provider-detail' && target !== 'provider-form' && target !== 'model-form') {
            setSelectedProvider(null);
        }
        if (target !== 'model-form') {
            setEditingModel(null);
        }
    };

    // Provider form handlers
    const handleAddProvider = () => {
        setSelectedProvider(null);
        setView('provider-form');
    };

    const handleEditProvider = () => {
        setView('provider-form');
    };

    const handleProviderFormSubmit = async (providerData: Omit<Provider, 'id' | 'isCustom'>) => {
        if (selectedProvider) {
            // Editing existing provider
            await updateProvider(selectedProvider.id, providerData);
            setView('provider-detail');
        } else {
            // Adding new provider
            const newProvider = await addProvider(providerData);
            setSelectedProvider(newProvider);
            setView('provider-detail');
        }
    };

    const handleProviderFormBack = () => {
        if (selectedProvider) {
            setView('provider-detail');
        } else {
            handleNav('providers');
        }
    };

    const handleDeleteProvider = () => {
        if (selectedProvider) {
            deleteProvider(selectedProvider.id);
            handleNav('providers');
        }
    };

    // Model form handlers
    const handleAddModel = () => {
        setEditingModel(null);
        setView('model-form');
    };

    const handleEditModel = (model: Model) => {
        setEditingModel(model);
        setView('model-form');
    };

    const handleModelFormSubmit = (model: Model) => {
        if (!selectedProvider) return;

        if (editingModel) {
            updateModel(selectedProvider.id, model.id, model);
        } else {
            addModel(selectedProvider.id, model);
        }
        setEditingModel(null);
        setView('provider-detail');
    };

    const handleModelDelete = () => {
        if (selectedProvider && editingModel) {
            deleteModel(selectedProvider.id, editingModel.id);
            setEditingModel(null);
            setView('provider-detail');
        }
    };

    return (
        <div className="app-container">
            <Sidebar
                view={view}
                providers={providers}
                selectedProvider={selectedProvider}
                onNavigate={handleNav}
                onProviderSelect={handleProviderSelect}
            />

            <main className="main-content">
                <div className="main-content__scroll no-scrollbar">
                    <div className="main-content__container">
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={view + (selectedProvider?.id || '') + (editingModel?.id || '')}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                {view === 'dashboard' && (
                                    <Dashboard
                                        providers={providers}
                                        onNavigateToSettings={() => handleNav('settings')}
                                        onNavigateToAddProvider={handleAddProvider}
                                    />
                                )}

                                {view === 'providers' && (
                                    <ProvidersList
                                        providers={providers}
                                        onSelect={handleProviderSelect}
                                        onAddProvider={handleAddProvider}
                                        onNavigateToSettings={() => handleNav('settings')}
                                    />
                                )}

                                {view === 'models' && (
                                    <ModelsList
                                        providers={providers}
                                        onNavigateToSettings={() => handleNav('settings')}
                                        onNavigateToProviders={() => handleNav('providers')}
                                    />
                                )}

                                {view === 'provider-detail' && selectedProvider && (
                                    <ProviderDetail
                                        provider={selectedProvider}
                                        onBack={() => handleNav('providers')}
                                        onUpdateKeys={updateProviderKeys}
                                        onEditProvider={handleEditProvider}
                                        onDeleteProvider={selectedProvider.isCustom ? handleDeleteProvider : undefined}
                                        onEditModel={handleEditModel}
                                        onAddModel={handleAddModel}
                                    />
                                )}

                                {view === 'provider-form' && (
                                    <ProviderForm
                                        provider={selectedProvider || undefined}
                                        onBack={handleProviderFormBack}
                                        onSubmit={handleProviderFormSubmit}
                                    />
                                )}

                                {view === 'model-form' && selectedProvider && (
                                    <ModelForm
                                        provider={selectedProvider}
                                        model={editingModel || undefined}
                                        onBack={() => setView('provider-detail')}
                                        onSubmit={handleModelFormSubmit}
                                        onDelete={editingModel && selectedProvider.isCustom ? handleModelDelete : undefined}
                                    />
                                )}

                                {view === 'settings' && (
                                    <Settings
                                        theme={theme}
                                        toggleTheme={toggleTheme}
                                        onClearData={handleClearDataClick}
                                        onExportData={handleExportData}
                                        onImportData={importDataFromFile}
                                        crashReporting={crashReporting}
                                        toggleCrashReporting={toggleCrashReporting}
                                        onCheckForUpdates={checkForUpdates}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            <MobileNav view={view} onNavigate={handleNav} />

            {/* Clear Data Confirmation */}
            <ConfirmationDialog
                isOpen={isClearDataDialogOpen}
                onClose={() => setIsClearDataDialogOpen(false)}
                onConfirm={handleConfirmClearData}
                title="Clear All Data"
                message="Are you sure you want to delete all stored data? This action cannot be undone."
                confirmText="Clear Data"
                isDangerous={true}
            />

            {/* Alert Dialog */}
            <ConfirmationDialog
                isOpen={alertDialog.isOpen}
                onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => { }}
                title={alertDialog.title}
                message={alertDialog.message}
                confirmText="OK"
                cancelText={null}
                isDangerous={alertDialog.isError}
            />
        </div>
    );
};


export default App;
