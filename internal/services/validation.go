package services

import (
	"errors"
	"fmt"
	"net/url"
	"strings"

	"llm-desk/internal/models"
)

const (
	MaxProviderNameLength = 100
	MaxModelIDLength      = 200
	MaxModelNameLength    = 200
)

// ValidationError represents a single validation failure
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func (e ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// ValidationResult holds the outcome of validation
type ValidationResult struct {
	Valid  bool              `json:"valid"`
	Errors []ValidationError `json:"errors"`
}

// Error returns combined error message
func (r ValidationResult) Error() string {
	if r.Valid {
		return ""
	}
	var msgs []string
	for _, e := range r.Errors {
		msgs = append(msgs, e.Error())
	}
	return strings.Join(msgs, "; ")
}

// ToError converts ValidationResult to error if invalid
func (r ValidationResult) ToError() error {
	if r.Valid {
		return nil
	}
	return errors.New(r.Error())
}

// ValidateProvider validates a provider before saving (STRICT)
func ValidateProvider(p *models.Provider) ValidationResult {
	result := ValidationResult{Valid: true, Errors: []ValidationError{}}

	// Name validation: required, length limit
	name := strings.TrimSpace(p.Name)
	if name == "" {
		result.Valid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:   "name",
			Message: "Provider name is required",
		})
	} else if len(name) > MaxProviderNameLength {
		result.Valid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:   "name",
			Message: fmt.Sprintf("Provider name exceeds %d characters", MaxProviderNameLength),
		})
	}

	// OpenAI endpoint validation: if provided, must be valid URL
	if p.Endpoints.OpenAI != "" {
		if !isValidURL(p.Endpoints.OpenAI) {
			result.Valid = false
			result.Errors = append(result.Errors, ValidationError{
				Field:   "endpoints.openai",
				Message: "Invalid OpenAI endpoint URL",
			})
		}
	}

	// Anthropic endpoint validation: if provided, must be valid URL
	if p.Endpoints.Anthropic != nil && *p.Endpoints.Anthropic != "" {
		if !isValidURL(*p.Endpoints.Anthropic) {
			result.Valid = false
			result.Errors = append(result.Errors, ValidationError{
				Field:   "endpoints.anthropic",
				Message: "Invalid Anthropic endpoint URL",
			})
		}
	}

	// API keys: no limit, just ensure array is initialized
	// (No validation needed per user requirements)

	return result
}

// ValidateModel validates a model before saving (STRICT)
// Also performs auto-fill of name from ID if name is empty
func ValidateModel(m *models.Model) ValidationResult {
	result := ValidationResult{Valid: true, Errors: []ValidationError{}}

	// ID validation: required
	id := strings.TrimSpace(m.ID)
	if id == "" {
		result.Valid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:   "id",
			Message: "Model ID is required",
		})
	} else if len(id) > MaxModelIDLength {
		result.Valid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:   "id",
			Message: fmt.Sprintf("Model ID exceeds %d characters", MaxModelIDLength),
		})
	}

	// Name: auto-fill from ID if empty
	if strings.TrimSpace(m.Name) == "" && id != "" {
		m.Name = formatModelName(id)
	}

	// Name length check after auto-fill
	if len(m.Name) > MaxModelNameLength {
		result.Valid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:   "name",
			Message: fmt.Sprintf("Model name exceeds %d characters", MaxModelNameLength),
		})
	}

	// Pricing validation: non-negative
	if m.Pricing.Input < 0 {
		result.Valid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:   "pricing.input",
			Message: "Input pricing cannot be negative",
		})
	}
	if m.Pricing.Output < 0 {
		result.Valid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:   "pricing.output",
			Message: "Output pricing cannot be negative",
		})
	}
	if m.Pricing.Cached != nil && *m.Pricing.Cached < 0 {
		result.Valid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:   "pricing.cached",
			Message: "Cached pricing cannot be negative",
		})
	}

	// Context validation: positive
	if m.Context.MaxInput <= 0 {
		result.Valid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:   "context.maxInput",
			Message: "Max input context must be positive",
		})
	}
	if m.Context.MaxOutput != nil && *m.Context.MaxOutput <= 0 {
		result.Valid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:   "context.maxOutput",
			Message: "Max output context must be positive if specified",
		})
	}

	return result
}

// isValidURL checks if a string is a valid URL
func isValidURL(urlStr string) bool {
	if urlStr == "" {
		return false
	}

	u, err := url.Parse(urlStr)
	if err != nil {
		return false
	}

	// Must have scheme and host
	if u.Scheme == "" || u.Host == "" {
		return false
	}

	// Scheme must be http or https
	if u.Scheme != "http" && u.Scheme != "https" {
		return false
	}

	return true
}
