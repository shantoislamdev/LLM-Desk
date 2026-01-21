package version

var (
	// Version is the current version of the application.
	// This is injected at build time using ldflags.
	Version = "v0.0.1-dev"

	// Commit is the git commit hash at the time of build.
	// This is injected at build time using ldflags.
	Commit = "none"

	// BuildTime is the time when the application was built.
)

// GetVersion returns the full version string including commit hash
func GetVersion() string {
	if Commit != "none" {
		return Version + " (" + Commit + ")"
	}
	return Version
}
