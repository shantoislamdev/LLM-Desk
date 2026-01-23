package main

import (
	"context"
	"embed"
	"fmt"

	"llm-desk/internal/logger"
	"llm-desk/internal/version"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	defer logger.Recovery()
	// Create an instance of the app structure
	app := NewApp()

	// Check for initialization errors
	if app.HasInitError() {
		logger.Error("Application initialization failed", "error", app.GetInitError())
		// Continue anyway - the app will show the error state in the UI
	}

	// Create application with options
	err := wails.Run(&options.App{
		Title:     "LLM Desk",
		Width:     1280,
		Height:    800,
		MinWidth:  800,
		MinHeight: 600,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 15, G: 15, B: 20, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		OnBeforeClose: func(ctx context.Context) (prevent bool) {
			// Return true to prevent closing, false to allow
			return false
		},
		Bind: []interface{}{
			app,
		},
		// Windows-specific options
		Windows: &windows.Options{
			WebviewIsTransparent:              false,
			WindowIsTranslucent:               false,
			DisableWindowIcon:                 false,
			DisableFramelessWindowDecorations: false,
			Theme:                             windows.Dark,
		},
		// macOS-specific options
		Mac: &mac.Options{
			TitleBar: &mac.TitleBar{
				TitlebarAppearsTransparent: true,
				HideTitle:                  false,
				HideTitleBar:               false,
				FullSizeContent:            true,
				UseToolbar:                 false,
			},
			Appearance: mac.NSAppearanceNameDarkAqua,
			About: &mac.AboutInfo{
				Title:   "LLM Desk",
				Message: fmt.Sprintf("LLM Provider Management Desktop Application\nVersion %s\n© 2026 LLM Desk", version.GetVersion()),
			},
		},
	})

	if err != nil {
		logger.Error("Application runtime error", "error", err)
	}
}
