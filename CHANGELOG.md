# Changelog

All notable changes to **LLM Desk** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Structured Logging**: Implemented a robust logging system using Go's `slog`. Logs are rotated daily and kept for 7 days.
- **Toast Notifications**: Added a global toast notification system in the frontend for real-time user feedback.
- **Unit Tests**: Added comprehensive unit tests for `services`, `storage`, and `validation` packages (33 tests total).
- **Graceful Error Handling**: Replaced critical panics with graceful error handling and UI feedback.
- **GPL-3.0 License**: Officially licensed the project under GPLv3.

### Fixed
- Fixed app crash issues related to storage initialization failures.
- Fixed flaky unit tests in provider service ID generation.

## [1.0.0] - 2026-01-21

### Added
- **Initial Release**: First stable release of LLM Desk.
- **Provider Management**: CRUD operations for LLM providers (OpenAI, Anthropic, Custom).
- **Model Management**: Detailed model catalog with context and pricing configuration.
- **API Key Management**: Secure storage for multiple API keys per provider.
- **Settings**:
  - Theme toggling (Dark/Light mode).
  - Data management (Clear all data).
- **Import/Export**: JSON-based backup and restore functionality.
- **UI/UX**: Modern, responsive interface built with React 19 and Framer Motion.
