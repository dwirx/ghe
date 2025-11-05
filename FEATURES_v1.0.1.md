# 🎉 GhE v1.0.1 - New Features Documentation

Welcome to GhE v1.0.1! This release brings powerful new features to enhance your GitHub account management workflow.

---

## 🆕 What's New in v1.0.1

### 🏥 Account Health Check

Monitor the health of all your configured accounts with automated SSH key and token validation.

**Features:**
- ✅ Validate SSH key existence and permissions
- ✅ Test SSH connections to git platforms
- ✅ Verify token authentication
- ✅ Detect token expiration (7-day warning)
- ✅ Visual health dashboard
- ✅ Automatic health check caching

**Usage:**

```bash
# Interactive mode
ghe
# Select "🏥 Health check"

# Direct command
ghe health
```

**What it checks:**
- SSH keys: File existence, permissions (600/400), connection test
- Tokens: API authentication, expiration dates
- Platform connectivity: GitHub, GitLab, Bitbucket, Gitea

**Example Output:**
```
📊 Health Summary
──────────────────────────────────────────────────
Total Accounts: 3
✓ Healthy: 2
⚠ Warnings: 1
✗ Errors: 0

📋 Detailed Results
──────────────────────────────────────────────────

▸ work-account
  ✓ SSH: Valid
  ✓ Token: Valid
  ⚠ Token expires in 5 days
  Last checked: 2025-01-15 10:30:45

▸ personal-account
  ✓ SSH: Valid
  Last checked: 2025-01-15 10:30:47
```

---

### 📜 Activity Log

Track all your account operations with comprehensive activity logging and statistics.

**Features:**
- 📝 Automatic operation logging
- 📊 Usage statistics and analytics
- 📥 CSV export for external analysis
- 🔍 Filter by account or repository
- 📈 Success/failure tracking

**Usage:**

```bash
# Interactive mode
ghe
# Select "📜 Activity log"

# Direct command
ghe log
```

**What it tracks:**
- Account switches (with repo path, method, platform)
- Account additions and removals
- Account edits
- Connection tests
- Success/failure status
- Timestamps

**Available Views:**

1. **Recent Activity** - Last 20 operations with details
2. **Statistics** - Comprehensive usage analytics
3. **Export to CSV** - Download for spreadsheet analysis
4. **Clear Log** - Reset activity history

**Example Statistics:**
```
📊 Activity Statistics
──────────────────────────────────────────────────

Overall Stats:
  Total Operations: 45
  ✓ Successful: 43
  ✗ Failed: 2
  Last Activity: 2025-01-15 14:22:10

Account Usage:
  work-account: 25 operations
  personal-account: 15 operations
  freelance: 5 operations

Repository Usage:
  company/api-server: 12 operations
  personal/portfolio: 8 operations
  client/website: 5 operations

Method Usage:
  SSH: 35 operations
  TOKEN: 10 operations

Platform Usage:
  github: 40 operations
  gitlab: 5 operations
```

---

### ⚡ CLI Shortcuts

Skip the interactive menu and run commands directly for faster workflows.

**Available Commands:**

#### Account Management
```bash
# Switch to specific account by name
ghe switch work

# Quick switch with recent accounts menu
ghe quick

# List all configured accounts
ghe list

# Show current repository status
ghe status
```

#### Monitoring
```bash
# Run health check on all accounts
ghe health

# View activity log
ghe log
```

#### Git Operations
```bash
# Add, commit with message, confirm before push
ghe shove "fix: resolved bug in auth flow"

# Add, commit with empty message, confirm before push
ghe shovenc
```

**Quick Switch Feature:**
The `ghe quick` command shows recently used accounts first, marked with a ⭐ star for easy identification.

```bash
$ ghe quick

? Quick switch to account: (Use arrow keys)
❯ work-account (current) ⭐
  personal-account ⭐
  freelance
  client-project
```

**Status Command Output:**
```bash
$ ghe status

📊 Repository Status
──────────────────────────────────────────────────
Repository: company/api-server
Owner: company
Remote URL: git@github.com:company/api-server.git
Auth Type: SSH

👤 Git Identity
──────────────────────────────────────────────────
Name: John Doe
Email: john@company.com

🔐 Active Account
──────────────────────────────────────────────────
Account: work-account
SSH Key: ~/.ssh/id_ed25519_work
Platform: github

🌿 Current Branch
──────────────────────────────────────────────────
Branch: feature/new-api
```

---

### 🚀 Git Shortcuts (Shove Commands)

Streamline your git workflow with convenient shortcuts that combine add, commit, and push operations.

**ghe shove <message>**

Add all files, commit with a message, and optionally push with confirmation.

```bash
# Example usage
ghe shove "feat: add user authentication"

# What happens:
# 1. git add .
# 2. git commit -m "feat: add user authentication"
# 3. Prompt: "Push to origin? (Y/n)"
# 4. If yes: git push origin
```

**ghe shovenc**

Add all files, commit with empty message, and optionally push with confirmation.

```bash
# Example usage
ghe shovenc

# What happens:
# 1. git add .
# 2. git commit --allow-empty-message -m ""
# 3. Prompt: "Push to origin? (Y/n)"
# 4. If yes: git push origin
```

**Safety Features:**
- ✅ Always asks for confirmation before pushing
- ✅ Shows clear status messages for each step
- ✅ Logs activity for tracking
- ✅ Handles errors gracefully

**Example Output:**
```bash
$ ghe shove "docs: update README"

ℹ Adding files...
✓ Files added
ℹ Committing with message: "docs: update README"
✓ Committed successfully
? Push to origin? › (Y/n)
ℹ Pushing to origin...
✓ Pushed successfully
```

---

### 🌐 Multi-Platform Git Service Support

GhE now supports multiple git hosting platforms beyond GitHub!

**Supported Platforms:**
- 🐙 **GitHub** (github.com)
- 🦊 **GitLab** (gitlab.com or self-hosted)
- 🪣 **Bitbucket** (bitbucket.org)
- 🍵 **Gitea** (gitea.com or self-hosted)
- 🔧 **Other** (custom platforms)

**Custom Domain Support:**

For self-hosted or enterprise installations:

```bash
# When adding an account, select platform
? Git platform: (Use arrow keys)
❯ GitHub
  GitLab
  Bitbucket
  Gitea
  Other

# Then specify custom domain (if not using default)
? Custom domain for gitlab (optional): gitlab.company.com
```

**Platform-Specific Features:**

1. **Tailored Authentication Testing**
   - Each platform has optimized connection tests
   - Platform-specific success messages
   - Correct API endpoints

2. **Custom API URLs**
   - Enterprise installations supported
   - Self-hosted instances
   - Private networks

3. **Activity Tracking**
   - Platform usage statistics
   - Per-platform operation history

**Example Configuration:**

```json
{
  "name": "work-gitlab",
  "gitUserName": "john.doe",
  "gitEmail": "john@company.com",
  "platform": {
    "type": "gitlab",
    "domain": "gitlab.company.com"
  },
  "ssh": {
    "keyPath": "~/.ssh/id_ed25519_work"
  }
}
```

---

## 🎯 Complete Command Reference

### Interactive Commands
```bash
ghe              # Start interactive menu
ghe --version    # Show version
ghe --help       # Show help
```

### Direct Commands
```bash
# Account Operations
ghe switch <name>    # Switch to specific account
ghe quick            # Quick switch menu
ghe list             # List all accounts
ghe status           # Show repo status

# Monitoring
ghe health           # Check account health
ghe log              # View activity log

# Git Operations
ghe shove <msg>      # Add, commit, push (with confirmation)
ghe shovenc          # Add, commit empty, push (with confirmation)
```

---

## 📊 Configuration File Structure

Your accounts are stored in `~/.config/ghup/config.json` (or `%APPDATA%\ghup\config.json` on Windows):

```json
{
  "accounts": [
    {
      "name": "work",
      "gitUserName": "John Doe",
      "gitEmail": "john@company.com",
      "platform": {
        "type": "github",
        "domain": null
      },
      "ssh": {
        "keyPath": "~/.ssh/id_ed25519_work"
      },
      "token": {
        "username": "johndoe",
        "token": "ghp_xxxxxxxxxxxxx"
      }
    }
  ],
  "activityLog": [],
  "healthChecks": [],
  "lastHealthCheck": "2025-01-15T10:30:45.123Z"
}
```

**Activity Log Location:** `~/.config/ghup/activity.log`

---

## 🔧 Troubleshooting

### Health Check Issues

**SSH Key Permission Errors:**
```bash
# Fix permissions manually
chmod 600 ~/.ssh/id_ed25519_work
chmod 644 ~/.ssh/id_ed25519_work.pub
chmod 700 ~/.ssh
```

**Token Expiration:**
1. Go to platform settings (e.g., GitHub → Settings → Developer settings → Personal access tokens)
2. Generate new token with required scopes
3. Update account in GhE: Select "✏️ Edit account"

### Activity Log

**Log file location:**
- Linux/macOS: `~/.config/ghup/activity.log`
- Windows: `%APPDATA%\ghup\activity.log`

**Clear log if needed:**
```bash
ghe log
# Select "🗑️ Clear log"
```

---

## 🚀 Migration from v1.0.0

**No action required!** GhE v1.0.1 automatically:
- ✅ Maintains backward compatibility
- ✅ Migrates existing configs
- ✅ Adds new fields automatically
- ✅ Preserves all account data

**New default values:**
- Platform: `github` (for existing accounts)
- Activity log: Empty array
- Health checks: Empty array

---

## 💡 Tips & Best Practices

### Account Health
- Run `ghe health` regularly (weekly recommended)
- Watch for token expiration warnings
- Keep SSH keys properly configured

### Activity Tracking
- Review activity log monthly for insights
- Export to CSV for record keeping
- Use statistics to optimize workflow

### CLI Shortcuts
- Use `ghe quick` for frequently switched accounts
- Alias common commands in your shell:
  ```bash
  alias ghs='ghe status'
  alias ghq='ghe quick'
  alias ghh='ghe health'
  ```

### Multi-Platform
- Name accounts clearly (e.g., `work-gitlab`, `personal-github`)
- Test connections after setup
- Document custom domains in team wiki

---

## 📚 Learn More

- **GitHub Repository:** https://github.com/dwirx/ghe
- **Report Issues:** https://github.com/dwirx/ghe/issues
- **Changelog:** See CHANGELOG.md
- **Original README:** See README.md

---

**Enjoy GhE v1.0.1! 🎉**

*For questions or feedback, please open an issue on GitHub.*