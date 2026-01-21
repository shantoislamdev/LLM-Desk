package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"llm-desk/internal/models"
)

// ModelFetcher handles fetching models from LLM provider APIs
type ModelFetcher struct {
	client *http.Client
}

// NewModelFetcher creates a new ModelFetcher
func NewModelFetcher() *ModelFetcher {
	return &ModelFetcher{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// FetchModels fetches available models from a provider's API
func (f *ModelFetcher) FetchModels(baseURL, apiKey string, anthropicURL *string) models.FetchModelsResult {
	// Try OpenAI-compatible endpoint first
	result, err := f.fetchOpenAIStyle(baseURL, apiKey)
	if err == nil && len(result.Models) > 0 {
		return result
	}

	// Try Anthropic endpoint if provided
	if anthropicURL != nil && *anthropicURL != "" {
		result, err = f.fetchAnthropicStyle(*anthropicURL, apiKey)
		if err == nil && len(result.Models) > 0 {
			return result
		}
	}

	return models.FetchModelsResult{
		Models: []models.FetchedModel{},
		Error:  "Could not fetch models. This may be due to invalid credentials, or the endpoint not supporting model listing.",
	}
}

func (f *ModelFetcher) fetchOpenAIStyle(baseURL, apiKey string) (models.FetchModelsResult, error) {
	url := strings.TrimSuffix(baseURL, "/") + "/models"

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return models.FetchModelsResult{}, err
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := f.client.Do(req)
	if err != nil {
		return models.FetchModelsResult{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return models.FetchModelsResult{}, fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return models.FetchModelsResult{}, err
	}

	// Try to parse as OpenAI response format
	var openAIResp struct {
		Data   []models.FetchedModel `json:"data"`
		Models []models.FetchedModel `json:"models"`
	}

	if err := json.Unmarshal(body, &openAIResp); err != nil {
		return models.FetchModelsResult{}, err
	}

	// Data field takes priority (standard OpenAI format)
	if len(openAIResp.Data) > 0 {
		return models.FetchModelsResult{Models: openAIResp.Data}, nil
	}
	if len(openAIResp.Models) > 0 {
		return models.FetchModelsResult{Models: openAIResp.Models}, nil
	}

	// Try parsing as direct array
	var directModels []models.FetchedModel
	if err := json.Unmarshal(body, &directModels); err == nil && len(directModels) > 0 {
		return models.FetchModelsResult{Models: directModels}, nil
	}

	return models.FetchModelsResult{}, fmt.Errorf("no models found in response")
}

func (f *ModelFetcher) fetchAnthropicStyle(baseURL, apiKey string) (models.FetchModelsResult, error) {
	url := strings.TrimSuffix(baseURL, "/") + "/models"

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return models.FetchModelsResult{}, err
	}

	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("Content-Type", "application/json")

	resp, err := f.client.Do(req)
	if err != nil {
		return models.FetchModelsResult{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return models.FetchModelsResult{}, fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return models.FetchModelsResult{}, err
	}

	var anthropicResp struct {
		Data   []models.FetchedModel `json:"data"`
		Models []models.FetchedModel `json:"models"`
	}

	if err := json.Unmarshal(body, &anthropicResp); err != nil {
		return models.FetchModelsResult{}, err
	}

	if len(anthropicResp.Data) > 0 {
		return models.FetchModelsResult{Models: anthropicResp.Data}, nil
	}
	if len(anthropicResp.Models) > 0 {
		return models.FetchModelsResult{Models: anthropicResp.Models}, nil
	}

	return models.FetchModelsResult{}, fmt.Errorf("no models found in response")
}

// TransformFetchedModel converts a fetched model to our Model type
func TransformFetchedModel(fetched models.FetchedModel) models.Model {
	return models.Model{
		ID:         fetched.ID,
		Name:       formatModelName(fetched.ID),
		Enabled:    true,
		Parameters: nil,
		Pricing: models.Pricing{
			Input:    0,
			Output:   0,
			Cached:   nil,
			Currency: "USD",
		},
		Context: models.Context{
			MaxInput:  128000,
			MaxOutput: nil,
		},
		Modalities: []string{"text"},
		Features:   nil,
		Limits:     []models.Limit{},
	}
}

// formatModelName formats a model ID into a readable name
func formatModelName(id string) string {
	// Split by common separators
	parts := strings.FieldsFunc(id, func(r rune) bool {
		return r == '-' || r == '_' || r == '/'
	})

	// Capitalize each part
	for i, part := range parts {
		if len(part) > 0 {
			parts[i] = strings.ToUpper(string(part[0])) + part[1:]
		}
	}

	return strings.Join(parts, " ")
}
