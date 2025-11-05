#!/bin/bash

# GhUx - Quick Publish Check Script
# This script helps you prepare and verify before publishing to NPM

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 GhUx - NPM Publish Preparation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check counter
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_TOTAL=0

check_item() {
    local name=$1
    local status=$2
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $name"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $name"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
}

# 1. Check if package.json exists
echo -e "${BLUE}[1/10]${NC} Checking package.json..."
if [ -f "package.json" ]; then
    check_item "package.json exists" "PASS"
else
    check_item "package.json exists" "FAIL"
fi

# 2. Check package name
echo -e "${BLUE}[2/10]${NC} Checking package name..."
PKG_NAME=$(node -p "require('./package.json').name" 2>/dev/null || echo "")
if [ "$PKG_NAME" = "ghe" ]; then
    check_item "Package name is 'ghe'" "PASS"
else
    check_item "Package name is 'ghe' (found: $PKG_NAME)" "FAIL"
fi

# 3. Check version consistency
echo -e "${BLUE}[3/10]${NC} Checking version consistency..."
VERSION_FILE=$(cat VERSION 2>/dev/null || echo "")
PKG_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
CLI_VERSION=$(grep "const PACKAGE_VERSION" src/cli.ts | sed -n 's/.*"\([0-9.]*\)".*/\1/p' || echo "")

if [ "$VERSION_FILE" = "$PKG_VERSION" ] && [ "$VERSION_FILE" = "$CLI_VERSION" ]; then
    check_item "Version consistent: $VERSION_FILE" "PASS"
else
    check_item "Version consistency (VERSION=$VERSION_FILE, package=$PKG_VERSION, cli=$CLI_VERSION)" "FAIL"
fi

# 4. Check repository URL
echo -e "${BLUE}[4/10]${NC} Checking repository URL..."
REPO_URL=$(node -p "require('./package.json').repository?.url" 2>/dev/null || echo "")
if [[ "$REPO_URL" == *"dwirx/ghe"* ]]; then
    check_item "Repository URL correct" "PASS"
else
    check_item "Repository URL (found: $REPO_URL)" "FAIL"
fi

# 5. Check binary name
echo -e "${BLUE}[5/10]${NC} Checking binary configuration..."
BIN_NAME=$(node -p "Object.keys(require('./package.json').bin || {})[0]" 2>/dev/null || echo "")
if [ "$BIN_NAME" = "ghe" ]; then
    check_item "Binary name is 'ghe'" "PASS"
else
    check_item "Binary name (found: $BIN_NAME)" "FAIL"
fi

# 6. Check index.ts exists
echo -e "${BLUE}[6/10]${NC} Checking entry point..."
if [ -f "index.ts" ] && [ -x "index.ts" ]; then
    check_item "index.ts exists and executable" "PASS"
elif [ -f "index.ts" ]; then
    check_item "index.ts exists but not executable" "FAIL"
    echo -e "${YELLOW}  → Run: chmod +x index.ts${NC}"
else
    check_item "index.ts exists" "FAIL"
fi

# 7. Check src/ directory
echo -e "${BLUE}[7/10]${NC} Checking source files..."
if [ -d "src" ] && [ -f "src/cli.ts" ]; then
    check_item "Source files present" "PASS"
else
    check_item "Source files present" "FAIL"
fi

# 8. Check no TypeScript errors
echo -e "${BLUE}[8/10]${NC} Checking TypeScript compilation..."
if command -v bun &> /dev/null; then
    if bun run --silent index.ts --help &> /dev/null; then
        check_item "TypeScript compiles successfully" "PASS"
    else
        check_item "TypeScript compilation" "FAIL"
    fi
else
    check_item "TypeScript compilation (bun not found, skipped)" "PASS"
fi

# 9. Check .npmignore
echo -e "${BLUE}[9/10]${NC} Checking .npmignore..."
if [ -f ".npmignore" ]; then
    check_item ".npmignore configured" "PASS"
else
    check_item ".npmignore missing" "FAIL"
    echo -e "${YELLOW}  → Create .npmignore to exclude unnecessary files${NC}"
fi

# 10. Check if version already published
echo -e "${BLUE}[10/10]${NC} Checking NPM registry..."
if command -v npm &> /dev/null; then
    if npm view ghe@$VERSION_FILE version &> /dev/null; then
        check_item "Version $VERSION_FILE not yet on NPM" "FAIL"
        echo -e "${YELLOW}  → Version already published, bump version!${NC}"
    else
        check_item "Version $VERSION_FILE ready to publish" "PASS"
    fi
else
    check_item "NPM check (npm not found, skipped)" "PASS"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "Total Checks:  ${BLUE}$CHECKS_TOTAL${NC}"
echo -e "Passed:        ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Failed:        ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🚀 Ready to Publish!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Choose your publish method:"
    echo ""
    echo -e "${YELLOW}Method 1: Auto Publish via GitHub (Recommended)${NC}"
    echo "  git add ."
    echo "  git commit -m 'Release v$VERSION_FILE'"
    echo "  git push origin main"
    echo ""
    echo -e "${YELLOW}Method 2: Manual Publish via GitHub Tag${NC}"
    echo "  git tag v$VERSION_FILE"
    echo "  git push origin v$VERSION_FILE"
    echo ""
    echo -e "${YELLOW}Method 3: Direct NPM Publish${NC}"
    echo "  npm publish --access public"
    echo ""
    echo -e "${YELLOW}Method 4: GitHub Actions Manual Trigger${NC}"
    echo "  1. Go to: https://github.com/dwirx/ghe/actions"
    echo "  2. Select 'Publish ghe to npm'"
    echo "  3. Click 'Run workflow'"
    echo ""
    echo "After publish, verify with:"
    echo "  npm view ghe"
    echo "  npm install -g ghe"
    echo "  ghe --version"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed!${NC}"
    echo ""
    echo "Please fix the issues above before publishing."
    echo ""
    exit 1
fi
