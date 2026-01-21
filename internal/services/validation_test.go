package services

import (
	"testing"

	"llm-desk/internal/models"
)

func TestValidateProvider_ValidProvider(t *testing.T) {
	p := &models.Provider{
		Name: "Test Provider",
		Endpoints: models.Endpoints{
			OpenAI: "https://api.example.com/v1",
		},
	}

	result := ValidateProvider(p)
	if !result.Valid {
		t.Errorf("Expected valid provider, got errors: %v", result.Errors)
	}
}

func TestValidateProvider_EmptyName(t *testing.T) {
	p := &models.Provider{
		Name: "",
	}

	result := ValidateProvider(p)
	if result.Valid {
		t.Error("Expected invalid provider for empty name")
	}
	if len(result.Errors) == 0 {
		t.Error("Expected at least one error")
	}
	if result.Errors[0].Field != "name" {
		t.Errorf("Expected error on 'name' field, got '%s'", result.Errors[0].Field)
	}
}

func TestValidateProvider_WhitespaceName(t *testing.T) {
	p := &models.Provider{
		Name: "   ",
	}

	result := ValidateProvider(p)
	if result.Valid {
		t.Error("Expected invalid provider for whitespace-only name")
	}
}

func TestValidateProvider_NameTooLong(t *testing.T) {
	longName := ""
	for i := 0; i < MaxProviderNameLength+1; i++ {
		longName += "a"
	}
	p := &models.Provider{
		Name: longName,
	}

	result := ValidateProvider(p)
	if result.Valid {
		t.Errorf("Expected invalid provider for name exceeding %d characters", MaxProviderNameLength)
	}
}

func TestValidateProvider_InvalidOpenAIURL(t *testing.T) {
	tests := []struct {
		name     string
		url      string
		expected bool
	}{
		{"Valid HTTPS URL", "https://api.openai.com/v1", true},
		{"Valid HTTP URL", "http://localhost:8080/v1", true},
		{"Missing scheme", "api.openai.com/v1", false},
		{"FTP scheme", "ftp://api.openai.com/v1", false},
		{"Just host", "localhost", false},
		{"Empty with valid name", "", true}, // Empty is allowed
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := &models.Provider{
				Name:      "Test Provider",
				Endpoints: models.Endpoints{OpenAI: tt.url},
			}
			result := ValidateProvider(p)
			if result.Valid != tt.expected {
				t.Errorf("URL '%s': expected valid=%v, got valid=%v, errors=%v",
					tt.url, tt.expected, result.Valid, result.Errors)
			}
		})
	}
}

func TestValidateProvider_InvalidAnthropicURL(t *testing.T) {
	invalidURL := "not-a-url"
	p := &models.Provider{
		Name: "Test Provider",
		Endpoints: models.Endpoints{
			OpenAI:    "https://api.example.com/v1",
			Anthropic: &invalidURL,
		},
	}

	result := ValidateProvider(p)
	if result.Valid {
		t.Error("Expected invalid provider for invalid Anthropic URL")
	}
}

func TestValidateModel_ValidModel(t *testing.T) {
	m := &models.Model{
		ID:   "gpt-4",
		Name: "GPT-4",
		Pricing: models.Pricing{
			Input:  10.0,
			Output: 30.0,
		},
		Context: models.Context{
			MaxInput: 128000,
		},
	}

	result := ValidateModel(m)
	if !result.Valid {
		t.Errorf("Expected valid model, got errors: %v", result.Errors)
	}
}

func TestValidateModel_EmptyID(t *testing.T) {
	m := &models.Model{
		ID:   "",
		Name: "Test Model",
		Context: models.Context{
			MaxInput: 128000,
		},
	}

	result := ValidateModel(m)
	if result.Valid {
		t.Error("Expected invalid model for empty ID")
	}
}

func TestValidateModel_AutoFillsNameFromID(t *testing.T) {
	m := &models.Model{
		ID:   "gpt-4-turbo",
		Name: "", // Empty name should be auto-filled
		Context: models.Context{
			MaxInput: 128000,
		},
	}

	result := ValidateModel(m)
	if !result.Valid {
		t.Errorf("Expected valid model after auto-fill, got errors: %v", result.Errors)
	}
	if m.Name == "" {
		t.Error("Expected name to be auto-filled from ID")
	}
}

func TestValidateModel_NegativePricing(t *testing.T) {
	m := &models.Model{
		ID: "test-model",
		Pricing: models.Pricing{
			Input:  -1.0,
			Output: 10.0,
		},
		Context: models.Context{
			MaxInput: 128000,
		},
	}

	result := ValidateModel(m)
	if result.Valid {
		t.Error("Expected invalid model for negative input pricing")
	}

	// Test negative output
	m.Pricing.Input = 10.0
	m.Pricing.Output = -1.0
	result = ValidateModel(m)
	if result.Valid {
		t.Error("Expected invalid model for negative output pricing")
	}
}

func TestValidateModel_ZeroMaxInput(t *testing.T) {
	m := &models.Model{
		ID: "test-model",
		Context: models.Context{
			MaxInput: 0,
		},
	}

	result := ValidateModel(m)
	if result.Valid {
		t.Error("Expected invalid model for zero maxInput")
	}
}

func TestValidateModel_NegativeMaxOutput(t *testing.T) {
	negativeOutput := -1
	m := &models.Model{
		ID: "test-model",
		Context: models.Context{
			MaxInput:  128000,
			MaxOutput: &negativeOutput,
		},
	}

	result := ValidateModel(m)
	if result.Valid {
		t.Error("Expected invalid model for negative maxOutput")
	}
}

func TestValidationResult_ToError(t *testing.T) {
	// Valid result should return nil
	validResult := ValidationResult{Valid: true, Errors: []ValidationError{}}
	if validResult.ToError() != nil {
		t.Error("Expected nil error for valid result")
	}

	// Invalid result should return error
	invalidResult := ValidationResult{
		Valid: false,
		Errors: []ValidationError{
			{Field: "name", Message: "Name is required"},
		},
	}
	err := invalidResult.ToError()
	if err == nil {
		t.Error("Expected error for invalid result")
	}
}

func TestIsValidURL(t *testing.T) {
	tests := []struct {
		url      string
		expected bool
	}{
		{"https://api.openai.com/v1", true},
		{"http://localhost:8080", true},
		{"https://example.com", true},
		{"http://192.168.1.1:3000/api", true},
		{"", false},
		{"not-a-url", false},
		{"ftp://example.com", false},
		{"file:///path/to/file", false},
		{"//example.com", false},
	}

	for _, tt := range tests {
		t.Run(tt.url, func(t *testing.T) {
			result := isValidURL(tt.url)
			if result != tt.expected {
				t.Errorf("isValidURL(%q) = %v, want %v", tt.url, result, tt.expected)
			}
		})
	}
}
