package logger

import (
	"log/slog"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestParseLevel(t *testing.T) {
	tests := []struct {
		input string
		want  slog.Level
	}{
		{"debug", slog.LevelDebug},
		{"info", slog.LevelInfo},
		{"warn", slog.LevelWarn},
		{"error", slog.LevelError},
		{"unknown", slog.LevelInfo},
		{"", slog.LevelInfo},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			if got := parseLevel(tt.input); got != tt.want {
				t.Errorf("parseLevel(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestNewLogger(t *testing.T) {
	// Use temp dir for logging
	tempDir, err := os.MkdirTemp("", "logger-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	cfg := Config{
		Level:   "debug",
		LogDir:  tempDir,
		Console: false,
	}

	l, err := newLogger(cfg)
	if err != nil {
		t.Fatalf("newLogger failed: %v", err)
	}
	defer l.Close()

	if l.logDir != tempDir {
		t.Errorf("Expected logDir %s, got %s", tempDir, l.logDir)
	}
	if l.level != slog.LevelDebug {
		t.Errorf("Expected level Debug, got %v", l.level)
	}

	// Verify file was created
	files, err := os.ReadDir(tempDir)
	if err != nil {
		t.Fatalf("ReadDir failed: %v", err)
	}
	if len(files) != 1 {
		t.Errorf("Expected 1 log file, got %d", len(files))
	}
}

func TestCleanOldLogs(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "clean-logs-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create a dummy logger instance just to test CleanOldLogs logic
	l := &Logger{
		logDir: tempDir,
		slog:   slog.Default(),
	}

	// Create an old file
	oldFile := filepath.Join(tempDir, "old.log")
	if err := os.WriteFile(oldFile, []byte("old logs"), 0644); err != nil {
		t.Fatalf("Failed to create old file: %v", err)
	}

	// Change modtime to 10 days ago
	tenDaysAgo := time.Now().AddDate(0, 0, -10)
	if err := os.Chtimes(oldFile, tenDaysAgo, tenDaysAgo); err != nil {
		t.Fatalf("Failed to chtimes: %v", err)
	}

	// Create a new file
	newFile := filepath.Join(tempDir, "new.log")
	if err := os.WriteFile(newFile, []byte("new logs"), 0644); err != nil {
		t.Fatalf("Failed to create new file: %v", err)
	}

	// Clean logs older than 7 days
	if err := l.CleanOldLogs(7); err != nil {
		t.Errorf("CleanOldLogs failed: %v", err)
	}

	// Verify old file is gone and new file remains
	if _, err := os.Stat(oldFile); !os.IsNotExist(err) {
		t.Error("Old file should have been deleted")
	}
	if _, err := os.Stat(newFile); os.IsNotExist(err) {
		t.Error("New file should still exist")
	}
}
