# 🚀 GhE Universal Download - Complete Guide

> **One Command for Everything!** Download ANY file from ANY URL with smart auto-detection.

---

## 🎯 Overview

GhE v1.0.5 introduces a **revolutionary unified download system** with just ONE command:

```bash
ghe dl <any-url>
```

**No thinking required** - just paste any URL and GhE automatically:
- ✅ Detects if it's a Git repository (GitHub, GitLab, Bitbucket)
- ✅ Detects if it's a regular file (PDF, ISO, installer, etc.)
- ✅ Uses the right download method automatically
- ✅ Applies appropriate options based on URL type

---

## 🌟 Key Features

### 1. Smart Auto-Detection ✨

GhE automatically detects the URL type:

```bash
# Git repository - uses Git-specific features
ghe dl https://github.com/user/repo/blob/main/README.md

# Regular URL - uses universal downloader
ghe dl https://example.com/document.pdf

# Linux ISO - universal downloader
ghe dl https://releases.ubuntu.com/22.04/ubuntu.iso

# Installation script - universal downloader
ghe dl https://omarchy.org/install
```

**You never need to think about which command to use!**

### 2. Universal Options

These work with **ALL** URL types:

```bash
-o, --output <name>       # Custom filename
-d, --dir <path>          # Output directory
-f, --file-list <path>    # Batch download from file list
--info                    # Show file info before download
--progress                # Show progress bar (default: on)
--overwrite               # Overwrite existing files
-A, --user-agent <ua>     # Custom user agent
-H, --header <header>     # Add HTTP header
--no-redirect             # Don't follow redirects
```

### 3. Git-Specific Options

These apply **only** when Git repository is detected:

```bash
-b, --branch <name>       # Download from specific branch
-t, --tag <name>          # Download from specific tag
-c, --commit <hash>       # Download from specific commit
--pattern <glob>          # Download files matching pattern
--exclude <glob>          # Exclude files matching pattern
--preserve-path           # Preserve repository path structure
```

If you use Git-specific options with non-Git URLs, they're silently ignored.

---

## 📥 Usage Examples

### Download Anything from Any URL

```bash
# PDFs
ghe dl https://example.com/document.pdf
ghe dl https://hostnezt.com/cssfiles/general/the-psychology-of-money.pdf

# ISO Files
ghe dl https://releases.ubuntu.com/22.04/ubuntu-22.04.3-desktop-amd64.iso
ghe dl https://iso.omarchy.org/omarchy-3.1.5.iso

# Installers & Scripts
ghe dl https://omarchy.org/install -o install.sh
ghe dl https://get.docker.com/ -o docker-install.sh
ghe dl https://example.com/setup.exe

# Media Files
ghe dl https://example.com/image.jpg
ghe dl https://example.com/video.mp4
ghe dl https://example.com/audio.mp3

# Archives
ghe dl https://example.com/package.zip
ghe dl https://example.com/backup.tar.gz
```

### Download from Git Repositories

```bash
# GitHub
ghe dl https://github.com/user/repo/blob/main/README.md
ghe dl github.com/user/repo/config.json -o my-config.json
ghe dl user/repo/file.md  # Short syntax

# GitLab
ghe dl https://gitlab.com/user/repo/-/blob/main/file.md

# Bitbucket
ghe dl https://bitbucket.org/user/repo/src/main/file.js

# From different branch
ghe dl github.com/user/repo/file.txt --branch develop

# From specific tag
ghe dl github.com/user/repo/CHANGELOG.md --tag v1.0.0

# From commit hash
ghe dl github.com/user/repo/file.js --commit abc123
```

### Download with Custom Options

```bash
# Custom filename
ghe dl https://example.com/file.pdf -o my-document.pdf

# Custom directory
ghe dl https://example.com/ubuntu.iso -d ~/ISOs/

# Both custom name and directory
ghe dl https://example.com/installer.exe -o setup.exe -d ~/Downloads/

# Show file info first
ghe dl https://releases.ubuntu.com/22.04/ubuntu.iso --info

# Force overwrite
ghe dl https://example.com/file.pdf --overwrite
```

### Download with Authentication

```bash
# Bearer token
ghe dl https://api.example.com/file.pdf -H "Authorization: Bearer YOUR_TOKEN"

# API key
ghe dl https://api.example.com/data.json -H "X-API-Key: your_key_here"

# Multiple headers
ghe dl https://example.com/file.zip \
  -H "Authorization: Bearer token" \
  -H "X-Custom-Header: value"

# Custom user agent
ghe dl https://example.com/file.pdf -A "MyApp/1.0"
```

### Batch Downloads

```bash
# Multiple URLs
ghe dl url1 url2 url3

# From file list
cat > downloads.txt << EOF
https://example.com/file1.pdf
https://example.com/file2.pdf
https://github.com/user/repo/blob/main/README.md
https://releases.ubuntu.com/22.04/ubuntu.iso
EOF

ghe dl -f downloads.txt -d ~/Downloads/
```

### Git Repository Advanced Features

```bash
# Download all markdown files
ghe dl github.com/user/repo --pattern "*.md"

# Download TypeScript source files
ghe dl github.com/user/repo --pattern "src/**/*.ts"

# Exclude test files
ghe dl github.com/user/repo --pattern "*.js" --exclude "test/*"

# Download entire directory
ghe dl-dir https://github.com/user/repo/tree/main/src

# Download directory with depth limit
ghe dl-dir github.com/user/repo/docs --depth 2

# Download latest release
ghe dl-release github.com/user/repo

# Download specific release version
ghe dl-release github.com/user/repo --version v2.0.0

# Download specific release asset
ghe dl-release github.com/user/repo --asset linux
```

---

## 🔄 Command Aliases

All these commands work identically:

```bash
ghe dl <url>           # Main universal command
ghe get <url>          # Alias 1
ghe fetch-file <url>   # Alias 2
ghe dlx <url>          # Explicit universal download
```

**Recommendation**: Use `ghe dl` - it's the shortest and most intuitive!

---

## 🎯 How Auto-Detection Works

### Git Repository Detection

GhE checks if URL contains:
- `github.com`
- `gitlab.com` or `gitlab.`
- `bitbucket.org` or `bitbucket.`
- `/blob/`, `/tree/`, `/-/blob/`, `/-/tree/`, `/src/`

If detected → Uses Git repository download with smart URL parsing

### Regular URL Detection

If not a Git repository URL → Uses universal downloader

### Fallback System

If Git URL parsing fails → Automatically falls back to universal downloader

**You never get stuck with an error!**

---

## 📊 Comparison Table

| Feature | ghe dl | curl | wget |
|---------|---------|------|------|
| Auto-detection | ✅ | ❌ | ❌ |
| Git repos | ✅ | ❌ | ❌ |
| Regular URLs | ✅ | ✅ | ✅ |
| Progress bar | ✅ | ⚠️ | ✅ |
| Interactive prompts | ✅ | ❌ | ❌ |
| File info preview | ✅ | ❌ | ❌ |
| Overwrite protection | ✅ | ❌ | ⚠️ |
| Pattern matching | ✅ | ❌ | ⚠️ |
| Branch/tag download | ✅ | ❌ | ❌ |
| Release downloads | ✅ | ❌ | ❌ |
| Beautiful output | ✅ | ❌ | ❌ |
| Custom headers | ✅ | ✅ | ✅ |
| Batch download | ✅ | ⚠️ | ✅ |

---

## 💡 Pro Tips

### 1. Preview Before Download

```bash
# Show file info first
ghe dl https://releases.ubuntu.com/22.04/ubuntu.iso --info

# Output shows:
# - Filename
# - File size
# - Content type
# - Last modified date
# - Asks for confirmation
```

### 2. Organized Downloads

```bash
# Create folder structure
mkdir -p ~/Downloads/{pdfs,isos,installers,git-files}

# Download to organized folders
ghe dl https://example.com/doc.pdf -d ~/Downloads/pdfs/
ghe dl https://ubuntu.com/ubuntu.iso -d ~/Downloads/isos/
ghe dl https://example.com/setup.exe -d ~/Downloads/installers/
ghe dl github.com/user/repo/file.md -d ~/Downloads/git-files/
```

### 3. Batch Download Different Types

```bash
# Mix Git repos and regular URLs in one file list!
cat > mixed-downloads.txt << EOF
https://github.com/user/repo/blob/main/README.md
https://example.com/document.pdf
https://releases.ubuntu.com/22.04/ubuntu.iso
https://gitlab.com/user/project/-/blob/master/config.yml
https://example.com/installer.sh
EOF

ghe dl -f mixed-downloads.txt -d ~/Downloads/
```

### 4. Download Scripts and Execute

```bash
# Download script
ghe dl https://omarchy.org/install -o install.sh

# Make executable
chmod +x install.sh

# Run it
./install.sh
```

### 5. Download with Retry

GhE automatically retries failed downloads (3 attempts with exponential backoff).

No need to manually retry!

---

## 🔒 Security Best Practices

### 1. Always Use HTTPS

```bash
# ✅ Good - HTTPS
ghe dl https://example.com/file.pdf

# ⚠️ Warning - HTTP (insecure)
ghe dl http://example.com/file.pdf
```

### 2. Preview Large Files

```bash
# Check file info before downloading large files
ghe dl https://releases.ubuntu.com/22.04/ubuntu.iso --info
```

### 3. Verify Sources

- Only download from trusted sources
- Check URLs carefully before downloading
- Verify checksums when available

### 4. Scan Executables

```bash
# After downloading executable
ghe dl https://example.com/installer.exe

# Scan before running
# (use your antivirus or security tools)
```

---

## 🐛 Troubleshooting

### File Already Exists

```bash
# Default: Prompts for confirmation
ghe dl <url>
# ? File already exists: file.pdf. Overwrite? (y/N)

# Force overwrite without prompt
ghe dl <url> --overwrite

# Use different filename
ghe dl <url> -o different-name.pdf
```

### Download Fails

```bash
# 1. Check file info
ghe dl <url> --info

# 2. Try with custom user agent
ghe dl <url> -A "Mozilla/5.0"

# 3. Add authentication if needed
ghe dl <url> -H "Authorization: Bearer TOKEN"

# 4. Check if redirect is the issue
ghe dl <url> --no-redirect
```

### Git URL Not Recognized

GhE will automatically fall back to universal download if Git URL parsing fails.

**You'll still get your file!**

### Slow Download

- Check progress bar for download speed
- Large files naturally take longer
- Try different mirror if available
- Check your internet connection

---

## 🎉 Real-World Scenarios

### Scenario 1: Download Linux Distribution

```bash
# Pick your favorite distro
ghe dl https://releases.ubuntu.com/22.04/ubuntu-22.04.3-desktop-amd64.iso -d ~/ISOs/
ghe dl https://mirror.rackspace.com/archlinux/iso/latest/archlinux-x86_64.iso -d ~/ISOs/
ghe dl https://download.fedoraproject.org/pub/fedora/linux/releases/39/Workstation/x86_64/iso/Fedora-Workstation-39.iso -d ~/ISOs/
```

### Scenario 2: Setup New Project

```bash
# Download config files from existing repo
ghe dl github.com/best-practices/repo/.eslintrc.json -o .eslintrc.json
ghe dl github.com/best-practices/repo/.prettierrc.json -o .prettierrc.json
ghe dl github.com/best-practices/repo/tsconfig.json -o tsconfig.json
```

### Scenario 3: Download Documentation

```bash
# Download all markdown docs from a repo
ghe dl github.com/project/repo --pattern "docs/**/*.md" -d ./docs/

# Or download entire docs directory
ghe dl-dir github.com/project/repo/docs -d ./docs/
```

### Scenario 4: Download Research Papers

```bash
# Download PDFs for research
ghe dl https://example.edu/paper1.pdf -o research/paper1.pdf
ghe dl https://example.edu/paper2.pdf -o research/paper2.pdf
ghe dl https://example.edu/paper3.pdf -o research/paper3.pdf
```

### Scenario 5: Download Software Releases

```bash
# Download latest release
ghe dl-release github.com/user/awesome-tool

# Download specific platform binary
ghe dl-release github.com/user/awesome-tool --asset linux-x64
```

---

## 📚 Complete Options Reference

### Universal Options (ALL URLs)

```bash
-o, --output <name>       # Custom output filename
-d, --dir <path>          # Output directory
-f, --file-list <path>    # Download URLs from file list
--info                    # Show file info before download
--progress                # Show progress bar (default: on)
--overwrite               # Overwrite existing files without prompt
-A, --user-agent <ua>     # Custom user agent string
-H, --header <header>     # Add custom HTTP header (can use multiple)
--no-redirect             # Don't follow HTTP redirects
```

### Git-Specific Options

```bash
-b, --branch <name>       # Download from specific branch
-t, --tag <name>          # Download from specific tag
-c, --commit <hash>       # Download from specific commit hash
--pattern <glob>          # Download files matching glob pattern
--exclude <glob>          # Exclude files matching glob pattern
-O                        # Keep original filename (Git repos)
--preserve-path           # Preserve repository path structure
```

### Directory Download Options

```bash
ghe dl-dir <url>         # Download entire directory
  --depth <n>             # Maximum directory depth (default: 10)
  --pattern <glob>        # Only download files matching pattern
  --exclude <glob>        # Exclude files matching pattern
```

### Release Download Options

```bash
ghe dl-release <repo>    # Download from latest release
  --asset <name>          # Filter assets by name
  --version <tag>         # Specific release version
  -v <tag>                # Short version flag
```

---

## 🆚 dl vs dlx

Both commands work identically! Use whichever you prefer:

```bash
# These are 100% equivalent:
ghe dl <url>
ghe dlx <url>
```

**Recommendation**: Use `ghe dl` - shorter and more intuitive.

`ghe dlx` exists as an explicit "universal download" command for users who want clarity.

---

## 🚀 Quick Reference Card

```bash
# UNIVERSAL DOWNLOAD (ONE COMMAND FOR ALL)
ghe dl <url>                     # Auto-detects Git repo or regular URL
ghe dl <url> -o name             # Custom filename
ghe dl <url> -d dir              # Custom directory
ghe dl <url> --info              # Preview before download
ghe dl -f list.txt               # Batch download

# WITH AUTHENTICATION
ghe dl <url> -H "Authorization: Bearer TOKEN"
ghe dl <url> -A "Custom User Agent"

# GIT REPOSITORY FEATURES
ghe dl github.com/user/repo/file.md              # From main
ghe dl github.com/user/repo/file.md -b develop   # From branch
ghe dl github.com/user/repo --pattern "*.md"     # Pattern match
ghe dl-dir github.com/user/repo/src              # Directory
ghe dl-release github.com/user/repo              # Release

# REGULAR URL DOWNLOADS
ghe dl https://example.com/file.pdf              # PDF
ghe dl https://releases.ubuntu.com/ubuntu.iso    # ISO
ghe dl https://omarchy.org/install               # Script
ghe dl https://example.com/installer.exe         # Installer

# BATCH MIXED DOWNLOADS
echo "https://github.com/user/repo/file.md" > urls.txt
echo "https://example.com/document.pdf" >> urls.txt
echo "https://releases.ubuntu.com/ubuntu.iso" >> urls.txt
ghe dl -f urls.txt -d ~/Downloads/
```

---

## 📖 Documentation Links

- **[README.md](README.md)** - Main project documentation
- **[DOWNLOAD_QUICK_START.md](DOWNLOAD_QUICK_START.md)** - Quick start guide
- **[DLX_UNIVERSAL_DOWNLOAD.md](DLX_UNIVERSAL_DOWNLOAD.md)** - Detailed universal download guide
- **[DOWNLOAD_FEATURE.md](DOWNLOAD_FEATURE.md)** - Advanced Git repository features
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes
- `ghe --help` - Built-in help command

---

## 💬 Feedback & Support

- **Bug Reports**: [GitHub Issues](https://github.com/dwirx/ghe/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/dwirx/ghe/discussions)
- **Documentation**: [GitHub Wiki](https://github.com/dwirx/ghe/wiki)
- **Star the Project**: [GitHub Repository](https://github.com/dwirx/ghe)

---

## 🎉 Summary

**GhE v1.0.5** introduces the most powerful and intuitive download system:

✅ **One Command** - `ghe dl` for everything  
✅ **Smart Detection** - Automatically handles Git repos and regular URLs  
✅ **No Thinking** - Just paste any URL and it works  
✅ **Full Featured** - Progress bars, authentication, patterns, releases  
✅ **Safe Downloads** - Overwrite protection, file info preview  
✅ **Beautiful UX** - Interactive prompts, colorful output  

**Replace curl and wget with something better!**

```bash
# Instead of this:
curl -L -o file.pdf https://example.com/file.pdf
wget https://example.com/file.pdf

# Just do this:
ghe dl https://example.com/file.pdf
```

---

**Happy Downloading! 🚀**

*GhE Team*