# 🚀 GhUx Universal Download (dlx) - Download Anything

> Like `curl` and `wget`, but better! Download any file from any URL with progress tracking and advanced features.

---

## 🎯 What is `dlx`?

`ghux dlx` is a universal downloader that can download **ANY** file from **ANY** HTTP/HTTPS URL. Unlike the `ghux dl` command which is specifically for Git repositories, `dlx` works with:

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
ghux dlx https://example.com/document.pdf

# Download an ISO file
ghux dlx https://releases.ubuntu.com/22.04/ubuntu-22.04.3-desktop-amd64.iso

# Download an installer
ghux dlx https://example.com/installer.exe

# Download a script
ghux dlx https://omarchy.org/install

# Download with custom name
ghux dlx https://example.com/file.pdf -o my-document.pdf

# Download to specific directory
ghux dlx https://example.com/ubuntu.iso -d ~/Downloads/
```

---

## 📋 Basic Usage

### Download Single File

```bash
# Basic download
ghux dlx <url>

# Examples:
ghux dlx https://hostnezt.com/cssfiles/general/the-psychology-of-money.pdf
ghux dlx https://iso.omarchy.org/omarchy-3.1.5.iso
ghux dlx https://get.docker.com/
```

### Download with Custom Name

```bash
ghux dlx <url> -o <filename>

# Examples:
ghux dlx https://example.com/ubuntu.iso -o ubuntu-22.04.iso
ghux dlx https://example.com/installer.sh -o install-script.sh
ghux dlx https://example.com/document.pdf -o psychology-of-money.pdf
```

### Download to Directory

```bash
ghux dlx <url> -d <directory>

# Examples:
ghux dlx https://example.com/file.pdf -d ~/Downloads/
ghux dlx https://example.com/image.png -d ./images/
ghux dlx https://releases.ubuntu.com/ubuntu.iso -d /mnt/isos/
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
ghux dlx url1 url2 url3

# Example:
ghux dlx \
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
ghux dlx -f downloads.txt
ghux dlx -f downloads.txt -d ~/Downloads/
```

---

## 🎯 Real-World Examples

### 1. Download Linux ISO

```bash
# Ubuntu
ghux dlx https://releases.ubuntu.com/22.04/ubuntu-22.04.3-desktop-amd64.iso

# Arch Linux
ghux dlx https://mirror.rackspace.com/archlinux/iso/latest/archlinux-x86_64.iso -d ~/ISOs/

# Fedora
ghux dlx https://download.fedoraproject.org/pub/fedora/linux/releases/39/Workstation/x86_64/iso/Fedora-Workstation-Live-x86_64-39.iso
```

### 2. Download PDF Documents

```bash
# Download a book
ghux dlx https://hostnezt.com/cssfiles/general/the-psychology-of-money-by-morgan-housel.pdf

# Download with custom name
ghux dlx https://example.com/report.pdf -o annual-report-2024.pdf

# Download to documents folder
ghux dlx https://example.com/whitepaper.pdf -d ~/Documents/
```

### 3. Download Installers

```bash
# Download installer script
ghux dlx https://omarchy.org/install -o omarchy-install.sh

# Download Windows installer
ghux dlx https://example.com/setup.exe -o my-app-setup.exe

# Download macOS DMG
ghux dlx https://example.com/app.dmg -d ~/Downloads/
```

### 4. Download Media Files

```bash
# Download image
ghux dlx https://example.com/photo.jpg -o vacation.jpg

# Download video
ghux dlx https://example.com/tutorial.mp4 -d ~/Videos/

# Download audio
ghux dlx https://example.com/music.mp3 -d ~/Music/
```

### 5. Download Archives

```bash
# Download ZIP file
ghux dlx https://github.com/user/project/archive/refs/heads/main.zip

# Download tarball
ghux dlx https://example.com/package.tar.gz -d ~/Downloads/

# Download 7z archive
ghux dlx https://example.com/backup.7z
```

### 6. Download Scripts

```bash
# Download and save shell script
ghux dlx https://install.example.com/setup.sh -o install.sh

# Download Python script
ghux dlx https://example.com/script.py -o my-script.py

# Download with execution permissions (manual)
ghux dlx https://example.com/installer.sh -o install.sh
chmod +x install.sh
./install.sh
```

---

## 🔧 Advanced Usage

### Custom User Agent

```bash
# Mimic browser
ghux dlx https://example.com/file.pdf -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

# Custom identifier
ghux dlx https://example.com/file.zip -A "MyApp/1.0"
```

### Custom Headers

```bash
# Add authentication header
ghux dlx https://api.example.com/file.pdf -H "Authorization: Bearer YOUR_TOKEN"

# Add API key
ghux dlx https://api.example.com/data.json -H "X-API-Key: your_key_here"

# Multiple headers
ghux dlx https://example.com/file.zip \
  -H "Authorization: Bearer token" \
  -H "X-Custom-Header: value"
```

### Show File Info Before Download

```bash
# Preview file information
ghux dlx https://example.com/large-file.iso --info

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
ghux dlx https://example.com/redirect --no-redirect
```

---

## 🆚 dlx vs dl vs curl vs wget

| Feature | `ghux dlx` | `ghux dl` | `curl` | `wget` |
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

- **`ghux dlx`** - General purpose downloads, any file from any URL
- **`ghux dl`** - Files from Git repositories (GitHub, GitLab, etc.)
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
ghux dlx -f downloads.txt -d ~/Downloads/
```

### 2. Download Large Files

```bash
# Show file info first to check size
ghux dlx https://releases.ubuntu.com/22.04/ubuntu.iso --info

# Then download with progress tracking
ghux dlx https://releases.ubuntu.com/22.04/ubuntu.iso -d ~/ISOs/
```

### 3. Organized Downloads

```bash
# Create organized structure
mkdir -p ~/Downloads/{pdfs,isos,installers}

# Download to specific folders
ghux dlx https://example.com/document.pdf -d ~/Downloads/pdfs/
ghux dlx https://example.com/ubuntu.iso -d ~/Downloads/isos/
ghux dlx https://example.com/installer.exe -d ~/Downloads/installers/
```

### 4. Safe Downloads

```bash
# Always preview before downloading large files
ghux dlx <url> --info

# Prevent accidental overwrites (default behavior)
ghux dlx <url>  # Will prompt if file exists

# Force overwrite if needed
ghux dlx <url> --overwrite
```

### 5. Verify Downloads

```bash
# Download file
ghux dlx https://example.com/file.zip -o download.zip

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
ghux dlx https://example.com/file.pdf

# ⚠️ Warning - HTTP (insecure)
ghux dlx http://example.com/file.pdf
```

### Verify Sources

- Only download from trusted sources
- Check URLs before downloading
- Verify checksums when available
- Scan downloaded executables

### Safe Practices

```bash
# 1. Preview file info first
ghux dlx <url> --info

# 2. Download to safe location
ghux dlx <url> -d ~/Downloads/

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
ghux dlx <url> --info

# Try with custom user agent
ghux dlx <url> -A "Mozilla/5.0"

# Check if URL requires authentication
ghux dlx <url> -H "Authorization: Bearer YOUR_TOKEN"
```

### File Already Exists

```bash
# Prompt appears by default
ghux dlx <url>
# ? File already exists: file.pdf. Overwrite? (y/N)

# Force overwrite
ghux dlx <url> --overwrite

# Use different name
ghux dlx <url> -o different-name.pdf
```

### Slow Download

- Large files will naturally take longer
- Progress bar shows download speed
- Check your internet connection
- Try different mirror/source

### Connection Issues

```bash
# May need to follow redirects (default: enabled)
ghux dlx <url>

# Disable redirects if needed
ghux dlx <url> --no-redirect
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

# New way (ghux dlx)
ghux dlx https://example.com/file.pdf -o file.pdf

# Even simpler (auto filename)
ghux dlx https://example.com/file.pdf
```

### Replace wget

```bash
# Old way (wget)
wget -O file.pdf https://example.com/file.pdf

# New way (ghux dlx)
ghux dlx https://example.com/file.pdf -o file.pdf

# With progress and better UI
ghux dlx https://example.com/file.pdf
```

---

## 🔗 Related Commands

- `ghux dl` - Download from Git repositories
- `ghux dl-dir` - Download directories from Git
- `ghux dl-release` - Download GitHub releases
- `ghux` - Main interactive menu

---

## 📚 More Information

- [README.md](README.md) - Main documentation
- [DOWNLOAD_FEATURE.md](DOWNLOAD_FEATURE.md) - Git repository downloads
- [CHANGELOG.md](CHANGELOG.md) - Version history
- `ghux --help` - Built-in help

---

## 🎯 Summary

**`ghux dlx`** is your go-to command for downloading any file from any URL:

- ✅ Simple and intuitive
- ✅ Progress tracking with speed
- ✅ Safe with overwrite protection
- ✅ Works with any HTTP/HTTPS URL
- ✅ Beautiful terminal output
- ✅ Batch downloads from file lists
- ✅ Custom headers and user agents

**Try it now:**

```bash
ghux dlx https://example.com/file.pdf
```

---

**Happy Downloading! 🚀**