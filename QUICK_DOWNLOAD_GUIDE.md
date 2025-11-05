# 📥 Quick Download Guide - GhUx v1.0.5

> Fast reference for downloading files from Git repositories

---

## 🚀 Basic Commands

```bash
# Download single file
ghux dl <url>

# Download with custom name
ghux dl <url> -o newname.txt

# Download to directory
ghux dl <url> -d ~/Downloads/

# Download directory
ghux dl-dir <url>

# Download release
ghux dl-release <repo>
```

---

## 📝 Common Examples

### Download README
```bash
ghux dl https://github.com/user/repo/blob/main/README.md
```

### Download Config File
```bash
ghux dl github.com/user/repo/config.json -o my-config.json
```

### Download from Different Branch
```bash
ghux dl github.com/user/repo/file.txt --branch develop
```

### Download Multiple Files
```bash
ghux dl \
  github.com/user/repo/file1.md \
  github.com/user/repo/file2.md \
  github.com/user/repo/file3.md
```

### Download All Markdown Files
```bash
ghux dl github.com/user/repo --pattern "*.md"
```

### Download TypeScript Source
```bash
ghux dl github.com/user/repo --pattern "src/**/*.ts"
```

### Download Documentation Directory
```bash
ghux dl-dir https://github.com/user/repo/tree/main/docs
```

### Download Examples Folder
```bash
ghux dl-dir github.com/user/repo/examples -d ./examples/
```

### Download Latest Release
```bash
ghux dl-release github.com/user/repo
```

### Download Specific Release Asset
```bash
ghux dl-release github.com/user/repo --asset linux --version v2.0.0
```

### Download from Tag
```bash
ghux dl github.com/user/repo/package.json --tag v1.0.0
```

### Download from Commit
```bash
ghux dl github.com/user/repo/file.js --commit abc123
```

---

## 🎯 Shorthand Syntax

```bash
# These are equivalent:
ghux dl https://github.com/user/repo/blob/main/file.md
ghux dl github.com/user/repo/blob/main/file.md
ghux dl user/repo/file.md

# With branch:
ghux dl user/repo:develop/file.md
```

---

## 🔧 Options Reference

| Option | Description | Example |
|--------|-------------|---------|
| `-o, --output` | Custom filename | `-o config.json` |
| `-d, --dir` | Output directory | `-d ~/Downloads/` |
| `-b, --branch` | Specific branch | `--branch develop` |
| `-t, --tag` | Specific tag | `--tag v1.0.0` |
| `-c, --commit` | Specific commit | `--commit abc123` |
| `--pattern` | Glob pattern | `--pattern "*.md"` |
| `--exclude` | Exclude pattern | `--exclude "test/*"` |
| `--info` | Show info first | `--info` |
| `--overwrite` | Overwrite files | `--overwrite` |
| `--depth` | Directory depth | `--depth 2` |
| `--asset` | Release asset | `--asset linux` |
| `--version` | Release version | `--version v2.0.0` |

---

## 🌐 Supported Platforms

- ✅ GitHub (github.com)
- ✅ GitLab (gitlab.com + self-hosted)
- ✅ Bitbucket (bitbucket.org + self-hosted)
- ✅ Gitea (any instance)

---

## 💡 Pro Tips

1. **File List**: Save URLs to `urls.txt` and use `ghux dl -f urls.txt`
2. **Preview**: Use `--info` to see file details before downloading
3. **Safety**: Files won't be overwritten unless you use `--overwrite`
4. **Patterns**: Use glob patterns like `**/*.js` for recursive matching
5. **Performance**: Multiple files download in parallel automatically

---

## 📚 Full Documentation

For complete documentation, see:
- [DOWNLOAD_FEATURE.md](DOWNLOAD_FEATURE.md) - Comprehensive guide
- [README.md](README.md) - Main documentation
- `ghux --help` - Built-in help

---

## 🆘 Need Help?

```bash
# Show all commands
ghux --help

# Check version
ghux --version
```

**Issues?** https://github.com/dwirx/ghux/issues

---

**Happy Downloading! 🚀**