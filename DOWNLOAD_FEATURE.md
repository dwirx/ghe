# 📥 GhE Download Feature Documentation

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
ghe dl https://github.com/dwirx/ghe/blob/main/README.md

# Download with custom name
ghe dl <url> -o custom-name.md

# Download to specific directory
ghe dl <url> -d ~/Downloads/

# Download entire directory
ghe dl-dir https://github.com/user/repo/tree/main/src

# Download latest release
ghe dl-release github.com/user/repo
```

---

## 📥 Single File Download

### Basic Usage

```bash
# Standard download
ghe dl https://github.com/dwirx/ghe/blob/main/CHANGELOG.md

# Using raw URL
ghe dl https://raw.githubusercontent.com/dwirx/ghe/main/CHANGELOG.md

# Shorthand commands
ghe get <url>
ghe fetch-file <url>
```

### Download with Custom Name

```bash
# Rename on download
ghe dl https://github.com/user/repo/blob/main/config.json -o my-config.json

# Using long option
ghe dl <url> --output custom-name.txt

# Keep original name (explicit)
ghe dl <url> -O
```

### Download to Specific Directory

```bash
# Download to folder
ghe dl <url> --dir ./configs/
ghe dl <url> -d ~/Downloads/

# Download and preserve repository path structure
ghe dl <url> --preserve-path
```

### Show File Info Before Download

```bash
# Preview file details
ghe dl <url> --info

# Output example:
# ╭─────────────────────────────────────╮
# │       File Information              │
# ├─────────────────────────────────────┤
# │ File: CHANGELOG.md                  │
# │ Size: 15.2 KB                       │
# │ Last Modified: 2024-01-15           │
# │ Platform: github                    │
# │ Repository: dwirx/ghe              │
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
ghe dl \
  https://github.com/user/repo/blob/main/file1.md \
  https://github.com/user/repo/blob/main/file2.md \
  https://github.com/user/repo/blob/main/file3.md

# Short syntax
ghe dl user/repo/file1.md user/repo/file2.md user/repo/file3.md
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
ghe dl -f filelist.txt
ghe dl --file-list urls.txt -d ./downloads/
```

---

## 🗂️ Directory Download

### Basic Directory Download

```bash
# Download entire directory
ghe dl-dir https://github.com/user/repo/tree/main/src

# Short format (assumes github.com)
ghe dl-dir user/repo/src

# Download to specific location
ghe dl-dir <url> --dir ./local-folder/
```

### Limit Directory Depth

```bash
# Only download 2 levels deep
ghe dl-dir <url> --depth 2

# Download only top-level files
ghe dl-dir <url> --depth 1
```

### Preserve Path Structure

```bash
# Maintain repository folder structure locally
ghe dl-dir <url> --preserve-path
```

---

## 🎯 Pattern Matching

### Download Files by Pattern

```bash
# Download all markdown files
ghe dl github.com/user/repo --pattern "*.md"

# Download all TypeScript files in src directory
ghe dl github.com/user/repo --pattern "src/**/*.ts"

# Download all PDF documentation
ghe dl github.com/user/repo --pattern "docs/*.pdf"

# Multiple patterns with directory download
ghe dl-dir github.com/user/repo/src --pattern "*.js"
```

### Exclude Patterns

```bash
# Download JS files but exclude tests
ghe dl github.com/user/repo --pattern "*.js" --exclude "test/*"

# Download all files except node_modules
ghe dl-dir github.com/user/repo --pattern "*" --exclude "node_modules/*"

# Complex filtering
ghe dl github.com/user/repo \
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
ghe dl-release github.com/user/repo

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
ghe dl-release github.com/user/repo --version v2.0.0
ghe dl-release github.com/user/repo -v v1.5.3
```

### Filter by Asset Name

```bash
# Download only assets containing "linux"
ghe dl-release github.com/user/repo --asset linux

# Download specific file
ghe dl-release github.com/user/repo --asset binary.tar.gz

# Combine with version
ghe dl-release github.com/user/repo --version v2.0.0 --asset linux
```

### Save to Directory

```bash
# Download release assets to specific folder
ghe dl-release github.com/user/repo -d ~/Downloads/releases/
```

---

## 🌿 Branch/Tag/Commit Specific

### Download from Specific Branch

```bash
# Download from develop branch
ghe dl github.com/user/repo/blob/develop/file.md

# Using option flag
ghe dl github.com/user/repo/file.md --branch develop
ghe dl github.com/user/repo/file.md -b develop

# Short syntax with branch
ghe dl user/repo:develop/file.md
```

### Download from Tag

```bash
# Download from specific tag
ghe dl github.com/user/repo/blob/v1.2.3/CHANGELOG.md

# Using option flag
ghe dl github.com/user/repo/CHANGELOG.md --tag v1.2.3
ghe dl github.com/user/repo/CHANGELOG.md -t v1.2.3
```

### Download from Commit Hash

```bash
# Download from specific commit
ghe dl github.com/user/repo/blob/abc123def/file.md

# Using option flag
ghe dl github.com/user/repo/file.md --commit abc123def
ghe dl github.com/user/repo/file.md -c abc123def456
```

### Apply to Directory Downloads

```bash
# Download directory from specific branch
ghe dl-dir github.com/user/repo/src --branch develop

# Download with pattern from tag
ghe dl github.com/user/repo --pattern "*.md" --tag v2.0.0

# Release from specific version
ghe dl-release github.com/user/repo --version v1.5.0
```

---

## 🌐 URL Formats

### Supported Platforms

GhE supports multiple Git hosting platforms:

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

GhE automatically detects the platform and converts URLs to raw download URLs:

```bash
# All these work the same:
ghe dl https://github.com/user/repo/blob/main/README.md
ghe dl https://raw.githubusercontent.com/user/repo/main/README.md
ghe dl github.com/user/repo/blob/main/README.md
ghe dl user/repo/README.md
```

---

## 📋 Command Reference

### `ghe dl` / `ghe get` / `ghe fetch-file`

Download single or multiple files.

**Usage:**
```bash
ghe dl <url> [url2] [url3] [...] [options]
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
ghe dl https://github.com/user/repo/blob/main/config.json
ghe dl <url> -o custom.json -d ~/configs/
ghe dl <url1> <url2> <url3> -d ./downloads/
ghe dl -f urls.txt --branch develop
ghe dl github.com/user/repo --pattern "*.md"
```

---

### `ghe dl-dir`

Download entire directory or files matching pattern.

**Usage:**
```bash
ghe dl-dir <url> [options]
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
ghe dl-dir https://github.com/user/repo/tree/main/src
ghe dl-dir user/repo/docs --depth 2
ghe dl-dir github.com/user/repo/src --pattern "*.ts"
ghe dl-dir <url> --pattern "*.js" --exclude "test/*"
```

---

### `ghe dl-release`

Download assets from GitHub releases.

**Usage:**
```bash
ghe dl-release <repo-url> [options]
```

**Options:**
- `--asset <name>` - Filter assets by name
- `--version <tag>` - Specific release version (default: latest)
- `-v <tag>` - Short version flag
- `-d, --dir <path>` - Output directory
- `--overwrite` - Overwrite existing files

**Examples:**
```bash
ghe dl-release github.com/user/repo
ghe dl-release github.com/user/repo --version v2.0.0
ghe dl-release github.com/user/repo --asset linux
ghe dl-release github.com/user/repo --asset binary.tar.gz -d ~/Downloads/
```

---

## 💡 Common Use Cases

### 1. Download Configuration Files

```bash
# Download project config
ghe dl user/repo/package.json -o my-package.json

# Download multiple configs
ghe dl \
  user/repo/.eslintrc.json \
  user/repo/.prettierrc.json \
  user/repo/tsconfig.json \
  -d ./config/
```

### 2. Fetch Documentation

```bash
# Download all docs without cloning
ghe dl-dir github.com/user/repo/docs

# Download only markdown files
ghe dl github.com/user/repo --pattern "docs/**/*.md"
```

### 3. Download Build Artifacts

```bash
# Download latest release binaries
ghe dl-release github.com/user/tool

# Download specific platform binary
ghe dl-release github.com/user/tool --asset linux-x64
```

### 4. Get Example Files

```bash
# Download examples directory
ghe dl-dir github.com/user/library/examples

# Download specific examples
ghe dl \
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
ghe dl -f important-files.txt -d ./project-docs/
```

### 6. Download Specific Version

```bash
# Download from stable tag
ghe dl user/repo/config.yml --tag v1.0.0

# Download from specific commit
ghe dl user/repo/package.json --commit abc123
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
ghe dl <url>

# Force overwrite
ghe dl <url> --overwrite
```

### Unique Filenames

If file exists and overwrite is disabled, a unique name is generated:
- `file.txt` → `file (1).txt`
- `file (1).txt` → `file (2).txt`

### Concurrent Downloads

Multiple files are downloaded in parallel for better performance:

```bash
# These download concurrently, not sequentially
ghe dl file1.md file2.md file3.md file4.md file5.md
```

### Directory Structure Preservation

```bash
# Download with original structure
ghe dl-dir user/repo/src --preserve-path

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
ghe dl github.com/user/repo/blob/main/file.md
ghe dl user/repo/file.md

# ✗ Bad
ghe dl github.com/user/repo  # Missing file path
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
ghe dl <url> --info

# Try raw URL directly
ghe dl https://raw.githubusercontent.com/user/repo/main/file.md
```

---

## 📚 Related Commands

- `ghe` - Interactive menu
- `ghe <repo-url>` - Clone repository with account selection
- `ghe switch` - Switch account for current repo
- `ghe --help` - Show all commands

---

## 🔗 Links

- [Main README](./README.md)
- [Changelog](./CHANGELOG.md)
- [GitHub Repository](https://github.com/dwirx/ghe)

---

**Happy Downloading! 🚀**