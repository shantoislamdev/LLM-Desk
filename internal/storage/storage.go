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
	keyring  KeyringManager
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
		keyring:  NewKeyringStore(),
	}, nil
}

// GetDataDir returns the data directory path
func (s *Storage) GetDataDir() string {
	return s.dataDir
}

// Load reads providers from the JSON file and injects keys from keyring
func (s *Storage) Load() ([]models.Provider, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

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

	// Handle secure key migration and injection
	needsMigration := false
	for i := range providers {
		p := &providers[i]

		// 1. Check if keys exist in JSON (needs migration)
		if len(p.Credentials.APIKeys) > 0 {
			if err := s.keyring.SetKeys(p.ID, p.Credentials.APIKeys); err != nil {
				// Log error but continue with what we have
				continue
			}
			needsMigration = true
		}

		// 2. Fetch/Inject keys from keyring
		keys, err := s.keyring.GetKeys(p.ID)
		if err != nil {
			// Log error
			continue
		}
		p.Credentials.APIKeys = keys
	}

	// 3. If migration happened, we need to save the scrubbed version to JSON
	// Since we hold the Lock, this is safe and atomic.
	if needsMigration {
		if err := s.saveToFile(providers); err != nil {
			// We continue even if save fails, but log it would be ideal
			// For now just return the providers as they are valid in memory
		}
	}

	return providers, nil
}

// Save writes providers to the JSON file after securely storing keys in keyring
// Save writes providers to the JSON file after securely storing keys in keyring
func (s *Storage) Save(providers []models.Provider) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.saveToFile(providers)
}

// saveToFile writes providers to JSON, scrubbing sensitive keys.
// NOTE: Caller MUST hold s.mu.Lock()
func (s *Storage) saveToFile(providers []models.Provider) error {
	// Create a sanitized copy for JSON storage (scrubbed of keys)
	scrubbed := make([]models.Provider, len(providers))
	for i, p := range providers {
		// Save keys to keyring first
		if len(p.Credentials.APIKeys) > 0 {
			if err := s.keyring.SetKeys(p.ID, p.Credentials.APIKeys); err != nil {
				return err
			}
		}

		// Copy and scrub
		scrubbed[i] = p
		scrubbed[i].Credentials.APIKeys = []string{}
	}

	data, err := json.MarshalIndent(scrubbed, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.filename, data, 0644)
}

// ExportToFile exports data to a specified file path
func (s *Storage) ExportToFile(filepath string, data *models.LLMDeskData) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return os.WriteFile(filepath, jsonData, 0644)
}

// ExportEncryptedToFile exports data to a specified file path with encryption
func (s *Storage) ExportEncryptedToFile(filepath string, data *models.LLMDeskData, passphrase string) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	encryptedData, err := Encrypt(jsonData, passphrase)
	if err != nil {
		return err
	}

	return os.WriteFile(filepath, encryptedData, 0644)
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

// ImportEncryptedFromFile reads and decrypts a backup file
func (s *Storage) ImportEncryptedFromFile(filepath string, passphrase string) (*models.LLMDeskData, error) {
	encryptedData, err := os.ReadFile(filepath)
	if err != nil {
		return nil, err
	}

	jsonData, err := Decrypt(encryptedData, passphrase)
	if err != nil {
		return nil, err
	}

	var llmData models.LLMDeskData
	if err := json.Unmarshal(jsonData, &llmData); err != nil {
		return nil, err
	}

	return &llmData, nil
}

// Clear removes all stored data from JSON and keyring
func (s *Storage) Clear() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// 1. Try to load providers to find IDs to delete from keyring
	data, err := os.ReadFile(s.filename)
	if err == nil {
		var providers []models.Provider
		if err := json.Unmarshal(data, &providers); err == nil {
			for _, p := range providers {
				s.keyring.DeleteKeys(p.ID)
			}
		}
	}

	// 2. Delete the file
	if err := os.Remove(s.filename); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}

// AppSettings represents user preferences (defined here to avoid import cycle)
type AppSettings struct {
	Theme                string `json:"theme"`
	FollowSystemTheme    bool   `json:"followSystemTheme"`
	EnableCrashReporting bool   `json:"enableCrashReporting"`
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
