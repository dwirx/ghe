#!/bin/bash

# SSH Platform Testing Script for GhUx
# This script tests SSH connections to all major Git platforms

set +e  # Don't exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================================================"
echo "  GhUx SSH Platform Testing Script"
echo "================================================================"
echo ""

# Function to test SSH connection
test_ssh() {
    local platform=$1
    local host=$2
    local key_path=$3

    echo "----------------------------------------"
    echo -e "${BLUE}Testing: $platform${NC}"
    echo "Host: $host"
    if [ -n "$key_path" ]; then
        echo "Key: $key_path"
    fi
    echo "----------------------------------------"

    # Test connection
    echo -e "${YELLOW}Running: ssh -T git@$host${NC}"
    output=$(ssh -T git@$host 2>&1)
    exit_code=$?

    echo "Exit code: $exit_code"
    echo "Output:"
    echo "$output"
    echo ""

    # Check for success patterns
    if echo "$output" | grep -qiE "successfully authenticated|Welcome to GitLab|authenticated via|You can use git|Hi there,"; then
        echo -e "${GREEN}✓ SUCCESS - Authentication successful${NC}"
    elif [ $exit_code -eq 255 ]; then
        echo -e "${RED}✗ FAILED - Permission denied (publickey)${NC}"
        echo -e "${YELLOW}→ SSH key not added to platform or wrong key being used${NC}"
    elif [ $exit_code -eq 1 ] && echo "$output" | grep -qi "shell access is disabled"; then
        echo -e "${GREEN}✓ SUCCESS - Authenticated but shell access disabled (normal)${NC}"
    else
        echo -e "${RED}✗ FAILED - Unexpected response${NC}"
    fi
    echo ""
}

# Test GitHub
echo ""
echo "================================================================"
echo "1. GITHUB"
echo "================================================================"
test_ssh "GitHub" "github.com" "~/.ssh/id_ed25519_github"

# Test GitLab
echo ""
echo "================================================================"
echo "2. GITLAB"
echo "================================================================"
test_ssh "GitLab" "gitlab.com" "~/.ssh/gitlab_podsni"

# Test Bitbucket
echo ""
echo "================================================================"
echo "3. BITBUCKET"
echo "================================================================"
test_ssh "Bitbucket" "bitbucket.org" "~/.ssh/bitbucket_podsni"

# Test Gitea
echo ""
echo "================================================================"
echo "4. GITEA"
echo "================================================================"
test_ssh "Gitea" "gitea.com" "~/.ssh/gitea-podsni"

# Check SSH Config
echo ""
echo "================================================================"
echo "SSH CONFIG CHECK"
echo "================================================================"
echo ""

if [ -f ~/.ssh/config ]; then
    echo -e "${BLUE}Checking ~/.ssh/config for platform entries...${NC}"
    echo ""

    for host in "github.com" "gitlab.com" "bitbucket.org" "gitea.com"; do
        if grep -q "Host $host" ~/.ssh/config; then
            echo -e "${GREEN}✓ Found entry for: $host${NC}"
            grep -A 4 "Host $host" ~/.ssh/config | sed 's/^/  /'
            echo ""
        else
            echo -e "${YELLOW}⚠ No entry found for: $host${NC}"
            echo ""
        fi
    done
else
    echo -e "${RED}✗ SSH config file not found: ~/.ssh/config${NC}"
fi

# Check SSH Keys
echo ""
echo "================================================================"
echo "SSH KEY CHECK"
echo "================================================================"
echo ""

keys=(
    "~/.ssh/id_ed25519_github"
    "~/.ssh/gitlab_podsni"
    "~/.ssh/bitbucket_podsni"
    "~/.ssh/gitea-podsni"
)

for key in "${keys[@]}"; do
    expanded_key="${key/#\~/$HOME}"
    if [ -f "$expanded_key" ]; then
        perms=$(stat -c "%a" "$expanded_key" 2>/dev/null || stat -f "%Lp" "$expanded_key" 2>/dev/null)
        if [ "$perms" = "600" ]; then
            echo -e "${GREEN}✓ $key (permissions: $perms)${NC}"
        else
            echo -e "${YELLOW}⚠ $key (permissions: $perms - should be 600)${NC}"
        fi

        # Check public key
        if [ -f "$expanded_key.pub" ]; then
            pub_perms=$(stat -c "%a" "$expanded_key.pub" 2>/dev/null || stat -f "%Lp" "$expanded_key.pub" 2>/dev/null)
            echo -e "  ${BLUE}Public key: $key.pub (permissions: $pub_perms)${NC}"
        else
            echo -e "  ${YELLOW}⚠ Public key not found: $key.pub${NC}"
        fi
    else
        echo -e "${RED}✗ Key not found: $key${NC}"
    fi
    echo ""
done

# Summary
echo ""
echo "================================================================"
echo "SUMMARY"
echo "================================================================"
echo ""
echo "Next steps:"
echo "1. For any platform showing 'Permission denied', add your public key:"
echo "   - Copy: cat ~/.ssh/your_key.pub"
echo "   - Add to platform settings"
echo ""
echo "2. For permission warnings, fix with:"
echo "   chmod 600 ~/.ssh/private_key"
echo "   chmod 644 ~/.ssh/private_key.pub"
echo ""
echo "3. Test GhUx:"
echo "   cd ~/experiment/ghe"
echo "   bun run index.ts"
echo "   → Choose 'Test connection'"
echo ""
echo "4. If manual test succeeds but GhUx fails, send debug output to developer"
echo ""
echo "================================================================"
echo ""
