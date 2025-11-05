# Changelog

All notable changes to GHE will be documented in this file.

## [v1.0.8] - 2025-11-05

### 🎨 Rebranding

**BREAKING CHANGES**: Complete rebranding from GhUx/ghux/ghup to **GHE**

#### What Changed
- **Package Name**: `ghux` → `ghe`
- **Binary Name**: `ghux` → `ghe`
- **Config Directory**: `~/.config/ghup/` → `~/.config/ghe/`
- **Repository**: `dwirx/ghux` → `dwirx/ghe`
- **Command Usage**: All commands now use `ghe` instead of `ghux`

#### Migration Notes
- Config files from old locations (`~/.config/ghup/` or `~/.config/github-switch/`) are automatically migrated to `~/.config/ghe/` on first run
- SSH keys and git configurations remain unchanged
- Update your aliases and scripts to use `ghe` instead of `ghux`

#### Package Manager Updates
- NPM: `npm install -g ghe` (previously `ghux`)
- Homebrew: `brew tap dwirx/ghe` (previously `dwirx/ghux`)
- Scoop: Repository updated to `dwirx/scoop-ghe`
- AUR: Package renamed to `ghe-bin` (previously `ghux-bin`)

---

## [v1.0.7] - 2025-01-04

### 🐛 Bug Fixes - Windows Compatibility

#### Fixed Download Directory Creation Error
- **Fixed**: `ENOENT: no such file or directory, mkdir '.'` error on Windows
- **Issue**: When downloading files without specifying output directory, the tool attempted to create the current directory (`.`) which failed on Windows
- **Solution**: Added check in `ensureDirectory()` to skip directory creation for current directory paths (`.`, `./`, or empty string)

#### Fixed SSH Key Permission Check Loop
- **Fixed**: Health check continuously reporting SSH key permission issues on Windows even after fixing
- **Issue**: `getWindowsFilePermissions()` function was inaccurately parsing Windows ACL output, always returning `0o644` even after proper restrictions were applied
- **Solution**: 
  - Improved `icacls` output parsing to correctly detect:
    - Inheritance flags `(I)` - indicates not properly restricted
    - Proper ACL format: `username:(F)` or `username:F`
    - Built-in Windows groups: `BUILTIN\Users`, `Everyone`, `NT AUTHORITY\Authenticated Users`
  - Added double-check in health check to verify if permissions are actually restricted before warning
  - Now correctly identifies when SSH keys have proper Windows ACL restrictions (no inheritance, user-only access)

### 🎯 Improvements
- More accurate Windows file permission detection
- Better Windows ACL verification in health checks
- Cleaner error handling for Windows-specific path operations

---

## [v1.0.6] - 2025-01-XX

### 🎉 Major Feature: Universal Download with Smart Auto-Detection

Added comprehensive file download capability with ONE powerful command that does it all:
- **`ghe dl`** - Universal downloader with SMART AUTO-DETECTION
  - Automatically detects Git repositories (GitHub, GitLab, Bitbucket)
  - Automatically handles regular URLs (PDFs, ISOs, installers, etc.)
  - No need to think - just paste any URL!
- **`ghe dlx`** - Alternative explicit command (works identically to `dl`)

### ✨ New Features

#### 🎯 Smart Auto-Detection
- **Intelligent URL Detection**: Automatically detects if URL is a Git repository or regular file
- **No Manual Selection**: Just use `ghe dl` for everything - it figures it out!
- **Seamless Switching**: Git-specific options (branch, pattern) only apply to Git repos
- **Universal Options**: Authentication headers, custom user agents work for all URLs

#### 🚀 Universal Download Features (dl/dlx)
- **Download ANY File**: PDFs, ISOs, installers, media files, archives, scripts from ANY URL
- **Like curl/wget**: But with progress bars, better UX, and interactive prompts
- **Real-World Examples**:
  - `ghe dl https://omarchy.org/install`
  - `ghe dl https://hostnezt.com/cssfiles/general/the-psychology-of-money.pdf`
  - `ghe dl https://iso.omarchy.org/omarchy-3.1.5.iso`
  - `ghe dl https://releases.ubuntu.com/22.04/ubuntu.iso`
  - `ghe dl https://github.com/user/repo/blob/main/file.md`
- **Progress Tracking**: Real-time download progress with speed indicator
- **Custom Headers**: Add authentication headers, API keys, custom user agents
- **Batch Download**: Download multiple URLs or from file lists
- **Safe Downloads**: Overwrite protection, file info preview
- **Auto Filename**: Automatically extracts filename from URL or headers

#### 📥 Git Repository Features (when Git URL detected)
- **Download Single File**: Download any file from a repository with simple commands
- **Multiple URL Formats**: Support for blob, raw, and short URL formats
- **Custom Output**: Rename files on download with `-o` or `--output`
- **Directory Selection**: Download to specific directory with `-d` or `--dir`
- **Branch/Tag/Commit**: Specify exact version to download from
- **File Info**: Preview file details before downloading with `--info`
- **Progress Tracking**: Visual progress bar during downloads

#### 📂 Multiple Files Download
- **Batch Download**: Download multiple files at once
- **File List Support**: Download from a list of URLs in a text file
- **Pattern Matching**: Download files matching glob patterns (e.g., `*.md`, `src/**/*.ts`)
- **Exclude Patterns**: Skip files matching specific patterns
- **Concurrent Downloads**: Parallel downloads for better performance

#### 🗂️ Directory Download
- **Entire Directory**: Download complete directory structures
- **Preserve Path**: Maintain repository folder structure locally
- **Depth Control**: Limit directory traversal depth
- **Smart Filtering**: Combine with pattern matching for selective downloads

#### 🏷️ Release Downloads
- **Latest Release**: Download assets from the latest GitHub release
- **Version Selection**: Download from specific release version
- **Asset Filtering**: Select specific assets by name
- **Interactive Selection**: Multi-select interface for choosing assets

#### 🌐 Smart URL Parsing
- **GitHub URLs**: Full support for github.com and raw.githubusercontent.com
- **GitLab URLs**: Support for gitlab.com and self-hosted GitLab instances
- **Bitbucket URLs**: Full Bitbucket support
- **Short Format**: Quick syntax like `user/repo/file.md` (assumes GitHub/main)
- **Branch Notation**: Short syntax with branch: `user/repo:develop/file.md`

### 🔧 New Commands

```bash
# Universal download (ONE COMMAND FOR EVERYTHING!)
ghe dl <url>                           # Download from ANY URL (auto-detects Git or regular)
ghe dl <url> -o filename               # Custom filename
ghe dl <url> -d ~/Downloads/           # Custom directory
ghe dl -f urls.txt                     # Batch download from file list
ghe get <url>                          # Alias for dl
ghe fetch-file <url>                   # Alias for dl
ghe dlx <url>                          # Alternative (works identically to dl)

# Download with options
ghe dl <url> -o custom.txt             # Custom filename
ghe dl <url> -d ~/Downloads/           # Custom directory
ghe dl <url> --branch develop          # From specific branch
ghe dl <url> --info                    # Show info first

# Multiple files
ghe dl <url1> <url2> <url3>            # Multiple URLs
ghe dl -f filelist.txt                 # From file list

# Directory download
ghe dl-dir <url>                       # Download directory
ghe dl-dir <url> --depth 2             # Limit depth
ghe dl-dir <url> --pattern "*.md"      # With pattern

# Pattern download
ghe dl <repo-url> --pattern "*.js"     # All JS files
ghe dl <repo-url> --pattern "src/**/*" --exclude "test/*"

# Release download
ghe dl-release github.com/user/repo    # Latest release
ghe dl-release <repo> --version v1.0.0 # Specific version
ghe dl-release <repo> --asset binary   # Filter by name
```

### 📋 Download Options

#### Universal Options (work for ALL URLs - dl/dlx/get)
- `-o, --output <name>` - Custom output filename
- `-O` - Keep original filename
- `-d, --dir <path>` - Output directory
- `--preserve-path` - Preserve repository path structure
- `-f, --file-list <path>` - Download from file list
- `--pattern <glob>` - Download files matching pattern
- `--exclude <glob>` - Exclude files matching pattern
- `-b, --branch <name>` - Specify branch
- `-t, --tag <name>` - Specify tag
- `-c, --commit <hash>` - Specify commit
- `--info` - Show file info before download
- `--progress` - Show progress bar
- `--overwrite` - Overwrite existing files
- `--depth <n>` - Maximum directory depth (default: 10)
- `--asset <name>` - Filter release assets by name
- `--version <tag>` - Specific release version
- `-A, --user-agent <ua>` - Custom user agent string (all URLs)
- `-H, --header <header>` - Add custom HTTP header (all URLs)
- `--no-redirect` - Don't follow redirects (all URLs)

**Note**: Git-specific options (branch, pattern, tag, commit) are automatically ignored for non-Git URLs.

### 🛠️ Technical Changes

- **New Modules**:
  - `src/universalDownload.ts` - Universal downloader for any URL
  - `src/urlParser.ts` - URL parsing for GitHub, GitLab, Bitbucket
  - `src/download.ts` - Smart download with auto-detection (unified dl/dlx)
  - `src/utils/downloader.ts` - Download utilities with progress tracking
- **Smart Auto-Detection**: Automatically detects Git repository URLs vs regular URLs
- **Unified Command**: `ghe dl` handles both Git repos and any URL seamlessly
- **Enhanced URL Support**: Smart parsing of various Git hosting URL formats
- **API Integration**: Uses GitHub API for directory listings and release info
- **Retry Logic**: Automatic retry with exponential backoff for failed downloads
- **File System Operations**: Safe file handling with overwrite protection
- **Concurrent Downloads**: Promise.all for parallel file downloads
- **Fallback System**: Git parsing failures automatically fallback to universal download

### 📚 Documentation

- **DLX_UNIVERSAL_DOWNLOAD.md**: Complete guide for universal downloads (dlx)
- **DOWNLOAD_QUICK_START.md**: Quick start guide for dl/dlx commands
- **DOWNLOAD_FEATURE.md**: Advanced Git repository features
- **Updated Help**: Complete download command documentation with auto-detection
- **Usage Examples**: Real-world download scenarios for all URL types
- **URL Format Guide**: Supported URL formats for all platforms

### 🎯 Use Cases

**Universal Download (dl/dlx) - Works with ANY URL:**
- Download Linux ISOs (Ubuntu, Arch, Fedora, etc.)
- Download PDF documents and books
- Download installers and setup files
- Download media files (images, videos, audio)
- Download archives (zip, tar.gz, 7z)
- Download scripts and executables
- Download any file from any website

**Git Repository Download (dl with auto-detection):**
- Download configuration files from repositories
- Fetch documentation without cloning full repo
- Download build artifacts from releases
- Grab example files for quick reference
- Download entire documentation folders
- Batch download assets from releases

---

## [v1.0.1] - 2025-01-XX

### 🎉 Major Feature Update

Enhanced GHE with account health monitoring, activity logging, CLI shortcuts, and multi-platform support.

### ✨ New Features

#### 🏥 Account Health Check
- **Health Monitoring**: Check SSH keys and tokens validity for all accounts
- **Expiry Detection**: Detect expiring tokens (within 7 days warning)
- **Comprehensive Testing**: Test SSH connections and token authentication
- **Health Summary**: Visual dashboard showing healthy, warning, and error states
- **Automatic Caching**: Health check results saved for quick reference

#### 📜 Activity Log
- **Operation Tracking**: Log all account switches, additions, removals, and tests
- **History View**: View recent activity with timestamps and details
- **Statistics Dashboard**: See account usage, repository usage, method preferences
- **CSV Export**: Export activity log to CSV for external analysis
- **Success/Failure Tracking**: Monitor operation outcomes

#### ⚡ CLI Shortcuts
- **Direct Commands**: Run operations without interactive menu
  - `ghe switch <account>` - Switch to specific account by name
  - `ghe quick` - Quick switch menu with recent accounts starred
  - `ghe status` - Show current repository status and active account
  - `ghe list` - List all configured accounts
  - `ghe health` - Run health check on all accounts
  - `ghe log` - View activity log and statistics

#### 🚀 Git Shortcuts (Shove Commands)
- **ghe shove <message>**: Add all files, commit with message, confirm before push
- **ghe shovenc**: Add all files, commit with empty message, confirm before push
- **Confirmation**: Always asks before pushing to prevent accidents
- **Activity Logging**: Automatically logs push operations

#### 🌐 Multi-Platform Git Service Support
- **Platform Selection**: Choose from GitHub, GitLab, Bitbucket, Gitea, or Other
- **Custom Domains**: Support for self-hosted instances (e.g., gitlab.company.com)
- **Platform-Specific Testing**: Tailored connection tests for each platform
- **API Endpoints**: Custom API URLs for enterprise installations
- **Platform Tracking**: Activity log tracks which platform was used

### 🔧 Improvements
- **Enhanced Help**: Updated help text with all new commands and examples
- **Better UX**: Quick switch shows recently used accounts first with star indicator
- **Detailed Status**: Repository status command shows comprehensive information
- **Activity Integration**: All operations automatically logged for tracking
- **Platform Awareness**: System detects and adapts to different git platforms

### 📊 New Commands
```bash
ghe switch work          # Direct switch to account
ghe quick                # Quick switch to recent account
ghe status               # Show current repo status
ghe shove "fix: bug"     # Add, commit, and push
ghe shovenc              # Add, commit (no msg), and push
ghe health               # Check all accounts health
ghe log                  # View activity history
```

### 🔧 Platform-Aware SSH Fixes
- **Multi-Platform SSH Support**: SSH config and testing now fully platform-aware
- **Success Pattern Recognition**: Recognizes authentication messages from:
  - GitHub: `Hi username! You've successfully authenticated`
  - GitLab: `Welcome to GitLab, @username!`
  - Bitbucket: `authenticated via ssh key`
  - Gitea: `Hi there, username!`
- **Dynamic Hostname**: SSH config blocks now use correct hostname for each platform
- **Exit Code Handling**: Properly handles different exit codes (0, 1, 255) across platforms
- **Custom Domain Support**: Self-hosted instances fully supported with custom domains

### 🛠️ Technical Changes
- **New Modules**: 
  - `src/healthCheck.ts` - Account health verification
  - `src/activityLog.ts` - Activity tracking and statistics
  - `src/shortcuts.ts` - CLI shortcut implementations
- **Enhanced Types**: Added `GitPlatform`, `PlatformConfig`, `HealthStatus`, `ActivityLogEntry`
- **Config Extension**: AppConfig now includes `activityLog`, `healthChecks`, `lastHealthCheck`
- **Platform Integration**: All authentication methods support multiple platforms

### 📚 Documentation
- **Updated README**: New features documented with examples
- **Command Reference**: Complete list of CLI shortcuts and their usage
- **Help Text**: Enhanced `--help` output with all commands

### 🐛 Bug Fixes
- **SSH Config**: Fixed hardcoded `github.com` in `ensureSshConfigBlock()` - now platform-aware
- **SSH Test**: Fixed regex patterns to recognize Bitbucket and Gitea success messages
- **Platform Detection**: All SSH operations now use correct hostname based on account platform
- **Logging Consistency**: All operations now properly logged
- **Error Handling**: Better error messages in health checks
- **Permission Checks**: SSH key permission validation before testing

### 🧪 Testing & Documentation
- **Platform Testing Script**: Added `test_ssh_platforms.sh` for automated SSH testing
- **Troubleshooting Guide**: Comprehensive `TROUBLESHOOTING.md` with platform-specific solutions
- **Platform Test Guide**: Detailed `TEST_PLATFORMS.md` with expected outputs for all platforms
- **Debug Instructions**: Step-by-step debugging guide for SSH connection issues

---

## [v1.0.0] - 2025-01-XX

### 🎉 Initial Release

The first official release of **GHE** (formerly GhUp) - a beautiful GitHub account switcher for managing multiple GitHub accounts per repository.

### ✨ Core Features
- **Beautiful Terminal UI**: Charm-inspired interface with colors, gradients, and animations
- **Multi-Account Management**: Add, edit, remove, and list multiple GitHub accounts
- **Dual Authentication**: Support for both SSH keys and Personal Access Tokens
- **Repository Switching**: Switch accounts per repository with automatic configuration
- **Active Account Detection**: Automatically detect which account is currently active in a repository
- **Cross-Platform Support**: Full compatibility with Linux, Windows, and macOS

### 🔐 Authentication Methods
- **SSH Keys**: 
  - Generate new Ed25519 SSH keys
  - Import existing SSH keys
  - Automatic SSH config management
  - Per-account SSH key configuration
  - Global SSH configuration switching
- **Personal Access Tokens**:
  - HTTPS authentication with tokens
  - Credential store integration
  - Per-repository token management

### 🧪 Enhanced Connection Testing
- **SSH Key Validation**: Check if SSH key exists before testing connection
- **Enhanced Error Messages**: Display ✓/✗ icons with clear success/failure indicators
- **Inline Troubleshooting**: Provide step-by-step guidance when connection fails
- **Username Extraction**: Show authenticated username from GitHub response
- **HTTP Status Mapping**: Map token auth HTTP codes to descriptive error messages
- **Comprehensive Error Handling**: Try-catch blocks with detailed error information
- **Smart Host Detection**: Always test to github.com directly (fixes hostname resolution issues)
- **Visual Feedback**: Added loading spinners during connection tests
- **Detailed Logging**: Include operation details and status messages in output

### 🎯 User Experience
- **Interactive CLI**: Beautiful prompts with autocomplete and validation
- **Repository Context**: Show current repository status and active account
- **Visual Indicators**: Color-coded status indicators and icons
- **Helpful Messages**: Clear success/error messages with actionable guidance
- **Command Line Arguments**: Support for `--version` and `--help` flags

### 🛠️ Technical Features
- **Built with Bun**: Fast TypeScript runtime for optimal performance
- **Zero Dependencies**: Standalone binaries with everything included
- **TypeScript**: Fully typed codebase for reliability
- **Cross-Shell Compatibility**: Works with bash, zsh, fish, and other shells
- **Automatic Updates**: GitHub Actions workflows for releases and NPM publishing

### 📦 Distribution
- **NPM Package**: `npm install -g ghe`
- **Pre-built Binaries**: Available for all major platforms
- **GitHub Releases**: Automated release workflow with checksums
- **Multiple Install Methods**: One-line installer, package managers, manual download

### 🐛 Bug Fixes
- **SSH Hostname Resolution**: Fixed "Could not resolve hostname" error by always testing to github.com
- **Template Literal**: Fixed unclosed template literal in ASCII art rendering
- **Function Export**: Ensured all UI utility functions are properly exported
- **Permission Handling**: Proper file permissions for SSH keys and config files

### 📚 Documentation
- Complete README with usage examples
- Installation guides for all platforms
- Troubleshooting documentation
- Contributing guidelines
- Comprehensive inline code documentation

### 🆕 Added
- **Cross-Platform Support**: Full Windows, Linux, macOS compatibility
- **Platform Detection Utility**: Automatic OS detection and proper path handling
- **Enhanced Build System**: Organized standalone binary outputs in `build/` directory
- **Windows Compatibility Fixes**: Resolved figlet font loading issues on Windows

### 🔧 Fixed
- **Figlet Font Loading**: Graceful fallback system for ASCII art rendering on Windows
- **Path Handling**: Platform-aware SSH directory and config file paths
- **Git Credentials**: Cross-platform git credentials file location handling
- **TypeScript Compilation**: Fixed array indexing and multiselect prompt issues

### 🏗️ Infrastructure
- **Build Organization**: All build artifacts now organized in `build/` directory
- **GitHub Actions**: Updated CI/CD workflows for cross-platform builds
- **Type Safety**: Enhanced TypeScript strict mode compliance
- **Error Handling**: Improved null checks and error boundaries

### 🎨 UI/UX
- **Visual Consistency**: Platform-aware messages and path displays
- **User Experience**: Better error messages with platform-specific context
- **Interactive Prompts**: Fixed multiselect behavior for account method selection

### 🔧 Technical Improvements
- **Code Quality**: Refactored testConnectionFlow for better maintainability
- **Spinner Indicators**: Added loading spinners for visual feedback during tests
- **Smart Host Detection**: Automatically uses hostAlias or falls back to github.com
- **Detailed Logging**: Console output includes operation details and status messages

### 📚 Documentation
- **Cross-Platform Notes**: Updated README with Windows compatibility information
- **Build Instructions**: Enhanced documentation for multi-platform builds

---

## [v1.1.0] - Previous Version

### Features
- Interactive CLI for GitHub account switching
- SSH and Token authentication support
- Repository-specific account management
- Beautiful terminal UI with gradients and colors
- SSH key generation and management

---

**Legend:**
- 🆕 Added: New features
- 🔧 Fixed: Bug fixes
- 🏗️ Infrastructure: Build, CI/CD, tooling
- 🎨 UI/UX: User interface improvements
- 📝 Documentation: Documentation updates
