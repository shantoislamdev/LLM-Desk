package logger

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime/debug"
	"time"
)

// Recovery handles panics by logging the stack trace to a crash file
func Recovery() {
	if r := recover(); r != nil {
		// Get data directory
		home, _ := os.UserHomeDir()
		crashPath := filepath.Join(home, "AppData", "Roaming", "LLMDesk", "logs", "crash.log")

		// Ensure directory exists
		os.MkdirAll(filepath.Dir(crashPath), 0755)

		f, err := os.OpenFile(crashPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Failed to open crash log: %v\n", err)
			return
		}
		defer f.Close()

		timestamp := time.Now().Format("2006-01-02 15:04:05")
		stack := debug.Stack()

		fmt.Fprintf(f, "\n=== CRASH REPORT [%s] ===\n", timestamp)
		fmt.Fprintf(f, "Reason: %v\n", r)
		fmt.Fprintf(f, "Stack Trace:\n%s\n", stack)
		fmt.Fprintf(f, "=============================\n")

		// Also log to standard logger if available
		Error("Application panicked", "reason", r)

		// Exit after logging
		os.Exit(1)
	}
}
