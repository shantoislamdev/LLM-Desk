package models

// ============================================
// LLM Desk Enterprise Data Types
// Mirrors TypeScript types from src/types/index.ts
// ============================================

// Pricing represents cost per million tokens
type Pricing struct {
	Input    float64  `json:"input"`
	Output   float64  `json:"output"`
	Cached   *float64 `json:"cached"`
	Currency string   `json:"currency"`
}

// Limit represents rate limiting configuration
type Limit struct {
	Type   string `json:"type"` // "requests" or "tokens"
	Limit  int    `json:"limit"`
	Window int    `json:"window"`
}

// Context represents the context window configuration
type Context struct {
	MaxInput  int  `json:"maxInput"`
	MaxOutput *int `json:"maxOutput"`
}

// ModelFeatures represents model capabilities
type ModelFeatures struct {
	ToolCalling   *bool `json:"toolCalling,omitempty"`
	Reasoning     *bool `json:"reasoning,omitempty"`
	Search        *bool `json:"search,omitempty"`
	CodeExecution *bool `json:"codeExecution,omitempty"`
	Vision        *bool `json:"vision,omitempty"`
}

// ProviderFeatures represents provider capabilities
type ProviderFeatures struct {
	Streaming   *bool `json:"streaming,omitempty"`
	ToolCalling *bool `json:"toolCalling,omitempty"`
	JSONMode    *bool `json:"jsonMode,omitempty"`
}

// Endpoints represents API endpoints configuration
type Endpoints struct {
	OpenAI    string  `json:"openai"`
	Anthropic *string `json:"anthropic"`
}

// Credentials represents API credentials
type Credentials struct {
	APIKeys []string `json:"apiKeys"`
}

// Model represents an LLM model configuration
type Model struct {
	ID         string         `json:"id"`
	Name       string         `json:"name"`
	Enabled    bool           `json:"enabled"`
	Parameters *string        `json:"parameters"`
	Pricing    Pricing        `json:"pricing"`
	Context    Context        `json:"context"`
	Modalities []string       `json:"modalities"`
	Features   *ModelFeatures `json:"features,omitempty"`
	Limits     []Limit        `json:"limits,omitempty"`
}

// Provider represents an LLM provider configuration
type Provider struct {
	ID          string           `json:"id"`
	Name        string           `json:"name"`
	Enabled     bool             `json:"enabled"`
	Credentials Credentials      `json:"credentials"`
	Endpoints   Endpoints        `json:"endpoints"`
	Limits      []Limit          `json:"limits"`
	Features    ProviderFeatures `json:"features"`
	Models      []Model          `json:"models"`
	IsCustom    bool             `json:"isCustom,omitempty"`
}

// Metadata represents export/import metadata
type Metadata struct {
	CreatedAt   string  `json:"createdAt"`
	ModifiedAt  string  `json:"modifiedAt"`
	Generator   string  `json:"generator"`
	Description *string `json:"description,omitempty"`
}

// LLMDeskData represents the unified data structure for import/export
type LLMDeskData struct {
	Version   string     `json:"version"`
	Metadata  Metadata   `json:"metadata"`
	Providers []Provider `json:"providers"`
}

// FetchedModel represents a model from an API response
type FetchedModel struct {
	ID      string `json:"id"`
	Object  string `json:"object,omitempty"`
	Created int64  `json:"created,omitempty"`
	OwnedBy string `json:"owned_by,omitempty"`
}

// ImportMode defines how to handle data import
type ImportMode string

const (
	ImportModeReplace ImportMode = "replace"
	ImportModeMerge   ImportMode = "merge"
)

// ImportResult represents the result of an import operation
type ImportResult struct {
	Success  bool     `json:"success"`
	Message  string   `json:"message"`
	Warnings []string `json:"warnings"`
	Imported struct {
		Providers int `json:"providers"`
		Models    int `json:"models"`
	} `json:"imported"`
}

// FetchModelsResult represents the result of fetching models from an API
type FetchModelsResult struct {
	Models []FetchedModel `json:"models"`
	Error  string         `json:"error,omitempty"`
}
