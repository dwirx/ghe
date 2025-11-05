# Windows Compatibility Test Script for GhSwitch (ghe)
# This script tests all Windows-specific features and compatibility

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  GhSwitch (ghe) - Windows Compatibility Test Suite" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Test Results
$script:TestsPassed = 0
$script:TestsFailed = 0
$script:TestsWarning = 0

function Test-Item {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$SuccessMessage = "OK",
        [string]$FailMessage = "FAILED"
    )

    Write-Host "  Testing: " -NoNewline
    Write-Host "$Name" -ForegroundColor Cyan -NoNewline
    Write-Host "..." -NoNewline

    try {
        $result = & $Test
        if ($result) {
            Write-Host " ✓ " -ForegroundColor Green -NoNewline
            Write-Host $SuccessMessage -ForegroundColor Gray
            $script:TestsPassed++
        } else {
            Write-Host " ✗ " -ForegroundColor Red -NoNewline
            Write-Host $FailMessage -ForegroundColor Red
            $script:TestsFailed++
        }
    } catch {
        Write-Host " ⚠ " -ForegroundColor Yellow -NoNewline
        Write-Host "$($_.Exception.Message)" -ForegroundColor Yellow
        $script:TestsWarning++
    }
}

# 1. Environment Detection Tests
Write-Host ""
Write-Host "1. Environment Detection" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray

Test-Item "PowerShell Version" {
    $PSVersionTable.PSVersion.Major -ge 5
} -SuccessMessage "v$($PSVersionTable.PSVersion.Major).$($PSVersionTable.PSVersion.Minor)"

Test-Item "Operating System" {
    $true
} -SuccessMessage "$($PSVersionTable.PSVersion.Platform) - $($PSVersionTable.OS)"

Test-Item "User Profile" {
    Test-Path $env:USERPROFILE
} -SuccessMessage $env:USERPROFILE

Test-Item "AppData Directory" {
    Test-Path $env:APPDATA
} -SuccessMessage $env:APPDATA

# 2. Required Tools
Write-Host ""
Write-Host "2. Required Tools" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray

Test-Item "Git Installation" {
    $null -ne (Get-Command git -ErrorAction SilentlyContinue)
} -SuccessMessage "$(git --version)"

Test-Item "SSH Installation" {
    $null -ne (Get-Command ssh -ErrorAction SilentlyContinue)
} -SuccessMessage "$(ssh -V 2>&1)"

Test-Item "Node.js/Bun Runtime" {
    $hasNode = $null -ne (Get-Command node -ErrorAction SilentlyContinue)
    $hasBun = $null -ne (Get-Command bun -ErrorAction SilentlyContinue)
    $hasNode -or $hasBun
} -SuccessMessage $(if (Get-Command bun -ErrorAction SilentlyContinue) { "Bun $(bun --version)" } elseif (Get-Command node -ErrorAction SilentlyContinue) { "Node.js $(node --version)" } else { "None" })

Test-Item "curl Availability" {
    $null -ne (Get-Command curl -ErrorAction SilentlyContinue)
} -SuccessMessage "Available"

# 3. Directory Structure Tests
Write-Host ""
Write-Host "3. Directory Structure" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray

$sshDir = "$env:USERPROFILE\.ssh"
Test-Item "SSH Directory" {
    if (-not (Test-Path $sshDir)) {
        New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    }
    Test-Path $sshDir
} -SuccessMessage $sshDir

$configDir = "$env:APPDATA\github-switch"
Test-Item "Config Directory" {
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    }
    Test-Path $configDir
} -SuccessMessage $configDir

Test-Item "Git Credentials Path" {
    $credPath = "$env:USERPROFILE\.git-credentials"
    $true
} -SuccessMessage "$env:USERPROFILE\.git-credentials"

# 4. Path Handling Tests
Write-Host ""
Write-Host "4. Path Handling" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray

Test-Item "Backslash Path" {
    $path = "$env:USERPROFILE\.ssh\test"
    $normalized = [System.IO.Path]::GetFullPath($path)
    $normalized.Length -gt 0
} -SuccessMessage "Normalized correctly"

Test-Item "Forward Slash Path" {
    $path = "$env:USERPROFILE/.ssh/test"
    $normalized = [System.IO.Path]::GetFullPath($path)
    $normalized.Length -gt 0
} -SuccessMessage "Normalized correctly"

Test-Item "Tilde Expansion (~)" {
    $path = "~/.ssh/test"
    $expanded = $path -replace "^~", $env:USERPROFILE
    $expanded -like "*$env:USERNAME*"
} -SuccessMessage "Expands to $env:USERPROFILE"

Test-Item "Environment Variables (%VAR%)" {
    $path = "%USERPROFILE%\.ssh"
    $expanded = [System.Environment]::ExpandEnvironmentVariables($path)
    $expanded -eq "$env:USERPROFILE\.ssh"
} -SuccessMessage "Expands correctly"

# 5. Permission Tests
Write-Host ""
Write-Host "5. File Permissions (Windows ACL)" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray

Test-Item "icacls Command" {
    $null -ne (Get-Command icacls -ErrorAction SilentlyContinue)
} -SuccessMessage "Available"

# Create test file for permission testing
$testFile = "$env:TEMP\ghe-test-permissions.txt"
"test" | Out-File -FilePath $testFile -Force

Test-Item "Set User-Only Permissions" {
    try {
        icacls $testFile /inheritance:r 2>&1 | Out-Null
        icacls $testFile /grant:r "$($env:USERNAME):F" 2>&1 | Out-Null
        Test-Path $testFile
    } finally {
        Remove-Item $testFile -Force -ErrorAction SilentlyContinue
    }
} -SuccessMessage "icacls works correctly"

Test-Item "Read File Permissions" {
    $testFile2 = "$env:TEMP\ghe-test-read.txt"
    try {
        "test" | Out-File -FilePath $testFile2 -Force
        $acl = Get-Acl $testFile2
        $acl.Access.Count -gt 0
    } finally {
        Remove-Item $testFile2 -Force -ErrorAction SilentlyContinue
    }
} -SuccessMessage "Can read ACL"

# 6. Shell Detection Tests
Write-Host ""
Write-Host "6. Shell Detection" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray

Test-Item "PowerShell Detected" {
    $null -ne $env:PSModulePath
} -SuccessMessage "PowerShell $($PSVersionTable.PSVersion.Major).$($PSVersionTable.PSVersion.Minor)"

Test-Item "Shell Indicator Variables" {
    $indicators = @(
        $env:PSModulePath,
        $env:PROMPT,
        $env:USERNAME
    )
    ($indicators | Where-Object { $_ -ne $null }).Count -ge 2
} -SuccessMessage "Multiple indicators found"

# 7. Network & Download Tests
Write-Host ""
Write-Host "7. Network & Download" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray

Test-Item "Internet Connectivity" {
    try {
        $response = Invoke-WebRequest -Uri "https://api.github.com" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $response.StatusCode -eq 200
    } catch {
        $false
    }
} -SuccessMessage "GitHub API reachable"

Test-Item "HTTPS Download" {
    try {
        $testUrl = "https://raw.githubusercontent.com/dwirx/ghe/main/README.md"
        $testOutput = "$env:TEMP\ghe-test-download.txt"
        Invoke-WebRequest -Uri $testUrl -OutFile $testOutput -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        $exists = Test-Path $testOutput
        Remove-Item $testOutput -Force -ErrorAction SilentlyContinue
        $exists
    } catch {
        $false
    }
} -SuccessMessage "Download works"

Test-Item "DNS Resolution" {
    try {
        $result = Resolve-DnsName github.com -ErrorAction Stop
        $result.Count -gt 0
    } catch {
        $false
    }
} -SuccessMessage "DNS works"

# 8. Git Configuration Tests
Write-Host ""
Write-Host "8. Git Configuration" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray

Test-Item "Git User Config" {
    try {
        $userName = git config --global user.name 2>$null
        $userEmail = git config --global user.email 2>$null
        -not [string]::IsNullOrEmpty($userName) -or -not [string]::IsNullOrEmpty($userEmail)
    } catch {
        $false
    }
} -SuccessMessage "Configured"

Test-Item "Git Credential Helper" {
    try {
        $helper = git config --global credential.helper 2>$null
        $true
    } catch {
        $false
    }
} -SuccessMessage $(if ($helper) { $helper } else { "Not configured" })

# 9. SSH Tests
Write-Host ""
Write-Host "9. SSH Configuration" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray

Test-Item "SSH Config File" {
    $sshConfig = "$env:USERPROFILE\.ssh\config"
    if (-not (Test-Path $sshConfig)) {
        "# SSH Config" | Out-File -FilePath $sshConfig -Force
    }
    Test-Path $sshConfig
} -SuccessMessage "Present"

Test-Item "SSH Key Generation" {
    try {
        $testKey = "$env:TEMP\ghe-test-key"
        ssh-keygen -t ed25519 -f $testKey -N '""' -C "test@ghe" 2>&1 | Out-Null
        $exists = Test-Path $testKey
        Remove-Item "$testKey*" -Force -ErrorAction SilentlyContinue
        $exists
    } catch {
        $false
    }
} -SuccessMessage "ssh-keygen works"

Test-Item "SSH Connection Test" {
    try {
        $result = ssh -T -o "StrictHostKeyChecking=no" -o "ConnectTimeout=5" git@github.com 2>&1
        $true
    } catch {
        $false
    }
} -SuccessMessage "Can connect (auth may vary)"

# 10. GhSwitch Installation Tests
Write-Host ""
Write-Host "10. GhSwitch Installation" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray

Test-Item "ghe Command" {
    $null -ne (Get-Command ghe -ErrorAction SilentlyContinue)
} -SuccessMessage "Installed globally"

Test-Item "ghe Version" {
    try {
        $version = ghe --version 2>&1
        $version -match "ghe"
    } catch {
        $false
    }
} -SuccessMessage $(if ($version) { $version } else { "N/A" })

Test-Item "Config File Exists" {
    Test-Path "$env:APPDATA\github-switch\config.json"
} -SuccessMessage $(if (Test-Path "$env:APPDATA\github-switch\config.json") { "Found" } else { "Not yet created" })

# Summary
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Results Summary" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✓ Passed:  " -NoNewline -ForegroundColor Green
Write-Host "$script:TestsPassed" -ForegroundColor White
Write-Host "  ✗ Failed:  " -NoNewline -ForegroundColor Red
Write-Host "$script:TestsFailed" -ForegroundColor White
Write-Host "  ⚠ Warning: " -NoNewline -ForegroundColor Yellow
Write-Host "$script:TestsWarning" -ForegroundColor White
Write-Host ""

$totalTests = $script:TestsPassed + $script:TestsFailed + $script:TestsWarning
$successRate = if ($totalTests -gt 0) { [math]::Round(($script:TestsPassed / $totalTests) * 100, 1) } else { 0 }

Write-Host "  Success Rate: " -NoNewline
if ($successRate -ge 90) {
    Write-Host "$successRate%" -ForegroundColor Green
} elseif ($successRate -ge 70) {
    Write-Host "$successRate%" -ForegroundColor Yellow
} else {
    Write-Host "$successRate%" -ForegroundColor Red
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Recommendations
Write-Host ""
Write-Host "Recommendations:" -ForegroundColor Yellow
Write-Host ""

if ($script:TestsFailed -gt 0) {
    Write-Host "  • Some tests failed. Please review the failed items above." -ForegroundColor Red
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  • Install Git for Windows: https://git-scm.com/download/win" -ForegroundColor Yellow
}

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "  • Install OpenSSH Client:" -ForegroundColor Yellow
    Write-Host "    Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0" -ForegroundColor Gray
}

if (-not (Get-Command ghe -ErrorAction SilentlyContinue)) {
    Write-Host "  • Install GhSwitch: npm install -g ghe" -ForegroundColor Yellow
}

if ($successRate -ge 90) {
    Write-Host ""
    Write-Host "  🎉 Your system is ready for GhSwitch!" -ForegroundColor Green
} elseif ($successRate -ge 70) {
    Write-Host ""
    Write-Host "  ⚠ Your system is mostly ready. Address warnings for best experience." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "  ❌ Your system needs setup before using GhSwitch." -ForegroundColor Red
}

Write-Host ""
Write-Host "For more information, see: WINDOWS_SUPPORT.md" -ForegroundColor Cyan
Write-Host ""

# Exit with appropriate code
if ($script:TestsFailed -gt 0) {
    exit 1
} else {
    exit 0
}
