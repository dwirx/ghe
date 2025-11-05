# Windows Compatibility Fixes - v1.0.7

## 🪟 Major Windows Support Improvements

This release brings comprehensive Windows support with automatic detection, permission handling, and cross-platform compatibility.

## 🔧 Fixed Issues

### 1. **ENOENT Directory Creation Error** ✅
**Problem:** `ENOENT: no such file or directory, mkdir` error when running on Windows
- Directory creation failed due to path handling issues
- Windows-specific path separators not properly normalized

**Solution:**
- Implemented cross-platform `ensureDirectory()` function
- Replaced all `fs.mkdirSync()` calls with platform-aware version
- Automatic path normalization for Windows/Unix compatibility

**Affected Files:**
- `src/utils/platform.ts` - New `ensureDirectory()` function
- `src/ssh.ts` - Updated directory creation
- `src/config.ts` - Updated config directory handling
- `src/activityLog.ts` - Updated log directory creation
- `src/utils/downloader.ts` - Updated download directory creation
- `src/universalDownload.ts` - Updated output directory handling

### 2. **SSH Permission Errors on Windows** ✅
**Problem:** "Incorrect permissions (666), should be 600 or 400" warnings
- Windows uses ACL (Access Control Lists) instead of Unix permissions
- `fs.chmodSync()` doesn't work properly on Windows
- Health check incorrectly reported permission issues

**Solution:**
- Implemented Windows-specific permission handling using `icacls`
- New `setFilePermissions()` function detects OS and applies correct method
- New `getFilePermissions()` function reads permissions cross-platform
- Health check now Windows-aware with appropriate warnings

**Affected Files:**
- `src/utils/platform.ts` - Added `setFilePermissions()`, `getFilePermissions()`
- `src/ssh.ts` - Replaced all `fs.chmodSync()` calls
- `src/healthCheck.ts` - Updated permission checking logic

### 3. **Shell Detection and Adaptation** ✅
**Problem:** Commands failed in PowerShell, CMD, and Git Bash on Windows
- No shell environment detection
- Assumed Unix shell behavior

**Solution:**
- Implemented `detectShell()` function
- Detects: PowerShell, CMD, Git Bash, WSL, Bash, Zsh, Fish
- Commands adapt based on detected shell environment

**Affected Files:**
- `src/utils/platform.ts` - Added `detectShell()` function
- Platform info now includes detected shell

## 🆕 New Features

### Cross-Platform Functions
All platform-specific operations now handled by `src/utils/platform.ts`:

```typescript
// Shell Detection
detectShell(): string

// Path Handling
normalizePath(filepath: string): string
expandPath(filepath: string): string
isSafePath(filepath: string): boolean

// Directory Operations
getHomeDirectory(): string
getSshDirectory(): string
getConfigDirectory(appName?: string): string
getTempDirectory(): string
ensureDirectory(dirPath: string, mode?: number): boolean

// Permission Management (Cross-Platform)
setFilePermissions(filepath: string, mode: number): boolean
getFilePermissions(filepath: string): number | null

// Utility Functions
commandExists(command: string): boolean
getShellCommand(command: string, args: string[]): object
getPlatformInfo(): string
```

### Automatic Permission Fixing
Health check now offers to fix permission issues automatically:

```bash
ghux health
# If permission issues detected:
# "Some SSH keys have permission issues. Fix them automatically? (Y/n)"
```

### Windows-Specific Permission Handling
For private keys (mode 0o600):
```powershell
icacls "keyfile" /inheritance:r
icacls "keyfile" /grant:r "$env:USERNAME:F"
```

For SSH directory (mode 0o700):
```powershell
icacls ".ssh" /inheritance:r
icacls ".ssh" /grant:r "$env:USERNAME:(OI)(CI)F"
```

## 📋 New Documentation

### 1. **WINDOWS_SUPPORT.md**
Comprehensive Windows support guide including:
- Installation methods (npm, Bun, manual)
- Shell detection and compatibility
- SSH key permission management
- Common issues and solutions
- Shell-specific tips (PowerShell, CMD, Git Bash, WSL)
- Integration with VS Code, Windows Terminal
- Security considerations
- FAQs

### 2. **Test Scripts**
- `test-windows.ps1` - PowerShell compatibility test suite
- `test-windows.cmd` - CMD batch compatibility test

Run tests:
```powershell
# PowerShell
powershell -File test-windows.ps1

# CMD
test-windows.cmd
```

## 🔄 Platform Detection

### Detected Properties
```typescript
platform.isWindows  // true on Windows
platform.isLinux    // true on Linux
platform.isMacOS    // true on macOS
platform.isUnix     // true on Unix-like systems
platform.type       // 'win32', 'linux', 'darwin'
platform.arch       // 'x64', 'arm64', etc.
```

### Shell Detection
Automatically detects:
- **Windows:** PowerShell, CMD, Git Bash, WSL
- **Unix:** Bash, Zsh, Fish

View detected environment:
```bash
ghux info
```

## 📦 Updated Dependencies

No new dependencies added - all fixes use Node.js built-in modules:
- `fs` - File system operations
- `os` - Operating system detection
- `path` - Path normalization
- `child_process` - Shell command execution (for `icacls` on Windows)

## 🧪 Testing

### Automated Tests
```powershell
# PowerShell - Full test suite
powershell -File test-windows.ps1

# CMD - Basic compatibility test
test-windows.cmd
```

### Test Coverage
- ✅ Environment detection (Windows version, shell, user profile)
- ✅ Required tools (Git, SSH, Node.js/Bun, curl)
- ✅ Directory structure (SSH, config, credentials)
- ✅ Path handling (backslash, forward slash, tilde, env vars)
- ✅ File permissions (icacls, ACL reading/writing)
- ✅ Shell detection (PowerShell, CMD, Bash indicators)
- ✅ Network connectivity (GitHub API, DNS, downloads)
- ✅ Git configuration (user, credential helper)
- ✅ SSH operations (config, key generation, connection)
- ✅ GhSwitch installation (command availability, config file)

## 🔍 Error Handling

### Graceful Fallbacks
All Windows-specific operations include fallbacks:

```typescript
// Permission setting with fallback
try {
    icacls(...) // Try Windows ACL
} catch {
    try {
        attrib(...) // Fallback to basic attributes
    } catch {
        // Continue without permission changes
    }
}
```

### Improved Error Messages
- Platform-specific error context
- Helpful suggestions for Windows users
- Links to documentation

## 📊 Health Check Improvements

### Windows-Aware Checks
```bash
ghux health
```

Now properly handles:
- Windows ACL permissions (no false positives)
- Appropriate warning levels
- Automatic fix suggestions
- Platform-specific advice

### Health Check Output Example
```
📊 Health Summary
──────────────────────────────────────────────────
Total Accounts: 1
✓ Healthy: 1
⚠ Warnings: 0
✗ Errors: 0

📋 Detailed Results
──────────────────────────────────────────────────

▸ myaccount
  ✓ SSH: Valid
  ✓ Token: Valid
  Last checked: 1/4/2025, 7:20:18 AM

✓ Health check completed
```

## 🚀 Migration Guide

### From v1.0.6 to v1.0.7

**No breaking changes** - all existing configurations work automatically.

### Recommended Actions for Windows Users

1. **Run health check:**
   ```bash
   ghux health
   ```

2. **Fix permissions if needed:**
   Answer "Yes" when prompted to fix permission issues

3. **Run compatibility test:**
   ```powershell
   powershell -File test-windows.ps1
   ```

4. **Verify installation:**
   ```bash
   ghux --version
   ghux info
   ```

## 🐛 Bug Fixes

- Fixed: Directory creation on Windows (ENOENT errors)
- Fixed: SSH key permissions on Windows (false warnings)
- Fixed: Path normalization across shells
- Fixed: Config directory creation in AppData
- Fixed: Download file path handling
- Fixed: Health check permission validation

## 🎯 Performance Improvements

- Faster directory creation (single recursive call)
- Cached shell detection
- Optimized permission checks
- Reduced redundant file system operations

## 📝 Notes

### Compatibility
- ✅ Windows 10/11
- ✅ Windows Server 2016+
- ✅ PowerShell 5.1+
- ✅ PowerShell Core 7+
- ✅ Command Prompt (CMD)
- ✅ Git Bash
- ✅ WSL (Windows Subsystem for Linux)

### Requirements
- Windows 10 or later (recommended)
- OpenSSH Client (built-in on Windows 10+)
- Git for Windows
- Node.js 16+ or Bun 1.0+

### Known Limitations
- Windows 7/8 not officially supported (may work with OpenSSH installed)
- Some permission operations require administrator privileges
- icacls requires NTFS file system

## 🔗 Related Links

- [Windows Support Guide](WINDOWS_SUPPORT.md)
- [Main README](README.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)

## 👥 Contributors

Thanks to all users who reported Windows compatibility issues!

## 📅 Release Date

January 4, 2025

---

**Full Changelog:** v1.0.6...v1.0.7
**Download:** `npm install -g ghux@1.0.7`
