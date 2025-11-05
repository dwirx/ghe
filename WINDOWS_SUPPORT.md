# Windows Support Guide

## Overview

GhSwitch (ghux) is fully compatible with Windows and supports multiple shell environments:
- **PowerShell** (recommended)
- **Command Prompt (CMD)**
- **Git Bash**
- **WSL (Windows Subsystem for Linux)**

## Installation on Windows

### Option 1: Using npm (Recommended)
```powershell
npm install -g ghux
```

### Option 2: Using Bun
```powershell
bun install -g ghux
```

### Option 3: Manual Installation
```powershell
git clone https://github.com/dwirx/ghux.git
cd ghux
bun install
bun run build
```

## Shell Detection

GhSwitch automatically detects your shell environment:
- Detects PowerShell, CMD, Bash, or WSL
- Adapts commands and paths accordingly
- No manual configuration needed

To verify detection:
```powershell
ghux info
```

## Windows-Specific Features

### 1. SSH Key Permissions

On Windows, SSH key permissions are handled using **icacls** instead of Unix chmod:

**Automatic Permission Setup:**
```powershell
# GhSwitch automatically sets:
# - Private keys: User-only Full Control (equivalent to 600)
# - Public keys: Default readable permissions (equivalent to 644)
# - SSH directory: User-only access (equivalent to 700)
```

**Manual Permission Fix (if needed):**
```powershell
# For private key
icacls "%USERPROFILE%\.ssh\id_ed25519_username" /inheritance:r
icacls "%USERPROFILE%\.ssh\id_ed25519_username" /grant:r "%USERNAME%:F"

# For SSH directory
icacls "%USERPROFILE%\.ssh" /inheritance:r
icacls "%USERPROFILE%\.ssh" /grant:r "%USERNAME%:(OI)(CI)F"
```

### 2. File Paths

GhSwitch handles Windows paths automatically:

**Default Locations:**
- SSH Directory: `%USERPROFILE%\.ssh`
- Config File: `%APPDATA%\github-switch\config.json`
- Git Credentials: `%USERPROFILE%\.git-credentials`

**Path Formats Supported:**
```powershell
# Windows style
C:\Users\YourName\.ssh\id_ed25519

# Unix style (converted automatically)
~/.ssh/id_ed25519

# Environment variables
%USERPROFILE%\.ssh\id_ed25519
```

### 3. Directory Creation

All directory operations are cross-platform:
- Automatic creation with proper permissions
- Handles both forward and backslashes
- No ENOENT errors on Windows

## Common Issues and Solutions

### Issue 1: "ENOENT: no such file or directory, mkdir"

**Solution:** This is now fixed. GhSwitch uses cross-platform directory creation.

If you still encounter this:
```powershell
# Ensure parent directory exists
mkdir -Force $env:APPDATA\github-switch
```

### Issue 2: "Incorrect permissions (666), should be 600 or 400"

**Solution:** Run the fix command in PowerShell:
```powershell
# Fix SSH key permissions
ghux health --fix
```

Or manually:
```powershell
$keyPath = "$env:USERPROFILE\.ssh\id_ed25519_username"
icacls $keyPath /inheritance:r
icacls $keyPath /grant:r "$env:USERNAME`:F"
```

### Issue 3: SSH Connection Test Fails

**Check SSH Installation:**
```powershell
# Windows 10/11 includes OpenSSH
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'

# Install if missing
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

**Test SSH Manually:**
```powershell
ssh -T git@github.com
```

### Issue 4: Git Command Not Found

**Install Git for Windows:**
1. Download from https://git-scm.com/download/win
2. Install with default options
3. Restart your terminal

**Verify Installation:**
```powershell
git --version
```

### Issue 5: Permission Denied on Downloads

**Run as Administrator (if needed):**
```powershell
# Right-click PowerShell -> "Run as Administrator"
ghux dl <url>
```

Or change download directory:
```powershell
# Download to current directory
ghux dl <url> --output ./filename

# Download to specific folder
ghux dl <url> --dir D:\Downloads
```

## Shell-Specific Tips

### PowerShell

**Recommended Profile Setup:**
```powershell
# Edit profile
notepad $PROFILE

# Add alias (optional)
Set-Alias -Name gs -Value ghux
```

**Execution Policy:**
```powershell
# If scripts are blocked
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Command Prompt (CMD)

**Basic Usage:**
```cmd
ghux add
ghux switch
ghux ls
```

**Creating Aliases:**
```cmd
doskey gs=ghux $*
```

### Git Bash

**Usage (Unix-like):**
```bash
ghux add
ghux switch
ghux ls
```

Git Bash provides the most Unix-like experience on Windows.

### WSL (Windows Subsystem for Linux)

**Installation in WSL:**
```bash
# Use Linux installation method
curl -fsSL https://bun.sh/install | bash
bun install -g ghux
```

**Accessing Windows Files:**
```bash
# Windows files are under /mnt/c/
cd /mnt/c/Users/YourName/projects
ghux switch
```

## Environment Variables

GhSwitch respects Windows environment variables:

```powershell
# User profile
$env:USERPROFILE

# Application data
$env:APPDATA
$env:LOCALAPPDATA

# Home directory (for compatibility)
$env:HOME
```

## Troubleshooting Commands

### Check Platform Info
```powershell
ghux info
```

### Health Check
```powershell
# Check all accounts
ghux health

# Detailed output
ghux health --verbose
```

### View Logs
```powershell
# Activity log location
type "$env:APPDATA\github-switch\activity.log"
```

### Reset Configuration
```powershell
# Backup current config
copy "$env:APPDATA\github-switch\config.json" "$env:APPDATA\github-switch\config.backup.json"

# Remove config (will recreate on next run)
del "$env:APPDATA\github-switch\config.json"
```

## Performance Tips

1. **Use PowerShell 7+**: Faster and more features
   ```powershell
   winget install Microsoft.PowerShell
   ```

2. **Enable Long Paths**: For deep directory structures
   ```powershell
   # Run as Administrator
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```

3. **Exclude from Antivirus**: If performance is slow
   ```powershell
   # Add exclusion for GhSwitch directory
   Add-MpPreference -ExclusionPath "$env:APPDATA\github-switch"
   ```

## Security Considerations

### SSH Keys on Windows

1. **Use Windows OpenSSH**: Built-in and well-integrated
2. **Key Storage**: Store in `%USERPROFILE%\.ssh`
3. **Permissions**: Let GhSwitch handle permissions automatically
4. **Key Agent**: Use ssh-agent for key management
   ```powershell
   # Start ssh-agent
   Start-Service ssh-agent
   
   # Add key
   ssh-add ~/.ssh/id_ed25519_username
   ```

### Token Security

1. **Never commit tokens**: Use environment variables
2. **Use Git Credential Manager**: Recommended for Windows
   ```powershell
   git config --global credential.helper wincred
   ```

3. **Rotate tokens regularly**: Check expiry with health check
   ```powershell
   ghux health
   ```

## Integration with Windows Tools

### Visual Studio Code
```json
// settings.json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.env.windows": {
    "PATH": "${env:PATH}"
  }
}
```

### Windows Terminal
```json
// settings.json - Add profile
{
  "name": "PowerShell (GhSwitch)",
  "commandline": "pwsh.exe -NoExit -Command \"& {ghux ls}\"",
  "startingDirectory": "%USERPROFILE%"
}
```

### GitHub Desktop
GhSwitch works alongside GitHub Desktop without conflicts.

## FAQs

**Q: Does GhSwitch work with GitHub for Windows?**
A: Yes, they work independently without conflicts.

**Q: Can I use both SSH and HTTPS?**
A: Yes, configure both methods for each account.

**Q: Does it work with corporate proxies?**
A: Yes, respects system proxy settings.

**Q: Can I use with multiple GitHub Enterprise servers?**
A: Yes, configure custom domains in account settings.

**Q: Does it support Windows Server?**
A: Yes, fully compatible with Windows Server 2016+.

## Getting Help

If you encounter issues:

1. **Check health**: `ghux health`
2. **View platform info**: `ghux info`
3. **Enable verbose logging**: `ghux --verbose`
4. **Report issues**: https://github.com/dwirx/ghux/issues

Include this information when reporting bugs:
```powershell
ghux info
$PSVersionTable.PSVersion
git --version
ssh -V
```

## Additional Resources

- [Main Documentation](README.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [SSH Key Setup](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [Windows OpenSSH](https://docs.microsoft.com/en-us/windows-server/administration/openssh/openssh_overview)