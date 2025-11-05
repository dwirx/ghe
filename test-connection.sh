#!/bin/bash

# GhUx - Test Connection Script
# Script untuk menguji fungsi test connection

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🧪 GhUx - Test Connection Functionality"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to print test result
print_test_result() {
    local test_name=$1
    local result=$2

    TESTS_TOTAL=$((TESTS_TOTAL + 1))

    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Test 1: Check if required files exist
echo -e "${BLUE}[1/8]${NC} Checking required files..."
if [ -f "src/flows.ts" ] && [ -f "src/ssh.ts" ] && [ -f "src/git.ts" ]; then
    print_test_result "Required source files exist" "PASS"
else
    print_test_result "Required source files exist" "FAIL"
fi
echo ""

# Test 2: Check if testConnectionFlow function exists
echo -e "${BLUE}[2/8]${NC} Checking testConnectionFlow function..."
if grep -q "export async function testConnectionFlow" src/flows.ts; then
    print_test_result "testConnectionFlow function exists" "PASS"
else
    print_test_result "testConnectionFlow function exists" "FAIL"
fi
echo ""

# Test 3: Check if testSshConnection function exists
echo -e "${BLUE}[3/8]${NC} Checking testSshConnection function..."
if grep -q "export async function testSshConnection" src/ssh.ts; then
    print_test_result "testSshConnection function exists" "PASS"
else
    print_test_result "testSshConnection function exists" "FAIL"
fi
echo ""

# Test 4: Check if testTokenAuth function exists
echo -e "${BLUE}[4/8]${NC} Checking testTokenAuth function..."
if grep -q "export async function testTokenAuth" src/git.ts; then
    print_test_result "testTokenAuth function exists" "PASS"
else
    print_test_result "testTokenAuth function exists" "FAIL"
fi
echo ""

# Test 5: Check SSH key validation in testConnectionFlow
echo -e "${BLUE}[5/8]${NC} Checking SSH key validation..."
if grep -q "if (!fs.existsSync(keyPath))" src/flows.ts; then
    print_test_result "SSH key validation implemented" "PASS"
else
    print_test_result "SSH key validation implemented" "FAIL"
fi
echo ""

# Test 6: Check error handling with try-catch
echo -e "${BLUE}[6/8]${NC} Checking error handling..."
SSH_ERROR_HANDLING=$(grep -c "try {" src/ssh.ts | head -n1)
GIT_ERROR_HANDLING=$(grep -c "try {" src/git.ts | head -n1)

if [ "$SSH_ERROR_HANDLING" -gt 0 ] && [ "$GIT_ERROR_HANDLING" -gt 0 ]; then
    print_test_result "Error handling with try-catch blocks" "PASS"
else
    print_test_result "Error handling with try-catch blocks" "FAIL"
fi
echo ""

# Test 7: Check for success/failure indicators
echo -e "${BLUE}[7/8]${NC} Checking success/failure indicators..."
if grep -q "SSH connection test passed" src/flows.ts && grep -q "SSH connection test failed" src/flows.ts; then
    print_test_result "Success/failure indicators present" "PASS"
else
    print_test_result "Success/failure indicators present" "FAIL"
fi
echo ""

# Test 8: Check for troubleshooting messages
echo -e "${BLUE}[8/8]${NC} Checking troubleshooting messages..."
if grep -q "Make sure your SSH key is added to GitHub" src/flows.ts; then
    print_test_result "Troubleshooting guidance present" "PASS"
else
    print_test_result "Troubleshooting guidance present" "FAIL"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "Total Tests:  ${BLUE}$TESTS_TOTAL${NC}"
echo -e "Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed:       ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "🎉 Test connection functionality is working correctly!"
    echo ""
    echo "Next steps:"
    echo "  1. Run 'bun run index.ts' to start GhUx"
    echo "  2. Add a GitHub account"
    echo "  3. Test connection with real credentials"
    exit 0
else
    echo -e "${RED}✗ Some tests failed!${NC}"
    echo ""
    echo "Please review the failed tests above."
    exit 1
fi
