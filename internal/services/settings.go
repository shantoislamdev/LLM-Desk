package services

import (
	"llm-desk/internal/storage"
)

// SettingsService handles app settings persistence
type SettingsService struct {
	storage  *storage.Storage
	settings storage.AppSettings
}

// NewSettingsService creates a new SettingsService and loads settings
func NewSettingsService(s *storage.Storage) *SettingsService {
	svc := &SettingsService{
		storage:  s,
		settings: storage.AppSettings{Theme: "dark", EnableCrashReporting: true}, // Default
	}

	// Load settings on initialization
	if loaded, err := s.LoadSettings(); err == nil && loaded != nil {
		svc.settings = *loaded
	}

	return svc
}

// GetTheme returns the current theme
func (s *SettingsService) GetTheme() string {
	if s.settings.Theme == "" {
		return "dark"
	}
	return s.settings.Theme
}

// SetTheme sets the theme and persists it
func (s *SettingsService) SetTheme(theme string) error {
	// Validate theme value
	if theme != "light" && theme != "dark" {
		theme = "dark"
	}

	s.settings.Theme = theme
	return s.storage.SaveSettings(&s.settings)
}

// GetSettings returns all settings
func (s *SettingsService) GetSettings() storage.AppSettings {
	return s.settings
}

// GetCrashReporting returns if crash reporting is enabled
func (s *SettingsService) GetCrashReporting() bool {
	return s.settings.EnableCrashReporting
}

// SetCrashReporting sets the crash reporting preference
func (s *SettingsService) SetCrashReporting(enabled bool) error {
	s.settings.EnableCrashReporting = enabled
	return s.storage.SaveSettings(&s.settings)
}
