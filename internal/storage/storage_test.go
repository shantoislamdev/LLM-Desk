package storage

import (
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"llm-desk/internal/models"
)

func setupTestStorage(t *testing.T) (*Storage, func()) {
	t.Helper()

	// Create temp directory for tests
	tempDir, err := os.MkdirTemp("", "llmdesk-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}

	storage := &Storage{
		dataDir:  tempDir,
		filename: filepath.Join(tempDir, "providers.json"),
		keyring:  &MockKeyringStore{store: make(map[string]string)},
	}

	cleanup := func() {
		os.RemoveAll(tempDir)
	}

	return storage, cleanup
}

type MockKeyringStore struct {
	store map[string]string
}

func (m *MockKeyringStore) SetKeys(providerID string, keys []string) error {
	if m.store == nil {
		m.store = make(map[string]string)
	}
	data, err := json.Marshal(keys)
	if err != nil {
		return err
	}
	m.store[providerID] = string(data)
	return nil
}

func (m *MockKeyringStore) GetKeys(providerID string) ([]string, error) {
	if m.store == nil {
		return []string{}, nil
	}
	data, ok := m.store[providerID]
	if !ok {
		return []string{}, nil
	}
	var keys []string
	if err := json.Unmarshal([]byte(data), &keys); err != nil {
		return nil, err
	}
	return keys, nil
}

func (m *MockKeyringStore) DeleteKeys(providerID string) error {
	if m.store != nil {
		delete(m.store, providerID)
	}
	return nil
}

func TestStorage_LoadEmpty(t *testing.T) {
	storage, cleanup := setupTestStorage(t)
	defer cleanup()

	providers, err := storage.Load()
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}

	if len(providers) != 0 {
		t.Errorf("Expected empty providers, got %d", len(providers))
	}
}

func TestStorage_SaveAndLoad(t *testing.T) {
	storage, cleanup := setupTestStorage(t)
	defer cleanup()

	testProviders := []models.Provider{
		{
			ID:      "test-provider-1",
			Name:    "Test Provider 1",
			Enabled: true,
			Credentials: models.Credentials{
				APIKeys: []string{"key1", "key2"},
			},
			Endpoints: models.Endpoints{
				OpenAI: "https://api.example.com/v1",
			},
			Models: []models.Model{},
			Limits: []models.Limit{},
		},
	}

	// Save
	if err := storage.Save(testProviders); err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	// Verify file exists
	if _, err := os.Stat(storage.filename); os.IsNotExist(err) {
		t.Error("Expected file to exist after save")
	}

	// Load and verify
	loaded, err := storage.Load()
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}

	if len(loaded) != 1 {
		t.Fatalf("Expected 1 provider, got %d", len(loaded))
	}

	if loaded[0].ID != testProviders[0].ID {
		t.Errorf("Expected ID '%s', got '%s'", testProviders[0].ID, loaded[0].ID)
	}

	if loaded[0].Name != testProviders[0].Name {
		t.Errorf("Expected Name '%s', got '%s'", testProviders[0].Name, loaded[0].Name)
	}

	if len(loaded[0].Credentials.APIKeys) != 2 {
		t.Errorf("Expected 2 API keys, got %d", len(loaded[0].Credentials.APIKeys))
	}
}

func TestStorage_Clear(t *testing.T) {
	storage, cleanup := setupTestStorage(t)
	defer cleanup()

	// First save some data
	testProviders := []models.Provider{
		{ID: "test", Name: "Test", Endpoints: models.Endpoints{}, Limits: []models.Limit{}},
	}
	if err := storage.Save(testProviders); err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	// Verify file exists
	if _, err := os.Stat(storage.filename); os.IsNotExist(err) {
		t.Fatal("Expected file to exist after save")
	}

	// Clear
	if err := storage.Clear(); err != nil {
		t.Fatalf("Clear failed: %v", err)
	}

	// Verify file is gone
	if _, err := os.Stat(storage.filename); !os.IsNotExist(err) {
		t.Error("Expected file to be deleted after clear")
	}

	// Load should return empty after clear
	providers, err := storage.Load()
	if err != nil {
		t.Fatalf("Load after clear failed: %v", err)
	}
	if len(providers) != 0 {
		t.Errorf("Expected empty providers after clear, got %d", len(providers))
	}
}

func TestStorage_ClearNonExistent(t *testing.T) {
	storage, cleanup := setupTestStorage(t)
	defer cleanup()

	// Clear on non-existent file should not error
	if err := storage.Clear(); err != nil {
		t.Errorf("Clear on non-existent file should not error: %v", err)
	}
}

func TestStorage_GetDataDir(t *testing.T) {
	storage, cleanup := setupTestStorage(t)
	defer cleanup()

	dataDir := storage.GetDataDir()
	if dataDir != storage.dataDir {
		t.Errorf("Expected dataDir '%s', got '%s'", storage.dataDir, dataDir)
	}
}

func TestStorage_ExportAndImport(t *testing.T) {
	storage, cleanup := setupTestStorage(t)
	defer cleanup()

	exportPath := filepath.Join(storage.dataDir, "export.json")

	testData := &models.LLMDeskData{
		Version: "1.0",
		Metadata: models.Metadata{
			CreatedAt:  "2026-01-01T00:00:00Z",
			ModifiedAt: "2026-01-01T00:00:00Z",
			Generator:  "test",
		},
		Providers: []models.Provider{
			{
				ID:        "exported-provider",
				Name:      "Exported Provider",
				Endpoints: models.Endpoints{OpenAI: "https://api.example.com"},
				Limits:    []models.Limit{},
				Models:    []models.Model{},
			},
		},
	}

	// Export
	if err := storage.ExportToFile(exportPath, testData); err != nil {
		t.Fatalf("Export failed: %v", err)
	}

	// Verify export file exists
	if _, err := os.Stat(exportPath); os.IsNotExist(err) {
		t.Fatal("Expected export file to exist")
	}

	// Import
	imported, err := storage.ImportFromFile(exportPath)
	if err != nil {
		t.Fatalf("Import failed: %v", err)
	}

	if imported.Version != testData.Version {
		t.Errorf("Expected version '%s', got '%s'", testData.Version, imported.Version)
	}

	if len(imported.Providers) != 1 {
		t.Fatalf("Expected 1 provider, got %d", len(imported.Providers))
	}

	if imported.Providers[0].ID != "exported-provider" {
		t.Errorf("Expected provider ID 'exported-provider', got '%s'", imported.Providers[0].ID)
	}
}

func TestStorage_ImportNonExistent(t *testing.T) {
	storage, cleanup := setupTestStorage(t)
	defer cleanup()

	_, err := storage.ImportFromFile(filepath.Join(storage.dataDir, "nonexistent.json"))
	if err == nil {
		t.Error("Expected error when importing non-existent file")
	}
}

func TestStorage_Settings(t *testing.T) {
	storage, cleanup := setupTestStorage(t)
	defer cleanup()

	// Load settings when none exist
	settings, err := storage.LoadSettings()
	if err != nil {
		t.Fatalf("LoadSettings failed: %v", err)
	}
	if settings != nil {
		t.Error("Expected nil settings when none saved")
	}

	// Save settings
	testSettings := &AppSettings{Theme: "dark"}
	if err := storage.SaveSettings(testSettings); err != nil {
		t.Fatalf("SaveSettings failed: %v", err)
	}

	// Load and verify
	loaded, err := storage.LoadSettings()
	if err != nil {
		t.Fatalf("LoadSettings after save failed: %v", err)
	}
	if loaded == nil {
		t.Fatal("Expected non-nil settings after save")
	}
	if loaded.Theme != "dark" {
		t.Errorf("Expected theme 'dark', got '%s'", loaded.Theme)
	}
}

func TestStorage_EncryptedExportImport(t *testing.T) {
	storage, cleanup := setupTestStorage(t)
	defer cleanup()

	exportPath := filepath.Join(storage.dataDir, "encrypted_export.bin")
	passphrase := "secret-pass"

	testData := &models.LLMDeskData{
		Version:  "1.0",
		Metadata: models.Metadata{CreatedAt: "now", Generator: "test"},
		Providers: []models.Provider{
			{ID: "p1", Name: "Encrypted P1", Endpoints: models.Endpoints{}, Limits: []models.Limit{}, Models: []models.Model{}},
		},
	}

	// 1. Export Encrypted
	if err := storage.ExportEncryptedToFile(exportPath, testData, passphrase); err != nil {
		t.Fatalf("Encrypted export failed: %v", err)
	}

	// 2. Verify file is not plaintext JSON
	content, _ := os.ReadFile(exportPath)
	if strings.Contains(string(content), "Encrypted P1") {
		t.Error("Exported file appears to be plaintext, expected encrypted")
	}

	// 3. Import with WRONG passphrase should fail
	_, err := storage.ImportEncryptedFromFile(exportPath, "wrong")
	if err == nil {
		t.Error("Import with wrong passphrase should have failed")
	}

	// 4. Import with CORRECT passphrase should succeed
	imported, err := storage.ImportEncryptedFromFile(exportPath, passphrase)
	if err != nil {
		t.Fatalf("Import with correct passphrase failed: %v", err)
	}

	if imported.Providers[0].Name != "Encrypted P1" {
		t.Errorf("Imported data mismatch, got name: %s", imported.Providers[0].Name)
	}
}

func TestStorage_Scrubbing(t *testing.T) {
	storage, cleanup := setupTestStorage(t)
	defer cleanup()

	testProviders := []models.Provider{
		{
			ID:   "secret-provider",
			Name: "Secret Provider",
			Credentials: models.Credentials{
				APIKeys: []string{"super-secret-key-123"},
			},
			Endpoints: models.Endpoints{OpenAI: "https://api.example.com"},
			Limits:    []models.Limit{},
			Models:    []models.Model{},
		},
	}

	// Save
	if err := storage.Save(testProviders); err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	// 1. Verify Load still returns the keys (they should be injected from keyring)
	loaded, err := storage.Load()
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if len(loaded[0].Credentials.APIKeys) == 0 || loaded[0].Credentials.APIKeys[0] != "super-secret-key-123" {
		t.Errorf("Expected keys to be available after Load, got %v", loaded[0].Credentials.APIKeys)
	}

	// 2. EXPLICITLY check the JSON file content to ensure keys are NOT there
	file, err := os.Open(storage.filename)
	if err != nil {
		t.Fatalf("Failed to open storage file: %v", err)
	}
	defer file.Close()

	content, err := io.ReadAll(file)
	if err != nil {
		t.Fatalf("Failed to read storage file: %v", err)
	}

	if strings.Contains(string(content), "super-secret-key-123") {
		t.Error("SECURITY BREACH: Persistent JSON file contains plaintext API key!")
	}

	// 3. Verify apiKeys field is an empty array in the JSON
	var raw []map[string]interface{}
	if err := json.Unmarshal(content, &raw); err != nil {
		t.Fatalf("Failed to unmarshal raw JSON: %v", err)
	}

	creds := raw[0]["credentials"].(map[string]interface{})
	keys := creds["apiKeys"].([]interface{})
	if len(keys) != 0 {
		t.Errorf("Expected apiKeys to be empty in JSON, got %v", keys)
	}
}

func TestStorage_ExportMinified(t *testing.T) {
	storage, cleanup := setupTestStorage(t)
	defer cleanup()

	exportPath := filepath.Join(storage.dataDir, "export_minified.json")

	testData := &models.LLMDeskData{
		Version: "1.0",
		Metadata: models.Metadata{
			CreatedAt:  "2026-01-01T00:00:00Z",
			ModifiedAt: "2026-01-01T00:00:00Z",
			Generator:  "test",
		},
		Providers: []models.Provider{
			{
				ID:        "p1",
				Name:      "Provider 1",
				Endpoints: models.Endpoints{OpenAI: "url"},
				Limits:    []models.Limit{},
				Models:    []models.Model{},
			},
			{
				ID:        "p2",
				Name:      "Provider 2",
				Endpoints: models.Endpoints{OpenAI: "url"},
				Limits:    []models.Limit{},
				Models:    []models.Model{},
			},
		},
	}

	// Export
	if err := storage.ExportToFile(exportPath, testData); err != nil {
		t.Fatalf("Export failed: %v", err)
	}

	// Read content
	content, err := os.ReadFile(exportPath)
	if err != nil {
		t.Fatalf("Failed to read export file: %v", err)
	}

	// Verify no newlines (except possibly EOF, but json.Marshal doesn't add one)
	if strings.Contains(string(content), "\n") {
		t.Error("Exported JSON contains newlines; it is not minified")
	}

	// Verify it still parses
	var imported models.LLMDeskData
	if err := json.Unmarshal(content, &imported); err != nil {
		t.Errorf("Failed to parse minified JSON: %v", err)
	}

	if len(imported.Providers) != 2 {
		t.Errorf("Expected 2 providers, got %d", len(imported.Providers))
	}
}
