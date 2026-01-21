package updater

import (
	"encoding/json"
	"fmt"
	"net/http"
	"runtime"
	"strings"
	"time"

	"llm-desk/internal/version"
)

const (
	githubAPIURL = "https://api.github.com/repos/shantoislamdev/LLM-Desk/releases/latest"
)

// UpdateInfo contains information about a new release
type UpdateInfo struct {
	Available   bool   `json:"available"`
	Version     string `json:"version"`
	Changelog   string `json:"changelog"`
	DownloadURL string `json:"downloadUrl"`
	PublishedAt string `json:"publishedAt"`
}

type githubRelease struct {
	TagName     string `json:"tag_name"`
	Body        string `json:"body"`
	HTMLURL     string `json:"html_url"`
	PublishedAt string `json:"published_at"`
	Assets      []struct {
		Name               string `json:"name"`
		BrowserDownloadURL string `json:"browser_download_url"`
	} `json:"assets"`
}

// CheckForUpdates fetches the latest release from GitHub and compares it with the current version
func CheckForUpdates() (*UpdateInfo, error) {
	client := &http.Client{Timeout: 10 * time.Second}

	req, err := http.NewRequest("GET", githubAPIURL, nil)
	if err != nil {
		return nil, err
	}

	// GitHub API recommends setting User-Agent
	req.Header.Set("User-Agent", "LLM-Desk-Updater")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to GitHub: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return &UpdateInfo{Available: false}, nil
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github API returned status: %s", resp.Status)
	}

	var release githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, fmt.Errorf("failed to decode github release: %w", err)
	}

	currentVersion := version.Version
	// Simple version comparison (e.g., v0.0.2 vs v0.0.1)
	// In production, you might want a more robust semver parser
	if !isNewer(release.TagName, currentVersion) {
		return &UpdateInfo{Available: false}, nil
	}

	downloadURL := release.HTMLURL
	// Try to find platform-specific asset
	for _, asset := range release.Assets {
		if matchesPlatform(asset.Name) {
			downloadURL = asset.BrowserDownloadURL
			break
		}
	}

	return &UpdateInfo{
		Available:   true,
		Version:     release.TagName,
		Changelog:   release.Body,
		DownloadURL: downloadURL,
		PublishedAt: release.PublishedAt,
	}, nil
}

func isNewer(latest, current string) bool {
	latest = strings.TrimPrefix(latest, "v")
	current = strings.TrimPrefix(current, "v")

	if current == "0.0.1-dev" || current == "none" {
		return false // Don't prompt for updates in dev mode
	}

	return latest != current
}

func matchesPlatform(assetName string) bool {
	assetName = strings.ToLower(assetName)
	switch runtime.GOOS {
	case "windows":
		return strings.HasSuffix(assetName, ".exe") || strings.HasSuffix(assetName, ".msi")
	case "darwin":
		return strings.HasSuffix(assetName, ".dmg") || strings.HasSuffix(assetName, ".pkg")
	case "linux":
		return strings.HasSuffix(assetName, ".appimage") || strings.HasSuffix(assetName, ".deb") || strings.HasSuffix(assetName, ".rpm")
	default:
		return false
	}
}
