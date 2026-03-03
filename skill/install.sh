#!/usr/bin/env bash
# ============================================================
# TeslamateCyberUI Skill Installer (Linux/macOS)
# Supports: Claude Code, Codex, Gemini CLI, Antigravity, Cursor
# Usage: bash install.sh [--global] [platform ...]
#   platforms: claude, codex, gemini, antigravity, cursor, all
#   --global: install to user home (default: current project)
# Examples:
#   bash install.sh claude gemini       # project-level
#   bash install.sh --global all        # global for all platforms
# ============================================================

set -euo pipefail

SKILL_NAME="tesla-stats"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}ℹ${NC} $*"; }
ok()    { echo -e "${GREEN}✔${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*"; }
err()   { echo -e "${RED}✖${NC} $*"; }

GLOBAL=false
PLATFORMS=()

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    --global|-g) GLOBAL=true ;;
    claude|codex|gemini|antigravity|cursor|all)
      PLATFORMS+=("$arg") ;;
    *)
      err "Unknown argument: $arg"
      echo "Usage: bash install.sh [--global] [claude|codex|gemini|antigravity|cursor|all]"
      exit 1 ;;
  esac
done

# Expand "all"
if [[ " ${PLATFORMS[*]:-} " == *" all "* ]]; then
  PLATFORMS=(claude codex gemini antigravity cursor)
fi

# Interactive selection if no platforms specified
if [ ${#PLATFORMS[@]} -eq 0 ]; then
  echo ""
  echo -e "${BOLD}🚗 TeslamateCyberUI Skill Installer${NC}"
  echo ""
  echo "Select AI IDE platforms to install:"
  echo ""
  echo "  1) Claude Code       (~/.claude/skills/ or .claude/skills/)"
  echo "  2) Codex (OpenAI)    (~/.codex/skills/  or .codex/skills/)"
  echo "  3) Gemini CLI        (~/.gemini/skills/  or .gemini/skills/)"
  echo "  4) Antigravity       (~/.gemini/antigravity/skills/ or .agent/skills/)"
  echo "  5) Cursor            (~/.cursor/skills/ or .cursor/skills/)"
  echo "  a) All of the above"
  echo "  q) Quit"
  echo ""
  read -rp "Enter choices (e.g. 1 3 5 or a): " choices

  for c in $choices; do
    case "$c" in
      1) PLATFORMS+=(claude) ;;
      2) PLATFORMS+=(codex) ;;
      3) PLATFORMS+=(gemini) ;;
      4) PLATFORMS+=(antigravity) ;;
      5) PLATFORMS+=(cursor) ;;
      a|A) PLATFORMS=(claude codex gemini antigravity cursor); break ;;
      q|Q) echo "Bye!"; exit 0 ;;
      *) warn "Ignoring unknown choice: $c" ;;
    esac
  done

  if [ ${#PLATFORMS[@]} -eq 0 ]; then
    err "No platform selected."
    exit 1
  fi

  echo ""
  read -rp "Install scope - (g)lobal or (p)roject? [p]: " scope
  case "$scope" in
    g|G|global) GLOBAL=true ;;
    *) GLOBAL=false ;;
  esac
fi

# Determine project root (look for .git directory)
find_project_root() {
  local dir="$PWD"
  while [ "$dir" != "/" ]; do
    if [ -d "$dir/.git" ]; then
      echo "$dir"
      return
    fi
    dir="$(dirname "$dir")"
  done
  echo "$PWD"
}

PROJECT_ROOT="$(find_project_root)"

# Get target directory for each platform
get_target_dir() {
  local platform="$1"
  if $GLOBAL; then
    case "$platform" in
      claude)       echo "$HOME/.claude/skills/$SKILL_NAME" ;;
      codex)        echo "$HOME/.codex/skills/$SKILL_NAME" ;;
      gemini)       echo "$HOME/.gemini/skills/$SKILL_NAME" ;;
      antigravity)  echo "$HOME/.gemini/antigravity/skills/$SKILL_NAME" ;;
      cursor)       echo "$HOME/.cursor/skills/$SKILL_NAME" ;;
    esac
  else
    case "$platform" in
      claude)       echo "$PROJECT_ROOT/.claude/skills/$SKILL_NAME" ;;
      codex)        echo "$PROJECT_ROOT/.codex/skills/$SKILL_NAME" ;;
      gemini)       echo "$PROJECT_ROOT/.gemini/skills/$SKILL_NAME" ;;
      antigravity)  echo "$PROJECT_ROOT/.agent/skills/$SKILL_NAME" ;;
      cursor)       echo "$PROJECT_ROOT/.cursor/skills/$SKILL_NAME" ;;
    esac
  fi
}

# Install skill to a target directory
install_skill() {
  local platform="$1"
  local target
  target="$(get_target_dir "$platform")"

  if [ -d "$target" ]; then
    warn "$platform: already installed at $target (overwriting)"
    rm -rf "$target"
  fi

  mkdir -p "$(dirname "$target")"
  cp -r "$SCRIPT_DIR" "$target"

  # Remove install scripts from the copied skill
  rm -f "$target/install.sh" "$target/install.ps1"

  ok "$platform: installed to $target"
}

echo ""
echo -e "${BOLD}Installing tesla-stats skill...${NC}"
echo -e "Scope: $(if $GLOBAL; then echo 'Global (user home)'; else echo "Project ($PROJECT_ROOT)"; fi)"
echo ""

for platform in "${PLATFORMS[@]}"; do
  install_skill "$platform"
done

echo ""
echo -e "${GREEN}${BOLD}✔ Installation complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Set environment variables:"
echo "     export TESLA_STATS_BASE_URL=http://your-server:8080/api/v1"
echo "     export TESLA_STATS_API_KEY=your-api-key"
echo "  2. Open your AI IDE and try: \"Show my Tesla's current status\""
echo ""
