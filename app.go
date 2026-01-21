package main

import (
	"context"

	"llm-desk/internal/models"
	"llm-desk/internal/services"
	"llm-desk/internal/storage"
)

// App struct - main application with all services
type App struct {
	ctx             context.Context
	storage         *storage.Storage
	providerService *services.ProviderService
	settingsService *services.SettingsService
	exportService   *services.ExportService
	fetcher         *services.ModelFetcher
}

// NewApp creates a new App application struct
func NewApp() *App {
	store, err := storage.New()
	if err != nil {
		panic("Failed to initialize storage: " + err.Error())
	}

	return &App{
		storage:         store,
		providerService: services.NewProviderService(store),
		settingsService: services.NewSettingsService(store),
		exportService:   services.NewExportService(store),
		fetcher:         services.NewModelFetcher(),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.exportService.SetContext(ctx)
}

// ============================================
// Settings Operations
// ============================================

// GetTheme returns the current theme setting
func (a *App) GetTheme() string {
	return a.settingsService.GetTheme()
}

// SetTheme sets and persists the theme setting
func (a *App) SetTheme(theme string) error {
	return a.settingsService.SetTheme(theme)
}

// ============================================
// Provider Operations
// ============================================

// GetAllProviders returns all providers
func (a *App) GetAllProviders() ([]models.Provider, error) {
	return a.providerService.GetAllProviders()
}

// GetProvider returns a provider by ID
func (a *App) GetProvider(id string) (*models.Provider, error) {
	return a.providerService.GetProvider(id)
}

// CreateProvider creates a new provider
func (a *App) CreateProvider(p models.Provider) (*models.Provider, error) {
	return a.providerService.CreateProvider(p)
}

// UpdateProvider updates an existing provider
func (a *App) UpdateProvider(id string, updates models.Provider) error {
	return a.providerService.UpdateProvider(id, updates)
}

// DeleteProvider deletes a provider by ID
func (a *App) DeleteProvider(id string) error {
	return a.providerService.DeleteProvider(id)
}

// UpdateCredentials updates provider API keys
func (a *App) UpdateCredentials(providerID string, keys []string) error {
	return a.providerService.UpdateCredentials(providerID, keys)
}

// SaveProviders saves all providers (bulk operation)
func (a *App) SaveProviders(providers []models.Provider) error {
	return a.providerService.SaveProviders(providers)
}

// ============================================
// Model Operations
// ============================================

// AddModel adds a model to a provider
func (a *App) AddModel(providerID string, m models.Model) error {
	return a.providerService.AddModel(providerID, m)
}

// UpdateModel updates a model in a provider
func (a *App) UpdateModel(providerID, modelID string, updates models.Model) error {
	return a.providerService.UpdateModel(providerID, modelID, updates)
}

// DeleteModel removes a model from a provider
func (a *App) DeleteModel(providerID, modelID string) error {
	return a.providerService.DeleteModel(providerID, modelID)
}

// ============================================
// Model Fetching (CORS-free API calls)
// ============================================

// FetchModels fetches available models from a provider's API
func (a *App) FetchModels(baseURL, apiKey string, anthropicURL *string) models.FetchModelsResult {
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
	return a.exportService.ExportData()
}

// ImportData imports provider data from a user-selected file
func (a *App) ImportData(mode string) (models.ImportResult, error) {
	return a.exportService.ImportData(mode)
}

// ============================================
// Data Management
// ============================================

// ClearAllData removes all stored data
func (a *App) ClearAllData() error {
	return a.providerService.ClearAllData()
}

// GetDataDir returns the data directory path (for debugging/info)
func (a *App) GetDataDir() string {
	return a.storage.GetDataDir()
}
