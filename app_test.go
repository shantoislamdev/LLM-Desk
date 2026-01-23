package main

import (
	"context"
	"errors"
	"testing"
)

func TestApp_InitError(t *testing.T) {
	app := &App{}

	if app.HasInitError() {
		t.Error("Expected no init error for empty app")
	}
	if app.GetInitError() != "" {
		t.Error("Expected empty init error message")
	}

	app.initError = errors.New("initialization failed")

	if !app.HasInitError() {
		t.Error("Expected init error returning true")
	}
	if app.GetInitError() != "initialization failed" {
		t.Errorf("Expected 'initialization failed', got '%s'", app.GetInitError())
	}
}

func TestApp_GetVersion(t *testing.T) {
	app := &App{}
	// Just verify it doesn't crash and returns something
	ver := app.GetVersion()
	if ver == "" {
		t.Error("Expected non-empty version")
	}
}

func TestApp_StartupContext(t *testing.T) {
	app := &App{}
	ctx := context.Background()

	app.startup(ctx)

	if app.ctx != ctx {
		t.Error("Context was not saved on startup")
	}
}
