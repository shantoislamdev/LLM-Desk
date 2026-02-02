# LLM Desk

![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)
![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?logo=go&logoColor=white)
![Wails Version](https://img.shields.io/badge/Wails-v2.11.0-red)
![React Version](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

**LLM Desk** is a powerful, cross-platform desktop application for managing your LLM providers, models, and API keys locally. built with Go (Wails) and React.


## ✨ Features

- **Unified Provider Management**: Manage OpenAI, Anthropic, and custom OpenAI-compatible providers in one place.
- **API Key Security**: Securely store and manage multiple API keys per provider.
- **Model Catalog**: Detailed view of models with context window sizes, pricing (input/output), and capabilities.
- **Performance & Privacy**:
    - **Local Storage**: All data is stored locally on your machine (`%APPDATA%/LLMDesk`).
    - **No Tracking**: No telemetry or external data collection.
- **Production Ready**:
    - **Robust Error Handling**: Graceful failures with user-friendly toast notifications.
    - **Logging**: Structured file-based logging for troubleshooting.
    - **Import/Export**: Easy backup and migration of your configuration.
- **Modern UI**:
    - Sleek Dark Mode interface.
    - Built with React 19 and Framer Motion for smooth animations.

## 🚀 Installation

### Download Binaries
Pre-built binaries will be available in the [Releases](https://github.com/shantoislamdev/LLM-Desk/releases) section.
*   **Windows**: `llm-desk-windows-amd64.exe`
*   **macOS**: `llm-desk-darwin-universal.dmg`
*   **Linux**: `llm-desk-linux-amd64.AppImage`

### Build from Source

**Prerequisites:**
- [Go 1.23+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/)
- [Wails CLI via `go install github.com/wailsapp/wails/v2/cmd/wails@latest`](https://wails.io/docs/gettingstarted/installation)

**Steps:**
1.  Clone the repository:
    ```bash
    git clone https://github.com/shantoislamdev/LLM-Desk.git
    cd LLM-Desk
    ```

2.  Install frontend dependencies:
    ```bash
    cd frontend
    npm install
    cd ..
    ```

3.  Run in Development Mode (Hot Reload):
    ```bash
    wails dev
    ```

4.  Build for Production:
    ```bash
    wails build
    ```
    The executable will be generated in the `build/bin` directory.

## 📖 Usage

1.  **Add a Provider**:
    - Go to the **Providers** tab.
    - Click **Add Provider**.
    - Enter the name (e.g., "OpenAI") and base URL (e.g., `https://api.openai.com/v1`).
    - Add your API Key.

2.  **Manage Models**:
    - Select a provider to view its details.
    - Add models manually or fetch them if the provider supports it.
    - Configure pricing and context limits.

3.  **Export/Import**:
    - Go to **Settings**.
    - Use **Export Data** to save a JSON backup of your configuration.
    - Use **Import Data** to restore or migrate to a new machine.

## 🛠️ Development

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

**Project Structure:**
- `app.go`: Main backend logic and API bridge.
- `main.go`: Application entry point.
- `internal/`: Go backend packages (services, storage, models, logger).
- `frontend/`: React frontend application.

### Version Management

LLM Desk uses **Git tags as the single source of truth** for versioning. All version references are automatically synchronized during the build process.

**To release a new version:**

```powershell
# Quick release (bump + push)
.\scripts\bump-version.ps1 -Version "1.0.0" -Push

# Or review before pushing
.\scripts\bump-version.ps1 -Version "1.0.0"
git push && git push origin v1.0.0
```

The bump script:
- Updates `wails.json` and `package.json` metadata
- Creates a Git commit and tag
- Optionally pushes to trigger CI/CD

When you push a version tag, GitHub Actions automatically:
- Builds for Windows, macOS, and Linux
- Injects the version into binaries via ldflags
- Creates a GitHub Release with all platform builds

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feat/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feat/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the **GPL-3.0 License**. See [LICENSE](LICENSE) for more information.

## 👤 Author

**Shanto Islam**

- Website: [shantoislamdev.web.app](https://shantoislamdev.web.app)
- GitHub: [@shantoislamdev](https://github.com/shantoislamdev)
- Email: shantoislamdev@gmail.com

## 🙏 Acknowledgments

- [Wails](https://wails.io) - The framework that makes this possible.
- [React](https://react.dev) - Frontend library.
- [Vite](https://vitejs.dev) - Build tool.
- [Lucide](https://lucide.dev) - Beautiful icons.
