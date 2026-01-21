package services

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"llm-desk/internal/models"
	"llm-desk/internal/storage"
)

// ProviderService handles provider CRUD operations
type ProviderService struct {
	storage *storage.Storage
}

// NewProviderService creates a new ProviderService
func NewProviderService(s *storage.Storage) *ProviderService {
	return &ProviderService{storage: s}
}

// generateProviderID creates a unique provider ID from name
func generateProviderID(name string) string {
	re := regexp.MustCompile(`[^a-z0-9]+`)
	base := strings.ToLower(name)
	base = re.ReplaceAllString(base, "-")
	base = strings.Trim(base, "-")
	timestamp := strconv.FormatInt(time.Now().UnixNano(), 36)
	return fmt.Sprintf("%s-%s", base, timestamp)
}

// GetAllProviders returns all providers
func (s *ProviderService) GetAllProviders() ([]models.Provider, error) {
	return s.storage.Load()
}

// GetProvider returns a provider by ID
func (s *ProviderService) GetProvider(id string) (*models.Provider, error) {
	providers, err := s.storage.Load()
	if err != nil {
		return nil, err
	}

	for _, p := range providers {
		if p.ID == id {
			return &p, nil
		}
	}

	return nil, fmt.Errorf("provider not found: %s", id)
}

// CreateProvider creates a new provider
func (s *ProviderService) CreateProvider(p models.Provider) (*models.Provider, error) {
	// Validate before saving (STRICT)
	if validation := ValidateProvider(&p); !validation.Valid {
		return nil, validation.ToError()
	}

	providers, err := s.storage.Load()
	if err != nil {
		return nil, err
	}

	// Generate ID if not provided
	if p.ID == "" {
		p.ID = generateProviderID(p.Name)
	}

	// Set defaults
	if p.Credentials.APIKeys == nil {
		p.Credentials.APIKeys = []string{}
	}
	if p.Models == nil {
		p.Models = []models.Model{}
	}
	if p.Limits == nil {
		p.Limits = []models.Limit{}
	}

	p.IsCustom = true

	providers = append(providers, p)
	if err := s.storage.Save(providers); err != nil {
		return nil, err
	}

	return &p, nil
}

// UpdateProvider updates an existing provider
func (s *ProviderService) UpdateProvider(id string, updates models.Provider) error {
	// Validate before saving (STRICT)
	if validation := ValidateProvider(&updates); !validation.Valid {
		return validation.ToError()
	}

	providers, err := s.storage.Load()
	if err != nil {
		return err
	}

	found := false
	for i, p := range providers {
		if p.ID == id {
			// Preserve ID and models from existing provider
			updates.ID = id
			if updates.Models == nil {
				updates.Models = p.Models
			}
			providers[i] = updates
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("provider not found: %s", id)
	}

	return s.storage.Save(providers)
}

// DeleteProvider deletes a provider by ID
func (s *ProviderService) DeleteProvider(id string) error {
	providers, err := s.storage.Load()
	if err != nil {
		return err
	}

	newProviders := make([]models.Provider, 0, len(providers)-1)
	found := false
	for _, p := range providers {
		if p.ID == id {
			found = true
			continue
		}
		newProviders = append(newProviders, p)
	}

	if !found {
		return fmt.Errorf("provider not found: %s", id)
	}

	return s.storage.Save(newProviders)
}

// UpdateCredentials updates provider API keys
func (s *ProviderService) UpdateCredentials(id string, keys []string) error {
	providers, err := s.storage.Load()
	if err != nil {
		return err
	}

	for i, p := range providers {
		if p.ID == id {
			providers[i].Credentials.APIKeys = keys
			return s.storage.Save(providers)
		}
	}

	return fmt.Errorf("provider not found: %s", id)
}

// AddModel adds a model to a provider
func (s *ProviderService) AddModel(providerID string, m models.Model) error {
	// Validate model before saving (STRICT) - also auto-fills name from ID
	if validation := ValidateModel(&m); !validation.Valid {
		return validation.ToError()
	}

	providers, err := s.storage.Load()
	if err != nil {
		return err
	}

	for i, p := range providers {
		if p.ID == providerID {
			providers[i].Models = append(providers[i].Models, m)
			return s.storage.Save(providers)
		}
	}

	return fmt.Errorf("provider not found: %s", providerID)
}

// UpdateModel updates a model in a provider
func (s *ProviderService) UpdateModel(providerID, modelID string, updates models.Model) error {
	// Validate model before saving (STRICT) - also auto-fills name from ID
	if validation := ValidateModel(&updates); !validation.Valid {
		return validation.ToError()
	}

	providers, err := s.storage.Load()
	if err != nil {
		return err
	}

	for i, p := range providers {
		if p.ID == providerID {
			for j, m := range p.Models {
				if m.ID == modelID {
					updates.ID = modelID
					providers[i].Models[j] = updates
					return s.storage.Save(providers)
				}
			}
			return fmt.Errorf("model not found: %s", modelID)
		}
	}

	return fmt.Errorf("provider not found: %s", providerID)
}

// DeleteModel removes a model from a provider
func (s *ProviderService) DeleteModel(providerID, modelID string) error {
	providers, err := s.storage.Load()
	if err != nil {
		return err
	}

	for i, p := range providers {
		if p.ID == providerID {
			newModels := make([]models.Model, 0, len(p.Models)-1)
			found := false
			for _, m := range p.Models {
				if m.ID == modelID {
					found = true
					continue
				}
				newModels = append(newModels, m)
			}
			if !found {
				return fmt.Errorf("model not found: %s", modelID)
			}
			providers[i].Models = newModels
			return s.storage.Save(providers)
		}
	}

	return fmt.Errorf("provider not found: %s", providerID)
}

// SaveProviders saves all providers (bulk operation)
func (s *ProviderService) SaveProviders(providers []models.Provider) error {
	return s.storage.Save(providers)
}

// ClearAllData removes all stored data
func (s *ProviderService) ClearAllData() error {
	return s.storage.Clear()
}
