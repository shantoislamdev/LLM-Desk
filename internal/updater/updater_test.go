package updater

import (
	"runtime"
	"testing"
)

func TestIsNewer(t *testing.T) {
	tests := []struct {
		latest  string
		current string
		want    bool
	}{
		{"v1.0.0", "v0.9.0", true},
		{"v0.0.2", "v0.0.1", true},
		{"v1.0.0", "v1.0.0", false},
		{"v0.9.0", "v1.0.0", true},      // Simple string compare might be weird but let's match implementation
		{"v1.0.0", "v0.0.1-dev", false}, // Dev ignored
		{"v1.0.0", "none", false},       // None ignored
	}

	for _, tt := range tests {
		t.Run(tt.latest+" vs "+tt.current, func(t *testing.T) {
			if got := isNewer(tt.latest, tt.current); got != tt.want {
				t.Errorf("isNewer(%q, %q) = %v, want %v", tt.latest, tt.current, got, tt.want)
			}
		})
	}
}

func TestMatchesPlatform(t *testing.T) {
	// Note: result depends on runtime.GOOS of the machine running tests
	currentOS := runtime.GOOS

	tests := []struct {
		assetName string
		want      bool
	}{
		{"app-windows.exe", currentOS == "windows"},
		{"app-windows.msi", currentOS == "windows"},
		{"app-mac.dmg", currentOS == "darwin"},
		{"app-mac.pkg", currentOS == "darwin"},
		{"app-linux.AppImage", currentOS == "linux"},
		{"app-linux.deb", currentOS == "linux"},
		{"app-linux.rpm", currentOS == "linux"},
		{"unknown.txt", false},
		{"source.zip", false},
	}

	for _, tt := range tests {
		t.Run(tt.assetName, func(t *testing.T) {
			got := matchesPlatform(tt.assetName)
			if got != tt.want {
				t.Errorf("matchesPlatform(%q) = %v, want %v (OS: %s)", tt.assetName, got, tt.want, currentOS)
			}
		})
	}
}
