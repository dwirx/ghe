# 🚀 Download Quick Start Guide - GhE v1.0.5

> Quick reference for downloading files with GhE

---

## 📥 Two Download Commands

### `ghe dlx` - Download ANYTHING from ANY URL
Like curl/wget, works with any HTTP/HTTPS URL

### `ghe dl` - Download from Git repositories
Smart downloader for GitHub, GitLab, Bitbucket

---

## 🚀 Universal Download (dlx)

### Quick Examples

```bash
# Download a PDF
ghe dlx https://example.com/document.pdf

# Download Linux ISO
ghe dlx https://releases.ubuntu.com/22.04/ubuntu.iso

# Download installer
ghe dlx https://omarchy.org/install

# Download with custom name
ghe dlx https://example.com/file.pdf -o my-file.pdf

# Download to directory
ghe dlx https://example.com/ubuntu.iso -d ~/Downloads/

# Download multiple files
ghe dlx url1 url2 url3

# Download from file list
ghe dlx -f urls.txt
```

### Common Options

```bash
-o, --output <name>     # Custom filename
-d, --dir <path>        # Output directory
--info                  # Show file info first
--overwrite             # Overwrite existing files
-A, --user-agent <ua>   # Custom user agent
-H, --header <header>   # Add HTTP header
-f, --file-list <file>  # Batch download
```

### Real-World Examples

```bash
# Download PDF book
ghe dlx https://hostnezt.com/cssfiles/general/the-psychology-of-money.pdf

# Download custom ISO
ghe dlx https://iso.omarchy.org/omarchy-3.1.5.iso -d ~/ISOs/

# Download with authentication
ghe dlx https://api.example.com/file.pdf -H "Authorization: Bearer TOKEN"

# Preview before download
ghe dlx https://releases.ubuntu.com/22.04/ubuntu.iso --info
```

---

## 📥 Git Repository Download (dl)

### Quick Examples

```bash
# Download single file
ghe dl https://github.com/user/repo/blob/main/README.md

# Download with custom name
ghe dl <url> -o custom.md

# Download from different branch
ghe dl github.com/user/repo/file.txt --branch develop

# Download all markdown files
ghe dl github.com/user/repo --pattern "*.md"

# Download directory
ghe dl-dir https://github.com/user/repo/tree/main/src

# Download release
ghe dl-release github.com/user/repo
```

### Short URL Syntax

```bash
# These are equivalent:
ghe dl https://github.com/user/repo/blob/main/file.md
ghe dl github.com/user/repo/blob/main/file.md
ghe dl user/repo/file.md

# With branch:
ghe dl user/repo:develop/file.md
```

### Common Options

```bash
-o, --output <name>       # Custom filename
-d, --dir <path>          # Output directory
-b, --branch <name>       # Specific branch
-t, --tag <name>          # Specific tag
-c, --commit <hash>       # Specific commit
--pattern <glob>          # Download matching files
--exclude <glob>          # Exclude files
--info                    # Show file info first
```

---

## 🎯 When to Use What?

### Use `ghe dlx` for:
- ✅ PDFs and documents from any website
- ✅ Linux ISOs and disk images
- ✅ Software installers and executables
- ✅ Media files (images, videos, audio)
- ✅ Archives (zip, tar.gz, 7z)
- ✅ Scripts from any URL
- ✅ Any file from any HTTP/HTTPS URL

### Use `ghe dl` for:
- ✅ Files from GitHub repositories
- ✅ Files from GitLab repositories
- ✅ Files from Bitbucket repositories
- ✅ Downloading from specific branches/tags
- ✅ Pattern-based downloads (*.md, src/**/*.ts)
- ✅ GitHub release assets

---

## 💡 Pro Tips

### 1. Preview Before Download
```bash
# Show file info first
ghe dlx https://example.com/large-file.iso --info
ghe dl https://github.com/user/repo/file.md --info
```

### 2. Batch Downloads
```bash
# Create URL list
cat > urls.txt << EOF
https://example.com/file1.pdf
https://example.com/file2.pdf
https://example.com/file3.pdf
EOF

# Download all
ghe dlx -f urls.txt
```

### 3. Organized Downloads
```bash
# Create structure
mkdir -p ~/Downloads/{pdfs,isos,installers}

# Download to specific folders
ghe dlx https://example.com/doc.pdf -d ~/Downloads/pdfs/
ghe dlx https://example.com/ubuntu.iso -d ~/Downloads/isos/
```

### 4. Custom Names
```bash
# Universal download
ghe dlx https://example.com/download?id=123 -o myfile.pdf

# Git repository
ghe dl user/repo/config.json -o my-config.json
```

---

## 🆘 Common Issues

### File Already Exists
```bash
# You'll be prompted by default
ghe dlx <url>
# ? File already exists. Overwrite? (y/N)

# Force overwrite
ghe dlx <url> --overwrite
```

### Download Fails
```bash
# Try with --info to debug
ghe dlx <url> --info

# Try custom user agent
ghe dlx <url> -A "Mozilla/5.0"

# Add authentication if needed
ghe dlx <url> -H "Authorization: Bearer TOKEN"
```

### Invalid URL (for git repos)
```bash
# ✗ Wrong
ghe dl github.com/user/repo

# ✓ Correct
ghe dl github.com/user/repo/file.md
ghe dl github.com/user/repo/blob/main/file.md
```

---

## 📊 Comparison Table

| Feature | `ghe dlx` | `ghe dl` | `curl` | `wget` |
|---------|-----------|-----------|---------|--------|
| Any URL | ✅ | ❌ | ✅ | ✅ |
| Git repos | ❌ | ✅ | ❌ | ❌ |
| Progress | ✅ | ✅ | ⚠️ | ✅ |
| Interactive | ✅ | ✅ | ❌ | ❌ |
| Pattern matching | ❌ | ✅ | ❌ | ⚠️ |
| Release downloads | ❌ | ✅ | ❌ | ❌ |

---

## 📚 Full Documentation

- **[DLX_UNIVERSAL_DOWNLOAD.md](DLX_UNIVERSAL_DOWNLOAD.md)** - Complete dlx guide
- **[DOWNLOAD_FEATURE.md](DOWNLOAD_FEATURE.md)** - Complete dl guide
- **[README.md](README.md)** - Main documentation
- `ghe --help` - Built-in help

---

## 🎉 Examples Collection

### Download Linux ISOs
```bash
# Ubuntu
ghe dlx https://releases.ubuntu.com/22.04/ubuntu-22.04.3-desktop-amd64.iso

# Arch Linux
ghe dlx https://mirror.rackspace.com/archlinux/iso/latest/archlinux-x86_64.iso

# Download to specific folder
ghe dlx <iso-url> -d ~/ISOs/
```

### Download PDFs
```bash
# Download document
ghe dlx https://example.com/whitepaper.pdf

# Download book
ghe dlx https://example.com/book.pdf -o my-book.pdf

# Download multiple
ghe dlx doc1.pdf doc2.pdf doc3.pdf -d ~/Documents/
```

### Download from GitHub
```bash
# Download README
ghe dl user/repo/README.md

# Download config
ghe dl user/repo/config.json -o my-config.json

# Download all docs
ghe dl user/repo --pattern "docs/**/*.md"

# Download entire src directory
ghe dl-dir user/repo/src

# Download latest release
ghe dl-release user/repo
```

### Download Scripts
```bash
# Download and save
ghe dlx https://install.example.com/setup.sh -o install.sh

# Make executable
chmod +x install.sh

# Run it
./install.sh
```

### Download with Authentication
```bash
# API token
ghe dlx https://api.example.com/file.pdf \
  -H "Authorization: Bearer YOUR_TOKEN"

# API key
ghe dlx https://api.example.com/data.json \
  -H "X-API-Key: your_key_here"

# Custom user agent
ghe dlx https://example.com/file.zip \
  -A "MyApp/1.0"
```

---

## ⚡ Quick Reference Card

```bash
# UNIVERSAL DOWNLOAD (ANY URL)
ghe dlx <url>                    # Download file
ghe dlx <url> -o name            # Custom name
ghe dlx <url> -d dir             # Custom dir
ghe dlx -f list.txt              # Batch download

# GIT REPOSITORY DOWNLOAD
ghe dl <repo-url>                # Download file
ghe dl <url> -b branch           # From branch
ghe dl <url> --pattern "*.md"    # Pattern match
ghe dl-dir <url>                 # Directory
ghe dl-release <repo>            # Release

# OPTIONS
--info          # Preview file info
--overwrite     # Force overwrite
--progress      # Show progress (default)
-A <ua>         # Custom user agent (dlx)
-H <header>     # Custom header (dlx)
```

---

**Happy Downloading! 🚀**

Need help? Run `ghe --help` or check the full documentation.