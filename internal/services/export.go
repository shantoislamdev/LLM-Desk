package services

import (
	"context"
	"time"

	"llm-desk/internal/models"
	"llm-desk/internal/storage"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const schemaVersion = "1.0.0"

// ExportService handles data import/export operations
type ExportService struct {
	ctx     context.Context
	storage *storage.Storage
}

// NewExportService creates a new ExportService
func NewExportService(s *storage.Storage) *ExportService {
	return &ExportService{storage: s}
}

// SetContext sets the Wails runtime context
func (s *ExportService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// ExportData exports all provider data to a user-selected file
func (s *ExportService) ExportData() (bool, error) {
	// Get current date for default filename
	date := time.Now().Format("2006-01-02")
	defaultFilename := "llm-desk-backup-" + date + ".json"

	// Show save dialog
	filepath, err := runtime.SaveFileDialog(s.ctx, runtime.SaveDialogOptions{
		DefaultFilename: defaultFilename,
		Title:           "Export LLM Desk Data",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON Files (*.json)", Pattern: "*.json"},
		},
	})

	if err != nil {
		return false, err
	}

	// User cancelled
	if filepath == "" {
		return false, nil
	}

	// Load providers
	providers, err := s.storage.Load()
	if err != nil {
		return false, err
	}

	// Create export data
	now := time.Now().Format(time.RFC3339)
	description := "LLM Desk configuration export"
	data := &models.LLMDeskData{
		Version: schemaVersion,
		Metadata: models.Metadata{
			CreatedAt:   now,
			ModifiedAt:  now,
			Generator:   "llm-desk",
			Description: &description,
		},
		Providers: providers,
	}

	// Write to file
	if err := s.storage.ExportToFile(filepath, data); err != nil {
		return false, err
	}

	return true, nil
}

// ImportData imports provider data from a user-selected file
func (s *ExportService) ImportData(mode string) (models.ImportResult, error) {
	// Show open dialog
	filepath, err := runtime.OpenFileDialog(s.ctx, runtime.OpenDialogOptions{
		Title: "Import LLM Desk Data",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON Files (*.json)", Pattern: "*.json"},
		},
	})

	if err != nil {
		return models.ImportResult{
			Success: false,
			Message: err.Error(),
		}, err
	}

	// User cancelled
	if filepath == "" {
		return models.ImportResult{
			Success: false,
			Message: "Import cancelled",
		}, nil
	}

	// Read and parse file
	importedData, err := s.storage.ImportFromFile(filepath)
	if err != nil {
		return models.ImportResult{
			Success:  false,
			Message:  "Failed to parse import file: " + err.Error(),
			Warnings: []string{},
		}, nil
	}

	// Validate data
	warnings := []string{}
	if importedData.Version == "" {
		warnings = append(warnings, "No version specified in import file")
	}

	// Get current providers
	currentProviders, err := s.storage.Load()
	if err != nil {
		currentProviders = []models.Provider{}
	}

	var finalProviders []models.Provider
	importedProviderCount := len(importedData.Providers)
	importedModelCount := 0

	for _, p := range importedData.Providers {
		importedModelCount += len(p.Models)
	}

	importMode := models.ImportMode(mode)

	switch importMode {
	case models.ImportModeReplace:
		// Replace all data
		finalProviders = importedData.Providers

	case models.ImportModeMerge:
		// Merge with existing data
		finalProviders = currentProviders

		for _, importedProvider := range importedData.Providers {
			found := false
			for i, existingProvider := range finalProviders {
				if existingProvider.ID == importedProvider.ID {
					// Update existing provider
					finalProviders[i] = importedProvider
					found = true
					break
				}
			}
			if !found {
				// Add new provider
				finalProviders = append(finalProviders, importedProvider)
			}
		}

	default:
		return models.ImportResult{
			Success: false,
			Message: "Invalid import mode: " + mode,
		}, nil
	}

	// Save the merged/replaced data
	if err := s.storage.Save(finalProviders); err != nil {
		return models.ImportResult{
			Success: false,
			Message: "Failed to save imported data: " + err.Error(),
		}, nil
	}

	return models.ImportResult{
		Success:  true,
		Message:  "Successfully imported data",
		Warnings: warnings,
		Imported: struct {
			Providers int `json:"providers"`
			Models    int `json:"models"`
		}{
			Providers: importedProviderCount,
			Models:    importedModelCount,
		},
	}, nil
}
