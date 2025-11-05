# 🎉 GhUx v1.0.5 Release Notes

## 📥 Major Feature: File Download from Git Repositories

We're excited to announce GhUx v1.0.5 with comprehensive file download capabilities! Now you can download files and directories directly from GitHub, GitLab, and Bitbucket repositories without cloning the entire repo.

---

## ✨ What's New

### 📥 Single File Download

Download any file from a repository with simple commands:

```bash
# Download a single file
ghux dl https://github.com/dwirx/ghux/blob/main/README.md

# Download with custom name
ghux dl <url> -o my-readme.md

# Download to specific directory
ghux dl <url> -d ~/Downloads/
```

**Aliases:** `ghux get`, `ghux fetch-file`

### 📂 Multiple Files Download

Download multiple files at once or from a file list:

```bash
# Multiple URLs
ghux dl url1 url2 url3

# From a file list
ghux dl -f urls.txt
```

### 🗂️ Directory Download

Download entire directories with structure preservation:

```bash
# Download entire directory
ghux dl-dir https://github.com/user/repo/tree/main/src

# Limit directory depth
ghux dl-dir <url> --depth 2
```

### 🎯 Pattern Matching

Download files matching specific patterns:

```bash
# Download all markdown files
ghux dl github.com/user/repo --pattern "*.md"

# Download TypeScript files in src directory
ghux dl github.com/user/repo --pattern "src/**/*.ts"

# Exclude patterns
ghux dl github.com/user/repo --pattern "*.js" --exclude "test/*"
```

### 🏷️ Release Downloads

Download assets from GitHub releases:

```bash
# Download from latest release
ghux dl-release github.com/user/repo

# Specific release version
ghux dl-release github.com/user/repo --version v2.0.0

# Filter by asset name
ghux dl-release github.com/user/repo --asset linux
```

### 🌿 Branch/Tag/Commit Specific

Download from any version:

```bash
# From specific branch
ghux dl <url> --branch develop

# From tag
ghux dl <url> --tag v1.2.3

# From commit
ghux dl <url> --commit abc123

# Short syntax
ghux dl user/repo:develop/file.md
```

---

## 🌐 Smart URL Parsing

Supports multiple Git hosting platforms and URL formats:

### Supported Platforms

- ✅ **GitHub** - github.com and raw.githubusercontent.com
- ✅ **GitLab** - gitlab.com and self-hosted instances
- ✅ **Bitbucket** - bitbucket.org and self-hosted
- ✅ **Gitea** - Any Gitea instance

### URL Formats

```bash
# All these formats work:
ghux dl https://github.com/user/repo/blob/main/file.md
ghux dl https://raw.githubusercontent.com/user/repo/main/file.md
ghux dl github.com/user/repo/blob/main/file.md
ghux dl user/repo/file.md                    # assumes GitHub & main branch
ghux dl user/repo:develop/file.md            # with branch notation
```

---

## 🎛️ Download Options

### Common Options

- `-o, --output <name>` - Custom output filename
- `-O` - Keep original filename
- `-d, --dir <path>` - Output directory
- `--preserve-path` - Preserve repository path structure
- `-b, --branch <name>` - Specify branch
- `-t, --tag <name>` - Specify tag
- `-c, --commit <hash>` - Specify commit
- `--info` - Show file info before download
- `--progress` - Show progress bar
- `--overwrite` - Overwrite existing files

### Pattern Options

- `--pattern <glob>` - Download files matching pattern
- `--exclude <glob>` - Exclude files matching pattern

### Directory Options

- `--depth <n>` - Maximum directory depth (default: 10)

### Release Options

- `--asset <name>` - Filter release assets by name
- `--version <tag>` - Specific release version

---

## 📋 New Commands

```bash
# Download commands
ghux dl <url> [options]              # Download file(s)
ghux get <url>                       # Alias for dl
ghux fetch-file <url>                # Alias for dl
ghux dl-dir <url> [options]          # Download directory
ghux dl-release <repo> [options]     # Download release assets
```

---

## 💡 Use Cases

### 1. Download Configuration Files

```bash
ghux dl user/repo/package.json -o my-package.json
```

### 2. Fetch Documentation

```bash
ghux dl-dir github.com/user/repo/docs
ghux dl github.com/user/repo --pattern "docs/**/*.md"
```

### 3. Download Build Artifacts

```bash
ghux dl-release github.com/user/tool
ghux dl-release github.com/user/tool --asset linux-x64
```

### 4. Get Example Files

```bash
ghux dl-dir github.com/user/library/examples
```

### 5. Batch Download

```bash
# Create URL list
cat > urls.txt << EOF
github.com/user/repo/README.md
github.com/user/repo/LICENSE
github.com/user/repo/CONTRIBUTING.md
EOF

# Download all
ghux dl -f urls.txt
```

---

## 🛠️ Technical Details

### New Modules

- `src/urlParser.ts` - URL parsing for multiple Git platforms
- `src/download.ts` - Download flows and logic
- `src/utils/downloader.ts` - Download utilities with progress tracking

### Features

- **Automatic Retry** - 3 attempts with exponential backoff
- **Progress Bars** - Visual feedback during downloads
- **Concurrent Downloads** - Parallel downloads for multiple files
- **File Safety** - Overwrite protection by default
- **API Integration** - Uses platform APIs for directory listings
- **Smart Detection** - Auto-detects platform and URL format

---

## 📚 Documentation

Complete documentation available in:

- **[DOWNLOAD_FEATURE.md](DOWNLOAD_FEATURE.md)** - Comprehensive download guide
- **[CHANGELOG.md](CHANGELOG.md)** - Full changelog
- **[README.md](README.md)** - Updated with download features

---

## 🚀 Quick Start

### Installation

```bash
# NPM
npm install -g ghux@1.0.5

# Bun
bun install -g ghux@1.0.5

# One-line install script
curl -fsSL https://raw.githubusercontent.com/dwirx/ghux/main/install-curl.sh | bash
```

### First Download

```bash
# Try it out!
ghux dl https://github.com/dwirx/ghux/blob/main/README.md

# Or download this release notes file
ghux dl github.com/dwirx/ghux/RELEASE_NOTES_v1.0.5.md -o release-notes.md
```

---

## 🔄 Upgrade Notes

If you're upgrading from v1.0.1 or earlier:

1. **Backward Compatible** - All existing features work as before
2. **New Commands** - Download commands are additive, not breaking
3. **No Config Changes** - Your existing account configurations remain unchanged
4. **Same Installation** - Use your existing installation method to upgrade

```bash
# NPM users
npm update -g ghux

# Bun users
bun update -g ghux

# Package manager users
brew upgrade ghux        # Homebrew
yay -Syu ghux-bin       # AUR
scoop update ghux       # Scoop
```

---

## ⚠️ Known Limitations

1. **GitHub API Rate Limits** - Unauthenticated requests limited to 60/hour
2. **Release Assets** - Only GitHub releases supported (not GitLab/Bitbucket)
3. **Private Repositories** - Authentication for private repos not yet supported in download commands
4. **Binary Files** - No streaming for very large files (loads into memory)

---

## 🐛 Bug Fixes

- Fixed TypeScript strict mode compliance
- Added proper null checks for CLI arguments
- Improved error handling for network failures
- Better URL validation and parsing

---

## 👏 Credits

Thanks to all contributors and users who requested this feature!

Special thanks to the open source community for inspiration:
- [Charm.sh](https://charm.sh) for terminal UI inspiration
- [Bun](https://bun.sh) for amazing runtime
- All the testers and early adopters

---

## 🔗 Links

- **GitHub Repository**: https://github.com/dwirx/ghux
- **NPM Package**: https://www.npmjs.com/package/ghux
- **Documentation**: https://github.com/dwirx/ghux#readme
- **Issues**: https://github.com/dwirx/ghux/issues
- **Releases**: https://github.com/dwirx/ghux/releases

---

## 📝 Feedback

We'd love to hear your feedback on the new download features!

- 🐛 **Bug Reports**: [Open an issue](https://github.com/dwirx/ghux/issues/new)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/dwirx/ghux/discussions)
- ⭐ **Like it?**: [Star the repo](https://github.com/dwirx/ghux)

---

**Happy Downloading! 🚀**

*GhUx Team*