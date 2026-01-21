package main

import (
	"context"

	"llm-desk/internal/logger"
	"llm-desk/internal/models"
	"llm-desk/internal/services"
	"llm-desk/internal/storage"
	"llm-desk/internal/version"
)

// App struct - main application with all services
type App struct {
	ctx             context.Context
	storage         *storage.Storage
	providerService *services.ProviderService
	settingsService *services.SettingsService
	exportService   *services.ExportService
	fetcher         *services.ModelFetcher
	initError       error // Stores initialization error for graceful handling
}

// NewApp creates a new App application struct
// Returns App even on error - check initError for initialization failures
func NewApp() *App {
	app := &App{}

	// Initialize logger first
	if err := logger.Init(logger.Config{
		Level:   "info",
		Console: true,
	}); err != nil {
		// Log to stderr if logger fails, but continue
		println("Warning: Failed to initialize logger:", err.Error())
	}

	logger.Info("Starting LLM Desk application")

	// Initialize storage
	store, err := storage.New()
	if err != nil {
		logger.Error("Failed to initialize storage", "error", err)
		app.initError = err
		return app
	}

	logger.Info("Storage initialized", "dataDir", store.GetDataDir())

	app.storage = store
	app.providerService = services.NewProviderService(store)
	app.settingsService = services.NewSettingsService(store)
	app.exportService = services.NewExportService(store)
	app.fetcher = services.NewModelFetcher()

	// Clean old logs on startup (keep 7 days)
	go func() {
		if err := logger.Get().CleanOldLogs(7); err != nil {
			logger.Warn("Failed to clean old logs", "error", err)
		}
	}()

	logger.Info("Application initialized successfully")
	return app
}

// HasInitError returns true if there was an initialization error
func (a *App) HasInitError() bool {
	return a.initError != nil
}

// GetInitError returns the initialization error message
func (a *App) GetInitError() string {
	if a.initError != nil {
		return a.initError.Error()
	}
	return ""
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	if a.exportService != nil {
		a.exportService.SetContext(ctx)
	}
	logger.Info("Application startup complete", "version", version.GetVersion())
}

// GetVersion returns the application version
func (a *App) GetVersion() string {
	return version.GetVersion()
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	logger.Info("Application shutting down")
	if err := logger.Get().Close(); err != nil {
		println("Warning: Failed to close logger:", err.Error())
	}
}

// ============================================
// Settings Operations
// ============================================

// GetTheme returns the current theme setting
func (a *App) GetTheme() string {
	if a.settingsService == nil {
		return "dark"
	}
	return a.settingsService.GetTheme()
}

// SetTheme sets and persists the theme setting
func (a *App) SetTheme(theme string) error {
	if a.settingsService == nil {
		return a.initError
	}
	logger.Debug("Setting theme", "theme", theme)
	return a.settingsService.SetTheme(theme)
}

// ============================================
// Provider Operations
// ============================================

// GetAllProviders returns all providers
func (a *App) GetAllProviders() ([]models.Provider, error) {
	if a.providerService == nil {
		return nil, a.initError
	}
	providers, err := a.providerService.GetAllProviders()
	if err != nil {
		logger.Error("Failed to get providers", "error", err)
	}
	return providers, err
}

// GetProvider returns a provider by ID
func (a *App) GetProvider(id string) (*models.Provider, error) {
	if a.providerService == nil {
		return nil, a.initError
	}
	return a.providerService.GetProvider(id)
}

// CreateProvider creates a new provider
func (a *App) CreateProvider(p models.Provider) (*models.Provider, error) {
	if a.providerService == nil {
		return nil, a.initError
	}
	logger.Info("Creating provider", "name", p.Name)
	provider, err := a.providerService.CreateProvider(p)
	if err != nil {
		logger.Error("Failed to create provider", "name", p.Name, "error", err)
	}
	return provider, err
}

// UpdateProvider updates an existing provider
func (a *App) UpdateProvider(id string, updates models.Provider) error {
	if a.providerService == nil {
		return a.initError
	}
	logger.Info("Updating provider", "id", id)
	err := a.providerService.UpdateProvider(id, updates)
	if err != nil {
		logger.Error("Failed to update provider", "id", id, "error", err)
	}
	return err
}

// DeleteProvider deletes a provider by ID
func (a *App) DeleteProvider(id string) error {
	if a.providerService == nil {
		return a.initError
	}
	logger.Info("Deleting provider", "id", id)
	err := a.providerService.DeleteProvider(id)
	if err != nil {
		logger.Error("Failed to delete provider", "id", id, "error", err)
	}
	return err
}

// UpdateCredentials updates provider API keys
func (a *App) UpdateCredentials(providerID string, keys []string) error {
	if a.providerService == nil {
		return a.initError
	}
	logger.Info("Updating credentials", "providerId", providerID, "keyCount", len(keys))
	return a.providerService.UpdateCredentials(providerID, keys)
}

// SaveProviders saves all providers (bulk operation)
func (a *App) SaveProviders(providers []models.Provider) error {
	if a.providerService == nil {
		return a.initError
	}
	logger.Info("Saving providers", "count", len(providers))
	return a.providerService.SaveProviders(providers)
}

// ============================================
// Model Operations
// ============================================

// AddModel adds a model to a provider
func (a *App) AddModel(providerID string, m models.Model) error {
	if a.providerService == nil {
		return a.initError
	}
	logger.Info("Adding model", "providerId", providerID, "modelId", m.ID)
	err := a.providerService.AddModel(providerID, m)
	if err != nil {
		logger.Error("Failed to add model", "providerId", providerID, "modelId", m.ID, "error", err)
	}
	return err
}

// UpdateModel updates a model in a provider
func (a *App) UpdateModel(providerID, modelID string, updates models.Model) error {
	if a.providerService == nil {
		return a.initError
	}
	logger.Info("Updating model", "providerId", providerID, "modelId", modelID)
	err := a.providerService.UpdateModel(providerID, modelID, updates)
	if err != nil {
		logger.Error("Failed to update model", "providerId", providerID, "modelId", modelID, "error", err)
	}
	return err
}

// DeleteModel removes a model from a provider
func (a *App) DeleteModel(providerID, modelID string) error {
	if a.providerService == nil {
		return a.initError
	}
	logger.Info("Deleting model", "providerId", providerID, "modelId", modelID)
	err := a.providerService.DeleteModel(providerID, modelID)
	if err != nil {
		logger.Error("Failed to delete model", "providerId", providerID, "modelId", modelID, "error", err)
	}
	return err
}

// ============================================
// Model Fetching (CORS-free API calls)
// ============================================

// FetchModels fetches available models from a provider's API
func (a *App) FetchModels(baseURL, apiKey string, anthropicURL *string) models.FetchModelsResult {
	if a.fetcher == nil {
		return models.FetchModelsResult{Error: "Application not initialized"}
	}
	logger.Debug("Fetching models", "baseURL", baseURL)
	return a.fetcher.FetchModels(baseURL, apiKey, anthropicURL)
}

// TransformFetchedModel converts a fetched model to our Model type
func (a *App) TransformFetchedModel(fetched models.FetchedModel) models.Model {
	return services.TransformFetchedModel(fetched)
}

// ============================================
// Import/Export Operations
// ============================================

// ExportData exports all provider data to a user-selected file
func (a *App) ExportData() (bool, error) {
	if a.exportService == nil {
		return false, a.initError
	}
	logger.Info("Exporting data")
	return a.exportService.ExportData()
}

// ImportData imports provider data from a user-selected file
func (a *App) ImportData(mode string) (models.ImportResult, error) {
	if a.exportService == nil {
		return models.ImportResult{}, a.initError
	}
	logger.Info("Importing data", "mode", mode)
	return a.exportService.ImportData(mode)
}

// ============================================
// Data Management
// ============================================

// ClearAllData removes all stored data
func (a *App) ClearAllData() error {
	if a.providerService == nil {
		return a.initError
	}
	logger.Warn("Clearing all data")
	return a.providerService.ClearAllData()
}

// GetDataDir returns the data directory path (for debugging/info)
func (a *App) GetDataDir() string {
	if a.storage == nil {
		return ""
	}
	return a.storage.GetDataDir()
}

// GetLogDir returns the log directory path
func (a *App) GetLogDir() string {
	return logger.Get().GetLogDir()
}
