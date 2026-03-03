# ============================================================
# TeslamateCyberUI Skill Installer (Windows PowerShell)
# Supports: Claude Code, Codex, Gemini CLI, Antigravity, Cursor
# Usage: .\install.ps1 [-Global] [-Platforms claude,codex,...]
# Examples:
#   .\install.ps1 -Platforms claude,gemini       # project-level
#   .\install.ps1 -Global -Platforms all         # global for all
#   .\install.ps1                                 # interactive mode
# ============================================================

param(
    [switch]$Global,
    [string]$Platforms = ""
)

$ErrorActionPreference = "Stop"

$SKILL_NAME = "tesla-stats"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$ALL_PLATFORMS = @("claude", "codex", "gemini", "antigravity", "cursor")

function Write-Info { param($msg) Write-Host "[i] $msg" -ForegroundColor Cyan }
function Write-Ok { param($msg) Write-Host "[+] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "[!] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "[x] $msg" -ForegroundColor Red }

# Parse platform list
$selectedPlatforms = @()
if ($Platforms -ne "") {
    $selectedPlatforms = $Platforms -split "," | ForEach-Object { $_.Trim().ToLower() }
    if ($selectedPlatforms -contains "all") {
        $selectedPlatforms = $ALL_PLATFORMS
    }
}

# Interactive mode - no platforms specified
if ($selectedPlatforms.Count -eq 0) {
    Write-Host ""
    Write-Host "=== TeslamateCyberUI Skill Installer ===" -ForegroundColor White
    Write-Host ""
    Write-Host "Select AI IDE platforms to install:" -ForegroundColor White
    Write-Host ""
    Write-Host "  1) Claude Code       (~\.claude\skills\ or .claude\skills\)"
    Write-Host "  2) Codex (OpenAI)    (~\.codex\skills\  or .codex\skills\)"
    Write-Host "  3) Gemini CLI        (~\.gemini\skills\  or .gemini\skills\)"
    Write-Host "  4) Antigravity       (~\.gemini\antigravity\skills\ or .agent\skills\)"
    Write-Host "  5) Cursor            (~\.cursor\skills\ or .cursor\skills\)"
    Write-Host "  a) All of the above"
    Write-Host "  q) Quit"
    Write-Host ""

    $choices = Read-Host "Enter choices (e.g. 1 3 5 or a)"

    foreach ($c in $choices.ToCharArray()) {
        switch ($c) {
            '1' { $selectedPlatforms += "claude" }
            '2' { $selectedPlatforms += "codex" }
            '3' { $selectedPlatforms += "gemini" }
            '4' { $selectedPlatforms += "antigravity" }
            '5' { $selectedPlatforms += "cursor" }
            'a' { $selectedPlatforms = $ALL_PLATFORMS; break }
            'A' { $selectedPlatforms = $ALL_PLATFORMS; break }
            'q' { Write-Host "Bye!"; exit 0 }
            'Q' { Write-Host "Bye!"; exit 0 }
            ' ' { } # ignore spaces
            default { Write-Warn "Ignoring unknown choice: $c" }
        }
    }

    # Deduplicate
    $selectedPlatforms = $selectedPlatforms | Select-Object -Unique

    if ($selectedPlatforms.Count -eq 0) {
        Write-Err "No platform selected."
        exit 1
    }

    Write-Host ""
    $scope = Read-Host "Install scope - (g)lobal or (p)roject? [p]"
    if ($scope -match "^[gG]") {
        $Global = $true
    }
}

# Find project root (look for .git)
function Find-ProjectRoot {
    $dir = Get-Location
    while ($null -ne $dir) {
        if (Test-Path (Join-Path $dir ".git")) {
            return $dir.Path
        }
        $parent = Split-Path $dir -Parent
        if ($parent -eq $dir) { break }
        $dir = $parent
    }
    return (Get-Location).Path
}

$PROJECT_ROOT = Find-ProjectRoot

# Get target directory
function Get-TargetDir {
    param([string]$platform)

    if ($Global) {
        $userHome = $env:USERPROFILE
        switch ($platform) {
            "claude" { return Join-Path $userHome ".claude\skills\$SKILL_NAME" }
            "codex" { return Join-Path $userHome ".codex\skills\$SKILL_NAME" }
            "gemini" { return Join-Path $userHome ".gemini\skills\$SKILL_NAME" }
            "antigravity" { return Join-Path $userHome ".gemini\antigravity\skills\$SKILL_NAME" }
            "cursor" { return Join-Path $userHome ".cursor\skills\$SKILL_NAME" }
        }
    }
    else {
        switch ($platform) {
            "claude" { return Join-Path $PROJECT_ROOT ".claude\skills\$SKILL_NAME" }
            "codex" { return Join-Path $PROJECT_ROOT ".codex\skills\$SKILL_NAME" }
            "gemini" { return Join-Path $PROJECT_ROOT ".gemini\skills\$SKILL_NAME" }
            "antigravity" { return Join-Path $PROJECT_ROOT ".agent\skills\$SKILL_NAME" }
            "cursor" { return Join-Path $PROJECT_ROOT ".cursor\skills\$SKILL_NAME" }
        }
    }
}

# Install skill
function Install-Skill {
    param([string]$platform)

    $target = Get-TargetDir $platform

    if (Test-Path $target) {
        Write-Warn "$platform`: already installed at $target (overwriting)"
        Remove-Item -Recurse -Force $target
    }

    $parentDir = Split-Path $target -Parent
    if (-not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }

    Copy-Item -Path $SCRIPT_DIR -Destination $target -Recurse -Force

    # Remove install scripts from the copied skill
    $installSh = Join-Path $target "install.sh"
    $installPs1 = Join-Path $target "install.ps1"
    if (Test-Path $installSh) { Remove-Item $installSh -Force }
    if (Test-Path $installPs1) { Remove-Item $installPs1 -Force }

    Write-Ok "$platform`: installed to $target"
}

Write-Host ""
Write-Host "Installing tesla-stats skill..." -ForegroundColor White
if ($Global) {
    Write-Info "Scope: Global ($env:USERPROFILE)"
}
else {
    Write-Info "Scope: Project ($PROJECT_ROOT)"
}
Write-Host ""

foreach ($platform in $selectedPlatforms) {
    Install-Skill $platform
}

Write-Host ""
Write-Host "[+] Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host '  1. Set environment variables:'
Write-Host '     $env:TESLA_STATS_BASE_URL = "http://your-server:8080/api/v1"'
Write-Host '     $env:TESLA_STATS_API_KEY  = "your-api-key"'
Write-Host '  2. Open your AI IDE and try: "Show my Tesla''s current status"'
Write-Host ""
