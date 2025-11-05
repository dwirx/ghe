# 🚀 GhE Universal Download (dlx) - Download Anything

> Like `curl` and `wget`, but better! Download any file from any URL with progress tracking and advanced features.

---

## 🎯 What is `dlx`?

`ghe dlx` is a universal downloader that can download **ANY** file from **ANY** HTTP/HTTPS URL. Unlike the `ghe dl` command which is specifically for Git repositories, `dlx` works with:

- 📄 **PDFs** - Documents, books, papers
- 💿 **ISO Files** - Linux distributions, software images
- 📦 **Installers** - `.exe`, `.msi`, `.dmg`, `.deb`, `.rpm`
- 🎬 **Media Files** - Videos, audio, images
- 🗜️ **Archives** - `.zip`, `.tar.gz`, `.7z`, `.rar`
- 📜 **Scripts** - Shell scripts, Python scripts, etc.
- 🌐 **Web Resources** - Any downloadable file from any website

---

## 🚀 Quick Start

```bash
# Download a PDF
ghe dlx https://example.com/document.pdf

# Download an ISO file
ghe dlx https://releases.ubuntu.com/22.04/ubuntu-22.04.3-desktop-amd64.iso

# Download an installer
ghe dlx https://example.com/installer.exe

# Download a script
ghe dlx https://omarchy.org/install

# Download with custom name
ghe dlx https://example.com/file.pdf -o my-document.pdf

# Download to specific directory
ghe dlx https://example.com/ubuntu.iso -d ~/Downloads/
```

---

## 📋 Basic Usage

### Download Single File

```bash
# Basic download
ghe dlx <url>

# Examples:
ghe dlx https://hostnezt.com/cssfiles/general/the-psychology-of-money.pdf
ghe dlx https://iso.omarchy.org/omarchy-3.1.5.iso
ghe dlx https://get.docker.com/
```

### Download with Custom Name

```bash
ghe dlx <url> -o <filename>

# Examples:
ghe dlx https://example.com/ubuntu.iso -o ubuntu-22.04.iso
ghe dlx https://example.com/installer.sh -o install-script.sh
ghe dlx https://example.com/document.pdf -o psychology-of-money.pdf
```

### Download to Directory

```bash
ghe dlx <url> -d <directory>

# Examples:
ghe dlx https://example.com/file.pdf -d ~/Downloads/
ghe dlx https://example.com/image.png -d ./images/
ghe dlx https://releases.ubuntu.com/ubuntu.iso -d /mnt/isos/
```

---

## 🎛️ Command Options

### Basic Options

| Option | Short | Description | Example |
|--------|-------|-------------|---------|
| `--output` | `-o` | Custom output filename | `-o myfile.pdf` |
| `--dir` | `-d` | Output directory | `-d ~/Downloads/` |
| `--info` | | Show file info before download | `--info` |
| `--progress` | | Show progress bar (default: on) | `--progress` |
| `--overwrite` | | Overwrite existing files | `--overwrite` |

### Advanced Options

| Option | Short | Description | Example |
|--------|-------|-------------|---------|
| `--user-agent` | `-A` | Custom user agent string | `-A "Mozilla/5.0"` |
| `--header` | `-H` | Add custom HTTP header | `-H "Authorization: Bearer token"` |
| `--no-redirect` | | Don't follow redirects | `--no-redirect` |
| `--file-list` | `-f` | Download URLs from file | `-f urls.txt` |

---

## 📥 Download Multiple Files

### Multiple URLs

```bash
# Download multiple files at once
ghe dlx url1 url2 url3

# Example:
ghe dlx \
  https://example.com/file1.pdf \
  https://example.com/file2.pdf \
  https://example.com/file3.pdf
```

### From File List

Create a text file with URLs (one per line):

```txt
# downloads.txt
https://example.com/file1.pdf
https://example.com/file2.zip
https://releases.ubuntu.com/22.04/ubuntu.iso

# Lines starting with # are ignored (comments)
```

Download all:

```bash
ghe dlx -f downloads.txt
ghe dlx -f downloads.txt -d ~/Downloads/
```

---

## 🎯 Real-World Examples

### 1. Download Linux ISO

```bash
# Ubuntu
ghe dlx https://releases.ubuntu.com/22.04/ubuntu-22.04.3-desktop-amd64.iso

# Arch Linux
ghe dlx https://mirror.rackspace.com/archlinux/iso/latest/archlinux-x86_64.iso -d ~/ISOs/

# Fedora
ghe dlx https://download.fedoraproject.org/pub/fedora/linux/releases/39/Workstation/x86_64/iso/Fedora-Workstation-Live-x86_64-39.iso
```

### 2. Download PDF Documents

```bash
# Download a book
ghe dlx https://hostnezt.com/cssfiles/general/the-psychology-of-money-by-morgan-housel.pdf

# Download with custom name
ghe dlx https://example.com/report.pdf -o annual-report-2024.pdf

# Download to documents folder
ghe dlx https://example.com/whitepaper.pdf -d ~/Documents/
```

### 3. Download Installers

```bash
# Download installer script
ghe dlx https://omarchy.org/install -o omarchy-install.sh

# Download Windows installer
ghe dlx https://example.com/setup.exe -o my-app-setup.exe

# Download macOS DMG
ghe dlx https://example.com/app.dmg -d ~/Downloads/
```

### 4. Download Media Files

```bash
# Download image
ghe dlx https://example.com/photo.jpg -o vacation.jpg

# Download video
ghe dlx https://example.com/tutorial.mp4 -d ~/Videos/

# Download audio
ghe dlx https://example.com/music.mp3 -d ~/Music/
```

### 5. Download Archives

```bash
# Download ZIP file
ghe dlx https://github.com/user/project/archive/refs/heads/main.zip

# Download tarball
ghe dlx https://example.com/package.tar.gz -d ~/Downloads/

# Download 7z archive
ghe dlx https://example.com/backup.7z
```

### 6. Download Scripts

```bash
# Download and save shell script
ghe dlx https://install.example.com/setup.sh -o install.sh

# Download Python script
ghe dlx https://example.com/script.py -o my-script.py

# Download with execution permissions (manual)
ghe dlx https://example.com/installer.sh -o install.sh
chmod +x install.sh
./install.sh
```

---

## 🔧 Advanced Usage

### Custom User Agent

```bash
# Mimic browser
ghe dlx https://example.com/file.pdf -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

# Custom identifier
ghe dlx https://example.com/file.zip -A "MyApp/1.0"
```

### Custom Headers

```bash
# Add authentication header
ghe dlx https://api.example.com/file.pdf -H "Authorization: Bearer YOUR_TOKEN"

# Add API key
ghe dlx https://api.example.com/data.json -H "X-API-Key: your_key_here"

# Multiple headers
ghe dlx https://example.com/file.zip \
  -H "Authorization: Bearer token" \
  -H "X-Custom-Header: value"
```

### Show File Info Before Download

```bash
# Preview file information
ghe dlx https://example.com/large-file.iso --info

# Output:
# ╭─────────────────────────────────────╮
# │       File Information              │
# ├─────────────────────────────────────┤
# │ File: large-file.iso                │
# │ Size: 3.5 GB                        │
# │ Type: application/x-iso9660-image   │
# │ Last Modified: 2024-01-15           │
# │ URL: https://example.com/...        │
# ╰─────────────────────────────────────╯
# ? Proceed with download? (Y/n)
```

### Disable Redirects

```bash
# Don't follow redirects
ghe dlx https://example.com/redirect --no-redirect
```

---

## 🆚 dlx vs dl vs curl vs wget

| Feature | `ghe dlx` | `ghe dl` | `curl` | `wget` |
|---------|-----------|-----------|---------|--------|
| Any URL | ✅ | ❌ | ✅ | ✅ |
| Git repos | ❌ | ✅ | ❌ | ❌ |
| Progress bar | ✅ | ✅ | ⚠️ | ✅ |
| File info preview | ✅ | ✅ | ❌ | ❌ |
| Auto filename | ✅ | ✅ | ❌ | ✅ |
| Interactive prompts | ✅ | ✅ | ❌ | ❌ |
| Overwrite protection | ✅ | ✅ | ❌ | ⚠️ |
| Beautiful output | ✅ | ✅ | ❌ | ❌ |
| Custom headers | ✅ | ❌ | ✅ | ✅ |
| Batch download | ✅ | ✅ | ⚠️ | ✅ |

### When to use what?

- **`ghe dlx`** - General purpose downloads, any file from any URL
- **`ghe dl`** - Files from Git repositories (GitHub, GitLab, etc.)
- **`curl`** - API requests, complex HTTP operations
- **`wget`** - Recursive downloads, mirror websites

---

## 💡 Pro Tips

### 1. Batch Download with Progress

```bash
# Create URL list
cat > downloads.txt << EOF
https://example.com/file1.pdf
https://example.com/file2.pdf
https://example.com/file3.pdf
EOF

# Download all with progress
ghe dlx -f downloads.txt -d ~/Downloads/
```

### 2. Download Large Files

```bash
# Show file info first to check size
ghe dlx https://releases.ubuntu.com/22.04/ubuntu.iso --info

# Then download with progress tracking
ghe dlx https://releases.ubuntu.com/22.04/ubuntu.iso -d ~/ISOs/
```

### 3. Organized Downloads

```bash
# Create organized structure
mkdir -p ~/Downloads/{pdfs,isos,installers}

# Download to specific folders
ghe dlx https://example.com/document.pdf -d ~/Downloads/pdfs/
ghe dlx https://example.com/ubuntu.iso -d ~/Downloads/isos/
ghe dlx https://example.com/installer.exe -d ~/Downloads/installers/
```

### 4. Safe Downloads

```bash
# Always preview before downloading large files
ghe dlx <url> --info

# Prevent accidental overwrites (default behavior)
ghe dlx <url>  # Will prompt if file exists

# Force overwrite if needed
ghe dlx <url> --overwrite
```

### 5. Verify Downloads

```bash
# Download file
ghe dlx https://example.com/file.zip -o download.zip

# Check file size
ls -lh download.zip

# Verify checksum if provided
sha256sum download.zip
```

---

## 🔒 Security Considerations

### HTTPS Only (Recommended)

```bash
# ✅ Good - HTTPS
ghe dlx https://example.com/file.pdf

# ⚠️ Warning - HTTP (insecure)
ghe dlx http://example.com/file.pdf
```

### Verify Sources

- Only download from trusted sources
- Check URLs before downloading
- Verify checksums when available
- Scan downloaded executables

### Safe Practices

```bash
# 1. Preview file info first
ghe dlx <url> --info

# 2. Download to safe location
ghe dlx <url> -d ~/Downloads/

# 3. Verify file type
file downloaded-file

# 4. Scan if executable
# (Use antivirus or scan tools)
```

---

## 🐛 Troubleshooting

### Download Fails

```bash
# Check URL is valid
ghe dlx <url> --info

# Try with custom user agent
ghe dlx <url> -A "Mozilla/5.0"

# Check if URL requires authentication
ghe dlx <url> -H "Authorization: Bearer YOUR_TOKEN"
```

### File Already Exists

```bash
# Prompt appears by default
ghe dlx <url>
# ? File already exists: file.pdf. Overwrite? (y/N)

# Force overwrite
ghe dlx <url> --overwrite

# Use different name
ghe dlx <url> -o different-name.pdf
```

### Slow Download

- Large files will naturally take longer
- Progress bar shows download speed
- Check your internet connection
- Try different mirror/source

### Connection Issues

```bash
# May need to follow redirects (default: enabled)
ghe dlx <url>

# Disable redirects if needed
ghe dlx <url> --no-redirect
```

---

## ⚡ Performance

### Features

- **Streaming Download** - Memory efficient, handles large files
- **Progress Tracking** - Real-time progress with speed indicator
- **Resume Support** - (Coming soon)
- **Parallel Downloads** - Multiple files download concurrently

### Example Output

```
Downloading ubuntu-22.04.3-desktop-amd64.iso - 45.3% (2.1 GB/4.7 GB) @ 15.2 MB/s
```

---

## 📊 Comparison with Other Tools

### Replace curl

```bash
# Old way (curl)
curl -L -o file.pdf https://example.com/file.pdf

# New way (ghe dlx)
ghe dlx https://example.com/file.pdf -o file.pdf

# Even simpler (auto filename)
ghe dlx https://example.com/file.pdf
```

### Replace wget

```bash
# Old way (wget)
wget -O file.pdf https://example.com/file.pdf

# New way (ghe dlx)
ghe dlx https://example.com/file.pdf -o file.pdf

# With progress and better UI
ghe dlx https://example.com/file.pdf
```

---

## 🔗 Related Commands

- `ghe dl` - Download from Git repositories
- `ghe dl-dir` - Download directories from Git
- `ghe dl-release` - Download GitHub releases
- `ghe` - Main interactive menu

---

## 📚 More Information

- [README.md](README.md) - Main documentation
- [DOWNLOAD_FEATURE.md](DOWNLOAD_FEATURE.md) - Git repository downloads
- [CHANGELOG.md](CHANGELOG.md) - Version history
- `ghe --help` - Built-in help

---

## 🎯 Summary

**`ghe dlx`** is your go-to command for downloading any file from any URL:

- ✅ Simple and intuitive
- ✅ Progress tracking with speed
- ✅ Safe with overwrite protection
- ✅ Works with any HTTP/HTTPS URL
- ✅ Beautiful terminal output
- ✅ Batch downloads from file lists
- ✅ Custom headers and user agents

**Try it now:**

```bash
ghe dlx https://example.com/file.pdf
```

---

**Happy Downloading! 🚀**