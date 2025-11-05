# 📥 GhUx Download Feature Documentation

Download files and directories directly from Git repositories (GitHub, GitLab, Bitbucket) without cloning.

## Table of Contents

- [Quick Start](#quick-start)
- [Single File Download](#single-file-download)
- [Multiple Files Download](#multiple-files-download)
- [Directory Download](#directory-download)
- [Pattern Matching](#pattern-matching)
- [Release Downloads](#release-downloads)
- [Branch/Tag/Commit Specific](#branchtag commit-specific)
- [URL Formats](#url-formats)
- [Command Reference](#command-reference)

---

## Quick Start

```bash
# Download a single file
ghux dl https://github.com/dwirx/ghux/blob/main/README.md

# Download with custom name
ghux dl <url> -o custom-name.md

# Download to specific directory
ghux dl <url> -d ~/Downloads/

# Download entire directory
ghux dl-dir https://github.com/user/repo/tree/main/src

# Download latest release
ghux dl-release github.com/user/repo
```

---

## 📥 Single File Download

### Basic Usage

```bash
# Standard download
ghux dl https://github.com/dwirx/ghux/blob/main/CHANGELOG.md

# Using raw URL
ghux dl https://raw.githubusercontent.com/dwirx/ghux/main/CHANGELOG.md

# Shorthand commands
ghux get <url>
ghux fetch-file <url>
```

### Download with Custom Name

```bash
# Rename on download
ghux dl https://github.com/user/repo/blob/main/config.json -o my-config.json

# Using long option
ghux dl <url> --output custom-name.txt

# Keep original name (explicit)
ghux dl <url> -O
```

### Download to Specific Directory

```bash
# Download to folder
ghux dl <url> --dir ./configs/
ghux dl <url> -d ~/Downloads/

# Download and preserve repository path structure
ghux dl <url> --preserve-path
```

### Show File Info Before Download

```bash
# Preview file details
ghux dl <url> --info

# Output example:
# ╭─────────────────────────────────────╮
# │       File Information              │
# ├─────────────────────────────────────┤
# │ File: CHANGELOG.md                  │
# │ Size: 15.2 KB                       │
# │ Last Modified: 2024-01-15           │
# │ Platform: github                    │
# │ Repository: dwirx/ghux              │
# │ Branch: main                        │
# │ URL: https://raw...                 │
# ╰─────────────────────────────────────╯
# ? Proceed with download? (Y/n)
```

---

## 📂 Multiple Files Download

### Download Multiple URLs

```bash
# Download several files at once
ghux dl \
  https://github.com/user/repo/blob/main/file1.md \
  https://github.com/user/repo/blob/main/file2.md \
  https://github.com/user/repo/blob/main/file3.md

# Short syntax
ghux dl user/repo/file1.md user/repo/file2.md user/repo/file3.md
```

### Download from File List

Create a text file with URLs (one per line):

```txt
# filelist.txt
https://github.com/user/repo/blob/main/file1.md
https://github.com/user/repo/blob/main/file2.md
https://github.com/user/repo/blob/main/docs/guide.md

# Lines starting with # are ignored as comments
```

Download from the list:

```bash
ghux dl -f filelist.txt
ghux dl --file-list urls.txt -d ./downloads/
```

---

## 🗂️ Directory Download

### Basic Directory Download

```bash
# Download entire directory
ghux dl-dir https://github.com/user/repo/tree/main/src

# Short format (assumes github.com)
ghux dl-dir user/repo/src

# Download to specific location
ghux dl-dir <url> --dir ./local-folder/
```

### Limit Directory Depth

```bash
# Only download 2 levels deep
ghux dl-dir <url> --depth 2

# Download only top-level files
ghux dl-dir <url> --depth 1
```

### Preserve Path Structure

```bash
# Maintain repository folder structure locally
ghux dl-dir <url> --preserve-path
```

---

## 🎯 Pattern Matching

### Download Files by Pattern

```bash
# Download all markdown files
ghux dl github.com/user/repo --pattern "*.md"

# Download all TypeScript files in src directory
ghux dl github.com/user/repo --pattern "src/**/*.ts"

# Download all PDF documentation
ghux dl github.com/user/repo --pattern "docs/*.pdf"

# Multiple patterns with directory download
ghux dl-dir github.com/user/repo/src --pattern "*.js"
```

### Exclude Patterns

```bash
# Download JS files but exclude tests
ghux dl github.com/user/repo --pattern "*.js" --exclude "test/*"

# Download all files except node_modules
ghux dl-dir github.com/user/repo --pattern "*" --exclude "node_modules/*"

# Complex filtering
ghux dl github.com/user/repo \
  --pattern "src/**/*.ts" \
  --exclude "**/*.test.ts" \
  --exclude "**/*.spec.ts"
```

### Pattern Syntax

- `*` - Matches any characters (except `/`)
- `**` - Matches any characters including `/` (any depth)
- `?` - Matches single character
- `*.md` - All markdown files in current directory
- `**/*.md` - All markdown files at any depth
- `src/**/*.js` - All JS files under src directory

---

## 🏷️ Release Downloads

### Download Latest Release

```bash
# Download from latest GitHub release
ghux dl-release github.com/user/repo

# Interactive asset selection
# ╭──────────────────────────────────────╮
# │     Downloading Release              │
# ├──────────────────────────────────────┤
# │ Repository: user/repo                │
# │ Version: v2.1.0                      │
# │ Published: 2024-01-15                │
# │                                      │
# │ Available assets (3):                │
# │   • binary-linux.tar.gz (2.1 MB)    │
# │   • binary-macos.tar.gz (2.3 MB)    │
# │   • binary-windows.zip (2.5 MB)     │
# ╰──────────────────────────────────────╯
```

### Download Specific Release Version

```bash
# Download from specific version
ghux dl-release github.com/user/repo --version v2.0.0
ghux dl-release github.com/user/repo -v v1.5.3
```

### Filter by Asset Name

```bash
# Download only assets containing "linux"
ghux dl-release github.com/user/repo --asset linux

# Download specific file
ghux dl-release github.com/user/repo --asset binary.tar.gz

# Combine with version
ghux dl-release github.com/user/repo --version v2.0.0 --asset linux
```

### Save to Directory

```bash
# Download release assets to specific folder
ghux dl-release github.com/user/repo -d ~/Downloads/releases/
```

---

## 🌿 Branch/Tag/Commit Specific

### Download from Specific Branch

```bash
# Download from develop branch
ghux dl github.com/user/repo/blob/develop/file.md

# Using option flag
ghux dl github.com/user/repo/file.md --branch develop
ghux dl github.com/user/repo/file.md -b develop

# Short syntax with branch
ghux dl user/repo:develop/file.md
```

### Download from Tag

```bash
# Download from specific tag
ghux dl github.com/user/repo/blob/v1.2.3/CHANGELOG.md

# Using option flag
ghux dl github.com/user/repo/CHANGELOG.md --tag v1.2.3
ghux dl github.com/user/repo/CHANGELOG.md -t v1.2.3
```

### Download from Commit Hash

```bash
# Download from specific commit
ghux dl github.com/user/repo/blob/abc123def/file.md

# Using option flag
ghux dl github.com/user/repo/file.md --commit abc123def
ghux dl github.com/user/repo/file.md -c abc123def456
```

### Apply to Directory Downloads

```bash
# Download directory from specific branch
ghux dl-dir github.com/user/repo/src --branch develop

# Download with pattern from tag
ghux dl github.com/user/repo --pattern "*.md" --tag v2.0.0

# Release from specific version
ghux dl-release github.com/user/repo --version v1.5.0
```

---

## 🌐 URL Formats

### Supported Platforms

GhUx supports multiple Git hosting platforms:

#### GitHub

```bash
# Full URL
https://github.com/user/repo/blob/main/file.md

# Raw URL
https://raw.githubusercontent.com/user/repo/main/file.md

# Tree (directory)
https://github.com/user/repo/tree/main/src

# Short format
user/repo/file.md                    # assumes github.com and main branch
github.com/user/repo/blob/main/file.md

# With branch notation
user/repo:develop/file.md
```

#### GitLab

```bash
# Full URL
https://gitlab.com/user/repo/-/blob/main/file.md

# Self-hosted GitLab
https://gitlab.company.com/team/project/-/blob/master/config.yml

# Tree (directory)
https://gitlab.com/user/repo/-/tree/main/src
```

#### Bitbucket

```bash
# Full URL
https://bitbucket.org/user/repo/src/main/file.md

# Self-hosted Bitbucket
https://bitbucket.company.com/user/repo/src/master/file.js
```

#### Gitea

```bash
# Gitea instance
https://gitea.example.com/user/repo/src/branch/main/file.go
```

### URL Auto-Detection

GhUx automatically detects the platform and converts URLs to raw download URLs:

```bash
# All these work the same:
ghux dl https://github.com/user/repo/blob/main/README.md
ghux dl https://raw.githubusercontent.com/user/repo/main/README.md
ghux dl github.com/user/repo/blob/main/README.md
ghux dl user/repo/README.md
```

---

## 📋 Command Reference

### `ghux dl` / `ghux get` / `ghux fetch-file`

Download single or multiple files.

**Usage:**
```bash
ghux dl <url> [url2] [url3] [...] [options]
```

**Options:**
- `-o, --output <name>` - Custom output filename (single file only)
- `-O` - Keep original filename
- `-d, --dir <path>` - Output directory
- `--preserve-path` - Preserve repository path structure
- `-f, --file-list <path>` - Download from file list
- `--pattern <glob>` - Download files matching pattern
- `--exclude <glob>` - Exclude files matching pattern
- `-b, --branch <name>` - Specify branch
- `-t, --tag <name>` - Specify tag
- `-c, --commit <hash>` - Specify commit hash
- `--info` - Show file info before download
- `--progress` - Show progress bar
- `--overwrite` - Overwrite existing files

**Examples:**
```bash
ghux dl https://github.com/user/repo/blob/main/config.json
ghux dl <url> -o custom.json -d ~/configs/
ghux dl <url1> <url2> <url3> -d ./downloads/
ghux dl -f urls.txt --branch develop
ghux dl github.com/user/repo --pattern "*.md"
```

---

### `ghux dl-dir`

Download entire directory or files matching pattern.

**Usage:**
```bash
ghux dl-dir <url> [options]
```

**Options:**
- `-d, --dir <path>` - Output directory
- `--depth <n>` - Maximum directory depth (default: 10)
- `-b, --branch <name>` - Specify branch
- `--pattern <glob>` - Download only files matching pattern
- `--exclude <glob>` - Exclude files matching pattern
- `--overwrite` - Overwrite existing files

**Examples:**
```bash
ghux dl-dir https://github.com/user/repo/tree/main/src
ghux dl-dir user/repo/docs --depth 2
ghux dl-dir github.com/user/repo/src --pattern "*.ts"
ghux dl-dir <url> --pattern "*.js" --exclude "test/*"
```

---

### `ghux dl-release`

Download assets from GitHub releases.

**Usage:**
```bash
ghux dl-release <repo-url> [options]
```

**Options:**
- `--asset <name>` - Filter assets by name
- `--version <tag>` - Specific release version (default: latest)
- `-v <tag>` - Short version flag
- `-d, --dir <path>` - Output directory
- `--overwrite` - Overwrite existing files

**Examples:**
```bash
ghux dl-release github.com/user/repo
ghux dl-release github.com/user/repo --version v2.0.0
ghux dl-release github.com/user/repo --asset linux
ghux dl-release github.com/user/repo --asset binary.tar.gz -d ~/Downloads/
```

---

## 💡 Common Use Cases

### 1. Download Configuration Files

```bash
# Download project config
ghux dl user/repo/package.json -o my-package.json

# Download multiple configs
ghux dl \
  user/repo/.eslintrc.json \
  user/repo/.prettierrc.json \
  user/repo/tsconfig.json \
  -d ./config/
```

### 2. Fetch Documentation

```bash
# Download all docs without cloning
ghux dl-dir github.com/user/repo/docs

# Download only markdown files
ghux dl github.com/user/repo --pattern "docs/**/*.md"
```

### 3. Download Build Artifacts

```bash
# Download latest release binaries
ghux dl-release github.com/user/tool

# Download specific platform binary
ghux dl-release github.com/user/tool --asset linux-x64
```

### 4. Get Example Files

```bash
# Download examples directory
ghux dl-dir github.com/user/library/examples

# Download specific examples
ghux dl \
  user/library/examples/basic.js \
  user/library/examples/advanced.js
```

### 5. Batch Download from List

```bash
# Create list of important files
cat > important-files.txt << EOF
github.com/user/repo/README.md
github.com/user/repo/LICENSE
github.com/user/repo/CONTRIBUTING.md
github.com/user/repo/docs/API.md
EOF

# Download all at once
ghux dl -f important-files.txt -d ./project-docs/
```

### 6. Download Specific Version

```bash
# Download from stable tag
ghux dl user/repo/config.yml --tag v1.0.0

# Download from specific commit
ghux dl user/repo/package.json --commit abc123
```

---

## 🛠️ Advanced Tips

### Progress and Retry

Downloads automatically:
- Show progress bars
- Retry on failure (3 attempts with exponential backoff)
- Handle network interruptions
- Verify file integrity

### File Overwrite Protection

By default, existing files are not overwritten:

```bash
# Skip if file exists (default)
ghux dl <url>

# Force overwrite
ghux dl <url> --overwrite
```

### Unique Filenames

If file exists and overwrite is disabled, a unique name is generated:
- `file.txt` → `file (1).txt`
- `file (1).txt` → `file (2).txt`

### Concurrent Downloads

Multiple files are downloaded in parallel for better performance:

```bash
# These download concurrently, not sequentially
ghux dl file1.md file2.md file3.md file4.md file5.md
```

### Directory Structure Preservation

```bash
# Download with original structure
ghux dl-dir user/repo/src --preserve-path

# Results in:
# ./repo/src/index.ts
# ./repo/src/utils/helper.ts
# ./repo/src/components/Button.tsx
```

---

## ⚠️ Limitations

1. **GitHub API Rate Limits**: Unauthenticated requests limited to 60/hour
2. **Directory Size**: Very large directories may take time to enumerate
3. **Release Assets**: Only GitHub releases supported (not GitLab/Bitbucket)
4. **Binary Files**: All file types supported, but no streaming for very large files
5. **Private Repositories**: Requires authentication (not yet supported in download commands)

---

## 🐛 Troubleshooting

### "Invalid URL format"

Ensure URL follows supported format:
```bash
# ✓ Good
ghux dl github.com/user/repo/blob/main/file.md
ghux dl user/repo/file.md

# ✗ Bad
ghux dl github.com/user/repo  # Missing file path
```

### "HTTP 404: Not Found"

- Check if file exists in repository
- Verify branch name is correct
- Ensure file path is accurate

### "HTTP 403: Forbidden"

- May be hitting GitHub API rate limit
- Private repositories require authentication (not yet supported)

### Download Fails

```bash
# Show file info to debug
ghux dl <url> --info

# Try raw URL directly
ghux dl https://raw.githubusercontent.com/user/repo/main/file.md
```

---

## 📚 Related Commands

- `ghux` - Interactive menu
- `ghux <repo-url>` - Clone repository with account selection
- `ghux switch` - Switch account for current repo
- `ghux --help` - Show all commands

---

## 🔗 Links

- [Main README](./README.md)
- [Changelog](./CHANGELOG.md)
- [GitHub Repository](https://github.com/dwirx/ghux)

---

**Happy Downloading! 🚀**