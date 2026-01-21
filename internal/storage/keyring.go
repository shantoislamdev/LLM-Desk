package storage

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/zalando/go-keyring"
	"llm-desk/internal/logger"
)

const (
	keyringService = "llm-desk"
	keyringUserPrefix = "provider_"
)

// KeyringStore handles secure storage of API keys using OS-native keyring
type KeyringStore struct{}

// NewKeyringStore creates a new KeyringStore instance
func NewKeyringStore() *KeyringStore {
	return &KeyringStore{}
}

// SetKeys stores a slice of API keys for a specific provider ID
func (k *KeyringStore) SetKeys(providerID string, keys []string) error {
	if providerID == "" {
		return fmt.Errorf("provider ID cannot be empty")
	}

	// Join keys into a single JSON string for storage
	data, err := json.Marshal(keys)
	if err != nil {
		return fmt.Errorf("failed to marshal keys for storage: %w", err)
	}

	user := keyringUserPrefix + providerID
	err = keyring.Set(keyringService, user, string(data))
	if err != nil {
		return fmt.Errorf("failed to set keys in keyring for %s: %w", providerID, err)
	}

	logger.Debug("Stored keys in keyring", "providerID", providerID)
	return nil
}

// GetKeys retrieves the slice of API keys for a specific provider ID
func (k *KeyringStore) GetKeys(providerID string) ([]string, error) {
	if providerID == "" {
		return nil, fmt.Errorf("provider ID cannot be empty")
	}

	user := keyringUserPrefix + providerID
	data, err := keyring.Get(keyringService, user)
	if err != nil {
		if strings.Contains(err.Error(), "secret not found") || strings.Contains(err.Error(), "item not found") {
			return []string{}, nil
		}
		return nil, fmt.Errorf("failed to get keys from keyring for %s: %w", providerID, err)
	}

	var keys []string
	if err := json.Unmarshal([]byte(data), &keys); err != nil {
		return nil, fmt.Errorf("failed to unmarshal keys from keyring: %w", err)
	}

	return keys, nil
}

// DeleteKeys removes all keys for a specific provider ID from the keyring
func (k *KeyringStore) DeleteKeys(providerID string) error {
	if providerID == "" {
		return fmt.Errorf("provider ID cannot be empty")
	}

	user := keyringUserPrefix + providerID
	err := keyring.Delete(keyringService, user)
	if err != nil {
		if strings.Contains(err.Error(), "secret not found") || strings.Contains(err.Error(), "item not found") {
			return nil
		}
		return fmt.Errorf("failed to delete keys from keyring for %s: %w", providerID, err)
	}

	logger.Debug("Deleted keys from keyring", "providerID", providerID)
	return nil
}
