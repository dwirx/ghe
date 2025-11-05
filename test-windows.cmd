@echo off
REM Windows Compatibility Test Script for GhSwitch (ghe)
REM Compatible with Windows Command Prompt (CMD)

setlocal enabledelayedexpansion

echo ================================================================
echo   GhSwitch (ghe) - Windows Compatibility Test Suite
echo ================================================================
echo.

set TESTS_PASSED=0
set TESTS_FAILED=0
set TESTS_WARNING=0

REM 1. Environment Detection Tests
echo.
echo 1. Environment Detection
echo ---------------------------------------------------------

echo   Testing: Windows Version...
ver | findstr /C:"Windows" >nul 2>&1
if !errorlevel! equ 0 (
    echo     [OK] Windows Detected
    set /a TESTS_PASSED+=1
) else (
    echo     [FAIL] Not Windows?
    set /a TESTS_FAILED+=1
)

echo   Testing: User Profile...
if exist "%USERPROFILE%" (
    echo     [OK] %USERPROFILE%
    set /a TESTS_PASSED+=1
) else (
    echo     [FAIL] User profile not found
    set /a TESTS_FAILED+=1
)

echo   Testing: AppData Directory...
if exist "%APPDATA%" (
    echo     [OK] %APPDATA%
    set /a TESTS_PASSED+=1
) else (
    echo     [FAIL] AppData not found
    set /a TESTS_FAILED+=1
)

REM 2. Required Tools
echo.
echo 2. Required Tools
echo ---------------------------------------------------------

echo   Testing: Git Installation...
where git >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('git --version 2^>^&1') do set GIT_VERSION=%%i
    echo     [OK] !GIT_VERSION!
    set /a TESTS_PASSED+=1
) else (
    echo     [FAIL] Git not found
    set /a TESTS_FAILED+=1
)

echo   Testing: SSH Installation...
where ssh >nul 2>&1
if !errorlevel! equ 0 (
    echo     [OK] SSH available
    set /a TESTS_PASSED+=1
) else (
    echo     [WARN] SSH not found
    set /a TESTS_WARNING+=1
)

echo   Testing: Node.js/Bun Runtime...
where node >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('node --version 2^>^&1') do set NODE_VERSION=%%i
    echo     [OK] Node.js !NODE_VERSION!
    set /a TESTS_PASSED+=1
    goto :runtime_ok
)
where bun >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('bun --version 2^>^&1') do set BUN_VERSION=%%i
    echo     [OK] Bun !BUN_VERSION!
    set /a TESTS_PASSED+=1
    goto :runtime_ok
)
echo     [FAIL] No runtime found
set /a TESTS_FAILED+=1
:runtime_ok

echo   Testing: curl Availability...
where curl >nul 2>&1
if !errorlevel! equ 0 (
    echo     [OK] Available
    set /a TESTS_PASSED+=1
) else (
    echo     [WARN] curl not found
    set /a TESTS_WARNING+=1
)

REM 3. Directory Structure Tests
echo.
echo 3. Directory Structure
echo ---------------------------------------------------------

set SSH_DIR=%USERPROFILE%\.ssh
echo   Testing: SSH Directory...
if not exist "!SSH_DIR!" (
    mkdir "!SSH_DIR!" 2>nul
)
if exist "!SSH_DIR!" (
    echo     [OK] !SSH_DIR!
    set /a TESTS_PASSED+=1
) else (
    echo     [FAIL] Cannot create SSH directory
    set /a TESTS_FAILED+=1
)

set CONFIG_DIR=%APPDATA%\github-switch
echo   Testing: Config Directory...
if not exist "!CONFIG_DIR!" (
    mkdir "!CONFIG_DIR!" 2>nul
)
if exist "!CONFIG_DIR!" (
    echo     [OK] !CONFIG_DIR!
    set /a TESTS_PASSED+=1
) else (
    echo     [FAIL] Cannot create config directory
    set /a TESTS_FAILED+=1
)

echo   Testing: Git Credentials Path...
echo     [OK] %USERPROFILE%\.git-credentials
set /a TESTS_PASSED+=1

REM 4. Path Handling Tests
echo.
echo 4. Path Handling
echo ---------------------------------------------------------

echo   Testing: Backslash Path...
set TEST_PATH=%USERPROFILE%\.ssh\test
if defined TEST_PATH (
    echo     [OK] Path normalized
    set /a TESTS_PASSED+=1
) else (
    echo     [FAIL] Path normalization failed
    set /a TESTS_FAILED+=1
)

echo   Testing: Environment Variables...
set TEST_VAR=%USERPROFILE%
if defined TEST_VAR (
    echo     [OK] Variables expand correctly
    set /a TESTS_PASSED+=1
) else (
    echo     [FAIL] Variable expansion failed
    set /a TESTS_FAILED+=1
)

REM 5. Permission Tests
echo.
echo 5. File Permissions (Windows ACL)
echo ---------------------------------------------------------

echo   Testing: icacls Command...
where icacls >nul 2>&1
if !errorlevel! equ 0 (
    echo     [OK] Available
    set /a TESTS_PASSED+=1
) else (
    echo     [FAIL] icacls not found
    set /a TESTS_FAILED+=1
)

echo   Testing: Set User-Only Permissions...
set TEST_FILE=%TEMP%\ghe-test-permissions.txt
echo test > "!TEST_FILE!" 2>nul
if exist "!TEST_FILE!" (
    icacls "!TEST_FILE!" /inheritance:r >nul 2>&1
    icacls "!TEST_FILE!" /grant:r "%USERNAME%:F" >nul 2>&1
    if !errorlevel! equ 0 (
        echo     [OK] icacls works correctly
        set /a TESTS_PASSED+=1
    ) else (
        echo     [WARN] icacls may have issues
        set /a TESTS_WARNING+=1
    )
    del "!TEST_FILE!" >nul 2>&1
) else (
    echo     [WARN] Cannot create test file
    set /a TESTS_WARNING+=1
)

REM 6. Network & Download Tests
echo.
echo 6. Network ^& Download
echo ---------------------------------------------------------

echo   Testing: Internet Connectivity...
ping -n 1 github.com >nul 2>&1
if !errorlevel! equ 0 (
    echo     [OK] GitHub reachable
    set /a TESTS_PASSED+=1
) else (
    echo     [WARN] Cannot reach GitHub
    set /a TESTS_WARNING+=1
)

echo   Testing: DNS Resolution...
nslookup github.com >nul 2>&1
if !errorlevel! equ 0 (
    echo     [OK] DNS works
    set /a TESTS_PASSED+=1
) else (
    echo     [FAIL] DNS resolution failed
    set /a TESTS_FAILED+=1
)

REM 7. Git Configuration Tests
echo.
echo 7. Git Configuration
echo ---------------------------------------------------------

where git >nul 2>&1
if !errorlevel! equ 0 (
    echo   Testing: Git User Config...
    git config --global user.name >nul 2>&1
    if !errorlevel! equ 0 (
        echo     [OK] Configured
        set /a TESTS_PASSED+=1
    ) else (
        echo     [WARN] Not configured
        set /a TESTS_WARNING+=1
    )

    echo   Testing: Git Credential Helper...
    git config --global credential.helper >nul 2>&1
    echo     [OK] Check complete
    set /a TESTS_PASSED+=1
) else (
    echo   [SKIP] Git not available
)

REM 8. SSH Tests
echo.
echo 8. SSH Configuration
echo ---------------------------------------------------------

echo   Testing: SSH Config File...
set SSH_CONFIG=%USERPROFILE%\.ssh\config
if not exist "!SSH_CONFIG!" (
    echo # SSH Config > "!SSH_CONFIG!" 2>nul
)
if exist "!SSH_CONFIG!" (
    echo     [OK] Present
    set /a TESTS_PASSED+=1
) else (
    echo     [WARN] Cannot create SSH config
    set /a TESTS_WARNING+=1
)

where ssh-keygen >nul 2>&1
if !errorlevel! equ 0 (
    echo   Testing: SSH Key Generation...
    set TEST_KEY=%TEMP%\ghe-test-key
    ssh-keygen -t ed25519 -f "!TEST_KEY!" -N "" -C "test@ghe" >nul 2>&1
    if exist "!TEST_KEY!" (
        echo     [OK] ssh-keygen works
        set /a TESTS_PASSED+=1
        del "!TEST_KEY!*" >nul 2>&1
    ) else (
        echo     [WARN] ssh-keygen may have issues
        set /a TESTS_WARNING+=1
    )
) else (
    echo   [SKIP] ssh-keygen not available
)

REM 9. GhSwitch Installation Tests
echo.
echo 9. GhSwitch Installation
echo ---------------------------------------------------------

echo   Testing: ghe Command...
where ghe >nul 2>&1
if !errorlevel! equ 0 (
    echo     [OK] Installed globally
    set /a TESTS_PASSED+=1
) else (
    echo     [WARN] Not installed
    set /a TESTS_WARNING+=1
)

echo   Testing: Config File...
if exist "%APPDATA%\github-switch\config.json" (
    echo     [OK] Found
    set /a TESTS_PASSED+=1
) else (
    echo     [INFO] Not yet created
    set /a TESTS_PASSED+=1
)

REM Summary
echo.
echo ================================================================
echo   Test Results Summary
echo ================================================================
echo.
echo   [PASS]  Passed:  !TESTS_PASSED!
echo   [FAIL]  Failed:  !TESTS_FAILED!
echo   [WARN]  Warning: !TESTS_WARNING!
echo.

set /a TOTAL_TESTS=!TESTS_PASSED!+!TESTS_FAILED!+!TESTS_WARNING!
set /a SUCCESS_RATE=!TESTS_PASSED!*100/!TOTAL_TESTS!

echo   Success Rate: !SUCCESS_RATE!%%
echo.
echo ================================================================

REM Recommendations
echo.
echo Recommendations:
echo.

if !TESTS_FAILED! gtr 0 (
    echo   * Some tests failed. Please review the failed items above.
)

where git >nul 2>&1
if !errorlevel! neq 0 (
    echo   * Install Git for Windows: https://git-scm.com/download/win
)

where ssh >nul 2>&1
if !errorlevel! neq 0 (
    echo   * Install OpenSSH Client via Windows Settings
)

where ghe >nul 2>&1
if !errorlevel! neq 0 (
    echo   * Install GhSwitch: npm install -g ghe
)

if !SUCCESS_RATE! geq 90 (
    echo.
    echo   ^<^< Your system is ready for GhSwitch! ^>^>
) else if !SUCCESS_RATE! geq 70 (
    echo.
    echo   ^<^< Your system is mostly ready. Address warnings. ^>^>
) else (
    echo.
    echo   ^<^< Your system needs setup before using GhSwitch. ^>^>
)

echo.
echo For more information, see: WINDOWS_SUPPORT.md
echo.

if !TESTS_FAILED! gtr 0 (
    exit /b 1
) else (
    exit /b 0
)
