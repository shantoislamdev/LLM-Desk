package services

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"llm-desk/internal/models"
	"llm-desk/internal/storage"
)

// setupTestProviderService creates a temporary storage for testing
func setupTestProviderService(t *testing.T) (*ProviderService, func()) {
	t.Helper()

	tempDir, err := os.MkdirTemp("", "llmdesk-provider-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}

	// Create storage for testing
	testStore, _ := storage.New()

	service := NewProviderService(testStore)

	cleanup := func() {
		os.RemoveAll(tempDir)
		testStore.Clear()
	}

	return service, cleanup
}

func TestGenerateProviderID(t *testing.T) {
	tests := []struct {
		name     string
		expected string // prefix expected
	}{
		{"OpenAI", "openai-"},
		{"My Custom Provider", "my-custom-provider-"},
		{"Test_Provider-123", "test-provider-123-"},
		{"  Spaces  ", "spaces-"},
		{"UPPERCASE", "uppercase-"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			id := generateProviderID(tt.name)
			if !strings.HasPrefix(id, tt.expected) {
				t.Errorf("generateProviderID(%q) = %q, expected prefix %q", tt.name, id, tt.expected)
			}
			// Should have timestamp suffix
			parts := strings.Split(id, "-")
			if len(parts) < 2 {
				t.Errorf("Expected ID to have timestamp suffix: %s", id)
			}
		})
	}
}

func TestGenerateProviderID_Unique(t *testing.T) {
	id1 := generateProviderID("Test")
	time.Sleep(time.Millisecond) // Ensure different timestamps
	id2 := generateProviderID("Test")

	if id1 == id2 {
		t.Errorf("Expected unique IDs for same name, got: %s and %s", id1, id2)
	}
}

func TestProviderService_CreateProvider(t *testing.T) {
	service, cleanup := setupTestProviderService(t)
	defer cleanup()

	provider := models.Provider{
		Name:    "Test Provider",
		Enabled: true,
		Endpoints: models.Endpoints{
			OpenAI: "https://api.example.com/v1",
		},
		Credentials: models.Credentials{
			APIKeys: []string{},
		},
		Models: []models.Model{},
		Limits: []models.Limit{},
	}

	created, err := service.CreateProvider(provider)
	if err != nil {
		t.Fatalf("CreateProvider failed: %v", err)
	}

	if created.ID == "" {
		t.Error("Expected ID to be generated")
	}

	if !created.IsCustom {
		t.Error("Expected IsCustom to be true")
	}

	// Verify it's stored
	providers, err := service.GetAllProviders()
	if err != nil {
		t.Fatalf("GetAllProviders failed: %v", err)
	}

	found := false
	for _, p := range providers {
		if p.ID == created.ID {
			found = true
			break
		}
	}
	if !found {
		t.Error("Created provider not found in GetAllProviders")
	}
}

func TestProviderService_CreateProvider_Validation(t *testing.T) {
	service, cleanup := setupTestProviderService(t)
	defer cleanup()

	// Empty name should fail
	provider := models.Provider{
		Name: "",
	}

	_, err := service.CreateProvider(provider)
	if err == nil {
		t.Error("Expected error for empty name")
	}
}

func TestProviderService_GetProvider(t *testing.T) {
	service, cleanup := setupTestProviderService(t)
	defer cleanup()

	// Create a provider first
	provider := models.Provider{
		Name:    "Get Test Provider",
		Enabled: true,
		Endpoints: models.Endpoints{
			OpenAI: "https://api.example.com/v1",
		},
		Models: []models.Model{},
		Limits: []models.Limit{},
	}

	created, err := service.CreateProvider(provider)
	if err != nil {
		t.Fatalf("CreateProvider failed: %v", err)
	}

	// Get it back
	retrieved, err := service.GetProvider(created.ID)
	if err != nil {
		t.Fatalf("GetProvider failed: %v", err)
	}

	if retrieved.Name != provider.Name {
		t.Errorf("Expected name '%s', got '%s'", provider.Name, retrieved.Name)
	}
}

func TestProviderService_GetProvider_NotFound(t *testing.T) {
	service, cleanup := setupTestProviderService(t)
	defer cleanup()

	_, err := service.GetProvider("nonexistent-id")
	if err == nil {
		t.Error("Expected error for nonexistent provider")
	}
}

func TestProviderService_DeleteProvider(t *testing.T) {
	service, cleanup := setupTestProviderService(t)
	defer cleanup()

	// Create a provider
	provider := models.Provider{
		Name:      "Delete Test",
		Endpoints: models.Endpoints{OpenAI: "https://api.example.com"},
		Models:    []models.Model{},
		Limits:    []models.Limit{},
	}

	created, err := service.CreateProvider(provider)
	if err != nil {
		t.Fatalf("CreateProvider failed: %v", err)
	}

	// Delete it
	err = service.DeleteProvider(created.ID)
	if err != nil {
		t.Fatalf("DeleteProvider failed: %v", err)
	}

	// Verify it's gone
	_, err = service.GetProvider(created.ID)
	if err == nil {
		t.Error("Expected error getting deleted provider")
	}
}

func TestProviderService_AddModel(t *testing.T) {
	service, cleanup := setupTestProviderService(t)
	defer cleanup()

	// Create provider
	provider := models.Provider{
		Name:      "Model Test Provider",
		Endpoints: models.Endpoints{OpenAI: "https://api.example.com"},
		Models:    []models.Model{},
		Limits:    []models.Limit{},
	}

	created, err := service.CreateProvider(provider)
	if err != nil {
		t.Fatalf("CreateProvider failed: %v", err)
	}

	// Add model
	model := models.Model{
		ID:   "test-model",
		Name: "Test Model",
		Context: models.Context{
			MaxInput: 128000,
		},
	}

	err = service.AddModel(created.ID, model)
	if err != nil {
		t.Fatalf("AddModel failed: %v", err)
	}

	// Verify model was added
	retrieved, err := service.GetProvider(created.ID)
	if err != nil {
		t.Fatalf("GetProvider failed: %v", err)
	}

	if len(retrieved.Models) != 1 {
		t.Fatalf("Expected 1 model, got %d", len(retrieved.Models))
	}

	if retrieved.Models[0].ID != "test-model" {
		t.Errorf("Expected model ID 'test-model', got '%s'", retrieved.Models[0].ID)
	}
}

func TestProviderService_ClearAllData(t *testing.T) {
	service, cleanup := setupTestProviderService(t)
	defer cleanup()

	// Create some providers
	for i := 0; i < 3; i++ {
		provider := models.Provider{
			Name:      filepath.Join("Provider", string(rune('A'+i))),
			Endpoints: models.Endpoints{OpenAI: "https://api.example.com"},
			Models:    []models.Model{},
			Limits:    []models.Limit{},
		}
		_, err := service.CreateProvider(provider)
		if err != nil {
			t.Fatalf("CreateProvider failed: %v", err)
		}
	}

	// Clear all
	err := service.ClearAllData()
	if err != nil {
		t.Fatalf("ClearAllData failed: %v", err)
	}

	// Verify empty
	providers, err := service.GetAllProviders()
	if err != nil {
		t.Fatalf("GetAllProviders failed: %v", err)
	}

	if len(providers) != 0 {
		t.Errorf("Expected 0 providers after clear, got %d", len(providers))
	}
}
