# Contributing to LLM Desk

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to LLM Desk. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Code of Conduct

This project and everyone participating in it is governed by the [LLM Desk Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for LLM Desk. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- **Check if the bug has already been reported** by searching on GitHub under [Issues](https://github.com/shantoislamdev/LLM-Desk/issues).
- **Use the Bug Report template** to create a detailed report.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for LLM Desk, including completely new features and minor improvements to existing functionality.

- **Check if the enhancement has already been suggested** by searching on GitHub under [Issues](https://github.com/shantoislamdev/LLM-Desk/issues).
- **Use the Feature Request template** to create a detailed suggestion.

### Pull Requests

1.  Fork the repo and create your branch from `main`.
2.  If you've added code that should be tested, add tests.
3.  If you've changed APIs, update the documentation.
4.  Ensure the test suite passes.
5.  Make sure your code lints.

## Development Setup

### Prerequisites

- **Go**: Version 1.23 or newer.
- **Node.js**: Version 18 or newer.
- **Wails CLI**: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### Infrastructure

1.  **Clone the repository**
    ```bash
    git clone https://github.com/shantoislamdev/LLM-Desk.git
    cd LLM-Desk
    ```

2.  **Install Frontend Dependencies**
    ```bash
    cd frontend
    npm install
    cd ..
    ```

3.  **Run Development Server**
    ```bash
    wails dev
    ```
    This command runs the application in development mode with hot-reloading enabled.

### Project Structure

- **`main.go`**: Entry point of the application.
- **`app.go`**: Main application struct and Wails runtime binding methods.
- **`internal/`**: Go backend code.
    - **`models/`**: Data structures.
    - **`services/`**: Business logic.
    - **`storage/`**: File system persistence.
    - **`logger/`**: structured logging.
- **`frontend/`**: React frontend code.
    - **`src/components/`**: Reusable UI components.
    - **`src/pages/`**: Application views.
    - **`src/hooks/`**: Custom React hooks.
    - **`src/contexts/`**: React contexts (Toast, etc.).

## Styleguides

### Go Styleguide

- We follow standard Go conventions (Effective Go).
- Use `gofmt` to format your code.
- Run tests with `go test ./internal/...`.

### TypeScript/React Styleguide

- Use Functional Components with Hooks.
- Use explicit types for all props and state.
- Component file names should be PascalCase (e.g., `MyComponent.tsx`).
- Use `npm run build` to verify the frontend build.

## License

By contributing, you agree that your contributions will be licensed under its GPL-3.0 License.
