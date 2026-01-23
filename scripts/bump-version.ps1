# Version Bump Script for LLM Desk
# Usage: .\scripts\bump-version.ps1 -Version "1.0.0" [-Push]
#
# This script updates version across all configuration files and creates a Git tag.
# The Git tag is the single source of truth - CI/CD will inject this into the build.

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    [switch]$Push
)

# Remove 'v' prefix if provided (we'll add it consistently)
$Version = $Version -replace '^v', ''

Write-Host "🚀 Bumping version to v$Version" -ForegroundColor Cyan

# Get project root (parent of scripts folder)
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $ProjectRoot

try {
    # 1. Update wails.json (for Windows installer metadata)
    Write-Host "📝 Updating wails.json..." -ForegroundColor Yellow
    $wailsPath = "wails.json"
    $wailsContent = Get-Content $wailsPath -Raw | ConvertFrom-Json
    $wailsContent.info.productVersion = $Version
    $wailsContent | ConvertTo-Json -Depth 10 | Set-Content $wailsPath -NoNewline
    # Fix JSON formatting (ensure proper line endings)
    (Get-Content $wailsPath) | Set-Content $wailsPath

    # 2. Update frontend/package.json
    Write-Host "📝 Updating frontend/package.json..." -ForegroundColor Yellow
    $pkgPath = "frontend/package.json"
    $pkgContent = Get-Content $pkgPath -Raw | ConvertFrom-Json
    $pkgContent.version = $Version
    $pkgContent | ConvertTo-Json -Depth 10 | Set-Content $pkgPath -NoNewline
    (Get-Content $pkgPath) | Set-Content $pkgPath

    # 3. Update package-lock.json by running npm install
    Write-Host "📝 Updating package-lock.json..." -ForegroundColor Yellow
    Push-Location "frontend"
    npm install --package-lock-only --silent 2>$null
    Pop-Location

    # 4. Update website/index.html JSON-LD version
    Write-Host "📝 Updating website/index.html JSON-LD..." -ForegroundColor Yellow
    $indexPath = "website/index.html"
    $indexContent = Get-Content $indexPath -Raw
    $targetVersion = '"softwareVersion": "{0}"' -f $Version
    $indexContent = $indexContent -replace '"softwareVersion":\s*"[^"]*"', $targetVersion
    Set-Content $indexPath $indexContent -NoNewline

    # 5. Stage changes
    Write-Host "📂 Staging changes..." -ForegroundColor Yellow
    git add wails.json frontend/package.json frontend/package-lock.json website/index.html

    # 6. Commit
    Write-Host "💾 Committing..." -ForegroundColor Yellow
    git commit -m "chore: bump version to v$Version"

    # 7. Create tag
    Write-Host "🏷️  Creating tag v$Version..." -ForegroundColor Yellow
    git tag "v$Version"

    # 8. Push if requested
    if ($Push) {
        Write-Host "🚀 Pushing to remote..." -ForegroundColor Yellow
        git push
        git push origin "v$Version"
        Write-Host "✅ Version v$Version pushed to remote!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✅ Version bumped to v$Version locally." -ForegroundColor Green
        Write-Host ""
        Write-Host "To push the changes and trigger a release, run:" -ForegroundColor Cyan
        Write-Host "  git push && git push origin v$Version" -ForegroundColor White
    }

} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
