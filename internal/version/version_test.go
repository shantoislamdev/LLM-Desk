package version

import (
	"testing"
)

func TestGetVersion(t *testing.T) {
	// Save current values to restore later
	originalVersion := Version
	originalCommit := Commit
	defer func() {
		Version = originalVersion
		Commit = originalCommit
	}()

	tests := []struct {
		name    string
		version string
		commit  string
		want    string
	}{
		{
			name:    "Dev build",
			version: "v0.0.1-dev",
			commit:  "none",
			want:    "v0.0.1-dev",
		},
		{
			name:    "Production build",
			version: "v1.0.0",
			commit:  "abc1234",
			want:    "v1.0.0 (abc1234)",
		},
		{
			name:    "Empty commit",
			version: "v0.0.1",
			commit:  "",
			want:    "v0.0.1 ()",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			Version = tt.version
			Commit = tt.commit
			if got := GetVersion(); got != tt.want {
				t.Errorf("GetVersion() = %v, want %v", got, tt.want)
			}
		})
	}
}
