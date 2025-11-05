# 🚀 Download Quick Start Guide - GhUx v1.0.5

> Quick reference for downloading files with GhUx

---

## 📥 Two Download Commands

### `ghux dlx` - Download ANYTHING from ANY URL
Like curl/wget, works with any HTTP/HTTPS URL

### `ghux dl` - Download from Git repositories
Smart downloader for GitHub, GitLab, Bitbucket

---

## 🚀 Universal Download (dlx)

### Quick Examples

```bash
# Download a PDF
ghux dlx https://example.com/document.pdf

# Download Linux ISO
ghux dlx https://releases.ubuntu.com/22.04/ubuntu.iso

# Download installer
ghux dlx https://omarchy.org/install

# Download with custom name
ghux dlx https://example.com/file.pdf -o my-file.pdf

# Download to directory
ghux dlx https://example.com/ubuntu.iso -d ~/Downloads/

# Download multiple files
ghux dlx url1 url2 url3

# Download from file list
ghux dlx -f urls.txt
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
ghux dlx https://hostnezt.com/cssfiles/general/the-psychology-of-money.pdf

# Download custom ISO
ghux dlx https://iso.omarchy.org/omarchy-3.1.5.iso -d ~/ISOs/

# Download with authentication
ghux dlx https://api.example.com/file.pdf -H "Authorization: Bearer TOKEN"

# Preview before download
ghux dlx https://releases.ubuntu.com/22.04/ubuntu.iso --info
```

---

## 📥 Git Repository Download (dl)

### Quick Examples

```bash
# Download single file
ghux dl https://github.com/user/repo/blob/main/README.md

# Download with custom name
ghux dl <url> -o custom.md

# Download from different branch
ghux dl github.com/user/repo/file.txt --branch develop

# Download all markdown files
ghux dl github.com/user/repo --pattern "*.md"

# Download directory
ghux dl-dir https://github.com/user/repo/tree/main/src

# Download release
ghux dl-release github.com/user/repo
```

### Short URL Syntax

```bash
# These are equivalent:
ghux dl https://github.com/user/repo/blob/main/file.md
ghux dl github.com/user/repo/blob/main/file.md
ghux dl user/repo/file.md

# With branch:
ghux dl user/repo:develop/file.md
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

### Use `ghux dlx` for:
- ✅ PDFs and documents from any website
- ✅ Linux ISOs and disk images
- ✅ Software installers and executables
- ✅ Media files (images, videos, audio)
- ✅ Archives (zip, tar.gz, 7z)
- ✅ Scripts from any URL
- ✅ Any file from any HTTP/HTTPS URL

### Use `ghux dl` for:
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
ghux dlx https://example.com/large-file.iso --info
ghux dl https://github.com/user/repo/file.md --info
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
ghux dlx -f urls.txt
```

### 3. Organized Downloads
```bash
# Create structure
mkdir -p ~/Downloads/{pdfs,isos,installers}

# Download to specific folders
ghux dlx https://example.com/doc.pdf -d ~/Downloads/pdfs/
ghux dlx https://example.com/ubuntu.iso -d ~/Downloads/isos/
```

### 4. Custom Names
```bash
# Universal download
ghux dlx https://example.com/download?id=123 -o myfile.pdf

# Git repository
ghux dl user/repo/config.json -o my-config.json
```

---

## 🆘 Common Issues

### File Already Exists
```bash
# You'll be prompted by default
ghux dlx <url>
# ? File already exists. Overwrite? (y/N)

# Force overwrite
ghux dlx <url> --overwrite
```

### Download Fails
```bash
# Try with --info to debug
ghux dlx <url> --info

# Try custom user agent
ghux dlx <url> -A "Mozilla/5.0"

# Add authentication if needed
ghux dlx <url> -H "Authorization: Bearer TOKEN"
```

### Invalid URL (for git repos)
```bash
# ✗ Wrong
ghux dl github.com/user/repo

# ✓ Correct
ghux dl github.com/user/repo/file.md
ghux dl github.com/user/repo/blob/main/file.md
```

---

## 📊 Comparison Table

| Feature | `ghux dlx` | `ghux dl` | `curl` | `wget` |
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
- `ghux --help` - Built-in help

---

## 🎉 Examples Collection

### Download Linux ISOs
```bash
# Ubuntu
ghux dlx https://releases.ubuntu.com/22.04/ubuntu-22.04.3-desktop-amd64.iso

# Arch Linux
ghux dlx https://mirror.rackspace.com/archlinux/iso/latest/archlinux-x86_64.iso

# Download to specific folder
ghux dlx <iso-url> -d ~/ISOs/
```

### Download PDFs
```bash
# Download document
ghux dlx https://example.com/whitepaper.pdf

# Download book
ghux dlx https://example.com/book.pdf -o my-book.pdf

# Download multiple
ghux dlx doc1.pdf doc2.pdf doc3.pdf -d ~/Documents/
```

### Download from GitHub
```bash
# Download README
ghux dl user/repo/README.md

# Download config
ghux dl user/repo/config.json -o my-config.json

# Download all docs
ghux dl user/repo --pattern "docs/**/*.md"

# Download entire src directory
ghux dl-dir user/repo/src

# Download latest release
ghux dl-release user/repo
```

### Download Scripts
```bash
# Download and save
ghux dlx https://install.example.com/setup.sh -o install.sh

# Make executable
chmod +x install.sh

# Run it
./install.sh
```

### Download with Authentication
```bash
# API token
ghux dlx https://api.example.com/file.pdf \
  -H "Authorization: Bearer YOUR_TOKEN"

# API key
ghux dlx https://api.example.com/data.json \
  -H "X-API-Key: your_key_here"

# Custom user agent
ghux dlx https://example.com/file.zip \
  -A "MyApp/1.0"
```

---

## ⚡ Quick Reference Card

```bash
# UNIVERSAL DOWNLOAD (ANY URL)
ghux dlx <url>                    # Download file
ghux dlx <url> -o name            # Custom name
ghux dlx <url> -d dir             # Custom dir
ghux dlx -f list.txt              # Batch download

# GIT REPOSITORY DOWNLOAD
ghux dl <repo-url>                # Download file
ghux dl <url> -b branch           # From branch
ghux dl <url> --pattern "*.md"    # Pattern match
ghux dl-dir <url>                 # Directory
ghux dl-release <repo>            # Release

# OPTIONS
--info          # Preview file info
--overwrite     # Force overwrite
--progress      # Show progress (default)
-A <ua>         # Custom user agent (dlx)
-H <header>     # Custom header (dlx)
```

---

**Happy Downloading! 🚀**

Need help? Run `ghux --help` or check the full documentation.