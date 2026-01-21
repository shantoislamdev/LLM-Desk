# Changelog

All notable changes to **LLM Desk** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Security Hardening**:
  - Implemented secure API key storage using OS-native keyring (Windows Credential Manager, macOS Keychain).
  - Added transparent migration of plaintext API keys from `providers.json` to secure storage.
  - Implemented AES-256-GCM encryption for data backups and exports.
- **Structured Logging**:
  - Added Go `slog` package for structured, file-based logging.
  - Log rotation and configurable log levels.
- **Error Handling**:
  - Global toast notification system for frontend errors.
  - Graceful application startup and error recovery.
- **Documentation**:
  - Comprehensive README, CHANGELOG, and contribution guidelines.
  - GPL-3.0 License.
- **Unit Tests**: Added comprehensive unit tests for `services`, `storage`, and `validation` packages (33 tests total).

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
