package storage

import (
	"os"
	"path/filepath"
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
	}

	cleanup := func() {
		os.RemoveAll(tempDir)
	}

	return storage, cleanup
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
