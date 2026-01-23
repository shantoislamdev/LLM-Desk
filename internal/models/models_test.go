package models

import (
	"encoding/json"
	"testing"
)

func TestJSONMarshaling(t *testing.T) {
	// Test basic provider marshaling/unmarshaling to ensure tags are correct
	p := Provider{
		ID:      "test-id",
		Name:    "Test Provider",
		Enabled: true,
		Credentials: Credentials{
			APIKeys: []string{"key1"},
		},
		Endpoints: Endpoints{
			OpenAI: "https://api.openai.com",
		},
	}

	data, err := json.Marshal(p)
	if err != nil {
		t.Fatalf("Failed to marshal provider: %v", err)
	}

	var p2 Provider
	if err := json.Unmarshal(data, &p2); err != nil {
		t.Fatalf("Failed to unmarshal provider: %v", err)
	}

	if p2.ID != p.ID {
		t.Errorf("Expected ID %s, got %s", p.ID, p2.ID)
	}
	if p2.Name != p.Name {
		t.Errorf("Expected Name %s, got %s", p.Name, p2.Name)
	}
	if len(p2.Credentials.APIKeys) != 1 || p2.Credentials.APIKeys[0] != "key1" {
		t.Errorf("Expected API key 'key1', got %v", p2.Credentials.APIKeys)
	}
}

func TestModelFeatures_Marshaling(t *testing.T) {
	// Test pointer fields in ModelFeatures (omitempty)
	boolTrue := true
	features := ModelFeatures{
		Vision: &boolTrue,
	}

	data, err := json.Marshal(features)
	if err != nil {
		t.Fatalf("Failed to marshal features: %v", err)
	}

	jsonStr := string(data)
	if jsonStr != `{"vision":true}` {
		t.Errorf("Expected `{\"vision\":true}`, got `%s`", jsonStr)
	}

	// Test empty
	emptyFeatures := ModelFeatures{}
	data, err = json.Marshal(emptyFeatures)
	if err != nil {
		t.Fatalf("Failed to marshal empty features: %v", err)
	}
	if string(data) != "{}" {
		t.Errorf("Expected `{}`, got `%s`", string(data))
	}
}
