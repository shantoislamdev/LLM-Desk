package storage

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"

	"llm-desk/internal/models"
)

// Storage handles file-based persistence for provider data
type Storage struct {
	dataDir  string
	filename string
	mu       sync.RWMutex
}

// New creates a new Storage instance
func New() (*Storage, error) {
	dataDir, err := os.UserConfigDir()
	if err != nil {
		return nil, err
	}

	appDir := filepath.Join(dataDir, "LLMDesk")
	if err := os.MkdirAll(appDir, 0755); err != nil {
		return nil, err
	}

	return &Storage{
		dataDir:  appDir,
		filename: filepath.Join(appDir, "providers.json"),
	}, nil
}

// GetDataDir returns the data directory path
func (s *Storage) GetDataDir() string {
	return s.dataDir
}

// Load reads providers from the JSON file
func (s *Storage) Load() ([]models.Provider, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	data, err := os.ReadFile(s.filename)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return []models.Provider{}, nil
		}
		return nil, err
	}

	var providers []models.Provider
	if err := json.Unmarshal(data, &providers); err != nil {
		return nil, err
	}

	return providers, nil
}

// Save writes providers to the JSON file
func (s *Storage) Save(providers []models.Provider) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := json.MarshalIndent(providers, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.filename, data, 0644)
}

// ExportToFile exports data to a specified file path
func (s *Storage) ExportToFile(filepath string, data *models.LLMDeskData) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(filepath, jsonData, 0644)
}

// ImportFromFile reads and parses a backup file
func (s *Storage) ImportFromFile(filepath string) (*models.LLMDeskData, error) {
	data, err := os.ReadFile(filepath)
	if err != nil {
		return nil, err
	}

	var llmData models.LLMDeskData
	if err := json.Unmarshal(data, &llmData); err != nil {
		return nil, err
	}

	return &llmData, nil
}

// Clear removes all stored data
func (s *Storage) Clear() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if err := os.Remove(s.filename); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}

// AppSettings represents user preferences (defined here to avoid import cycle)
type AppSettings struct {
	Theme string `json:"theme"`
}

// settingsFilename returns the path to the settings file
func (s *Storage) settingsFilename() string {
	return filepath.Join(s.dataDir, "settings.json")
}

// LoadSettings reads settings from the JSON file
func (s *Storage) LoadSettings() (*AppSettings, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	data, err := os.ReadFile(s.settingsFilename())
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, nil // No settings file yet
		}
		return nil, err
	}

	var settings AppSettings
	if err := json.Unmarshal(data, &settings); err != nil {
		return nil, err
	}

	return &settings, nil
}

// SaveSettings writes settings to the JSON file
func (s *Storage) SaveSettings(settings *AppSettings) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.settingsFilename(), data, 0644)
}
