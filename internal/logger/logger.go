package logger

import (
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// Logger wraps slog with file and console output
type Logger struct {
	slog    *slog.Logger
	file    *os.File
	mu      sync.Mutex
	logDir  string
	level   slog.Level
}

var (
	globalLogger *Logger
	once         sync.Once
)

// Config holds logger configuration
type Config struct {
	Level   string // "debug", "info", "warn", "error"
	LogDir  string // Directory for log files
	Console bool   // Also log to console
}

// Init initializes the global logger
func Init(cfg Config) error {
	var initErr error
	once.Do(func() {
		globalLogger, initErr = newLogger(cfg)
	})
	return initErr
}

// Get returns the global logger instance
func Get() *Logger {
	if globalLogger == nil {
		// Return a default console-only logger if not initialized
		return &Logger{
			slog:  slog.Default(),
			level: slog.LevelInfo,
		}
	}
	return globalLogger
}

// newLogger creates a new Logger instance
func newLogger(cfg Config) (*Logger, error) {
	level := parseLevel(cfg.Level)

	// Ensure log directory exists
	logDir := cfg.LogDir
	if logDir == "" {
		configDir, err := os.UserConfigDir()
		if err != nil {
			return nil, err
		}
		logDir = filepath.Join(configDir, "LLMDesk", "logs")
	}

	if err := os.MkdirAll(logDir, 0755); err != nil {
		return nil, err
	}

	// Create log file with date
	logFileName := time.Now().Format("2006-01-02") + ".log"
	logPath := filepath.Join(logDir, logFileName)

	file, err := os.OpenFile(logPath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return nil, err
	}

	// Create multi-writer for file and optionally console
	var writer io.Writer = file
	if cfg.Console {
		writer = io.MultiWriter(file, os.Stdout)
	}

	// Create structured logger with JSON handler for file
	opts := &slog.HandlerOptions{
		Level: level,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			// Format time nicely
			if a.Key == slog.TimeKey {
				if t, ok := a.Value.Any().(time.Time); ok {
					a.Value = slog.StringValue(t.Format("2006-01-02 15:04:05.000"))
				}
			}
			return a
		},
	}

	handler := slog.NewTextHandler(writer, opts)
	slogger := slog.New(handler)

	return &Logger{
		slog:   slogger,
		file:   file,
		logDir: logDir,
		level:  level,
	}, nil
}

// parseLevel converts string level to slog.Level
func parseLevel(level string) slog.Level {
	switch level {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

// Close closes the log file
func (l *Logger) Close() error {
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.file != nil {
		return l.file.Close()
	}
	return nil
}

// GetLogDir returns the log directory path
func (l *Logger) GetLogDir() string {
	return l.logDir
}

// Debug logs at debug level
func (l *Logger) Debug(msg string, args ...any) {
	l.slog.Debug(msg, args...)
}

// Info logs at info level
func (l *Logger) Info(msg string, args ...any) {
	l.slog.Info(msg, args...)
}

// Warn logs at warn level
func (l *Logger) Warn(msg string, args ...any) {
	l.slog.Warn(msg, args...)
}

// Error logs at error level
func (l *Logger) Error(msg string, args ...any) {
	l.slog.Error(msg, args...)
}

// With returns a logger with additional context
func (l *Logger) With(args ...any) *Logger {
	return &Logger{
		slog:   l.slog.With(args...),
		file:   l.file,
		logDir: l.logDir,
		level:  l.level,
	}
}

// CleanOldLogs removes log files older than the specified number of days
func (l *Logger) CleanOldLogs(keepDays int) error {
	l.mu.Lock()
	defer l.mu.Unlock()

	if l.logDir == "" {
		return nil
	}

	entries, err := os.ReadDir(l.logDir)
	if err != nil {
		return err
	}

	cutoff := time.Now().AddDate(0, 0, -keepDays)

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		if info.ModTime().Before(cutoff) {
			logPath := filepath.Join(l.logDir, entry.Name())
			if err := os.Remove(logPath); err != nil {
				l.slog.Warn("failed to remove old log", "path", logPath, "error", err)
			}
		}
	}

	return nil
}

// Package-level convenience functions

// Debug logs at debug level using global logger
func Debug(msg string, args ...any) {
	Get().Debug(msg, args...)
}

// Info logs at info level using global logger
func Info(msg string, args ...any) {
	Get().Info(msg, args...)
}

// Warn logs at warn level using global logger
func Warn(msg string, args ...any) {
	Get().Warn(msg, args...)
}

// Error logs at error level using global logger
func Error(msg string, args ...any) {
	Get().Error(msg, args...)
}
