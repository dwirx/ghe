# 📦 Clone Repository Feature

GhE now supports cloning repositories directly with automatic account selection and authentication setup. This feature combines the convenience of `git clone` with GhE's powerful account management.

## 🚀 Quick Start

```bash
# Clone with HTTPS
ghe https://github.com/user/repo.git

# Clone with SSH
ghe git@github.com:user/repo.git

# Clone to a specific directory
ghe https://github.com/user/repo.git myproject
```

## 📋 Supported URL Formats

GhE accepts all common Git URL formats:

### HTTPS URLs
```bash
ghe https://github.com/user/repo.git
ghe https://github.com/user/repo
ghe https://github.com/user/repo#
ghe http://github.com/user/repo.git
```

### SSH URLs
```bash
ghe git@github.com:user/repo.git
ghe git@github.com:user/repo
ghe ssh://git@github.com/user/repo.git
```

### Multi-Platform Support
```bash
# GitHub
ghe https://github.com/user/repo.git

# GitLab
ghe https://gitlab.com/user/repo.git
ghe git@gitlab.com:user/repo.git

# Bitbucket
ghe https://bitbucket.org/user/repo.git
ghe git@bitbucket.org:user/repo.git

# Gitea (self-hosted)
ghe https://gitea.example.com/user/repo.git
ghe git@gitea.example.com:user/repo.git
```

## 🔄 Clone Workflow

When you run `ghe <repo-url>`, here's what happens:

### 1. **URL Validation**
- Validates the repository URL format
- Detects authentication type (SSH or HTTPS)
- Normalizes the URL (adds `.git` suffix if missing)

### 2. **Account Selection**
If you have accounts configured:
- Shows list of all configured accounts
- Displays active account indicator (✓)
- Shows authentication methods available for each account

If no accounts are configured:
- Clones repository without account setup (like regular `git clone`)
- Prompts you to configure an account after cloning

### 3. **Authentication Method Selection**
If the selected account has both SSH and Token:
- Prompts you to choose which method to use
- Shows key path for SSH or username for Token
- Updates the clone URL based on your choice

If the account has only one method:
- Automatically uses that method

### 4. **Authentication Setup**
**For SSH:**
- Writes SSH config block to `~/.ssh/config`
- Sets proper permissions on SSH keys (600 for private, 644 for public)
- Ensures public key exists (generates from private key if missing)

**For Token:**
- Configures git credential helper
- Writes credentials to `~/.git-credentials`
- Sets up HTTPS authentication

### 5. **Repository Cloning**
- Clones the repository with configured authentication
- Shows progress spinner during clone
- Handles errors gracefully with clear messages

### 6. **Post-Clone Setup**
- Sets local git identity (`user.name` and `user.email`)
- Applies account-specific configuration
- Logs the activity for tracking

### 7. **Success Message**
- Shows cloned directory name
- Confirms account configuration
- Provides next steps

## 💡 Usage Examples

### Example 1: Clone with Existing Account

```bash
$ ghe https://github.com/mycompany/api.git

╭─────────────────────────────────────╮
│        Clone Repository             │
╰─────────────────────────────────────╯

ℹ Repository: https://github.com/mycompany/api.git
ℹ Auth Type: HTTPS

ℹ Select an account to use for this repository:

? Choose account › 
❯ ✓ work (Active) - work@company.com
  personal - me@gmail.com
  opensource - dev@opensource.org

? Choose authentication method ›
❯ 🔐 Token - Using username: myworkuser
  🔑 SSH - Using key: ~/.ssh/id_ed25519_work

ℹ Clone URL: https://github.com/mycompany/api.git

? Proceed with clone? › (Y/n)

⣷ Cloning repository...

✔ Token credentials configured
✔ Git identity set: John Doe <work@company.com>
✔ Repository cloned to: api
✔ Account work configured for this repository
```

### Example 2: Clone to Custom Directory

```bash
$ ghe git@github.com:user/awesome-project.git my-project

# Clones to './my-project' instead of './awesome-project'
```

### Example 3: Clone Without Account Setup

```bash
$ ghe https://github.com/opensource/project.git

⚠ No accounts configured. Cloning without account setup...

? Proceed with clone? › (Y/n)

⣷ Cloning repository...

✔ Repository cloned to: project
ℹ Run ghe inside project to configure account
```

### Example 4: First-Time User

```bash
# 1. Install GhE
npm install -g ghe

# 2. Clone a repository (even without accounts configured)
ghe https://github.com/user/repo.git

# 3. Enter the cloned directory
cd repo

# 4. Configure your account
ghe
# Choose "Add account" from the menu
# Follow the prompts to set up SSH or Token

# 5. Switch to the account
ghe
# Choose "Switch account for current repo"
```

## 🎯 Advantages Over `git clone`

| Feature | `git clone` | `ghe <url>` |
|---------|-------------|--------------|
| Clone repository | ✅ | ✅ |
| Auto-setup authentication | ❌ | ✅ |
| Auto-set git identity | ❌ | ✅ |
| Account management | ❌ | ✅ |
| Multi-account support | ❌ | ✅ |
| SSH key management | ❌ | ✅ |
| Token credential management | ❌ | ✅ |
| Activity logging | ❌ | ✅ |
| Cross-platform paths | ⚠️ | ✅ |

## 🔐 Security Considerations

### SSH Method
- Private keys stored in `~/.ssh/` with 600 permissions
- Public keys with 644 permissions
- SSH config uses `IdentitiesOnly yes` to prevent key leakage
- Keys are never transmitted

### Token Method
- Tokens stored in `~/.git-credentials` (plaintext)
- Only accessible by current user (proper file permissions)
- Credentials are never logged
- Consider using SSH for better security

**Security Best Practice:** Use SSH keys instead of tokens when possible, as tokens are stored in plaintext.

## 🌐 Cross-Platform Support

The clone feature works seamlessly across all platforms:

### Linux / macOS
```bash
ghe https://github.com/user/repo.git
```

### Windows (PowerShell)
```powershell
ghe https://github.com/user/repo.git
```

### Windows (Git Bash)
```bash
ghe https://github.com/user/repo.git
```

Path handling is automatic and platform-aware:
- Windows: `C:\Users\username\.ssh\`
- Linux/macOS: `/home/username/.ssh/`

## 🐛 Troubleshooting

### Issue: "Invalid git URL"

**Problem:** The URL format is not recognized.

**Solution:**
```bash
# Ensure the URL is complete
ghe https://github.com/user/repo.git  # ✅
ghe github.com/user/repo              # ❌

# Both SSH and HTTPS are supported
ghe git@github.com:user/repo.git      # ✅
ghe https://github.com/user/repo.git  # ✅
```

### Issue: "Clone failed: Permission denied"

**Problem:** SSH key is not authorized or token is invalid.

**Solution:**
1. For SSH: Ensure the public key is added to GitHub
   ```bash
   cat ~/.ssh/id_ed25519_work.pub
   # Copy and add to GitHub → Settings → SSH Keys
   ```

2. For Token: Verify the token has required permissions
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Ensure token has `repo` scope
   - Check token hasn't expired

3. Test connection before cloning:
   ```bash
   ghe
   # Choose "Test connection"
   # Select the account
   ```

### Issue: "Could not parse repository path from URL"

**Problem:** URL format is unusual or malformed.

**Solution:**
```bash
# Use standard GitHub URL format
ghe https://github.com/owner/repo.git

# Avoid browser URLs
ghe https://github.com/owner/repo/tree/main  # ❌
```

### Issue: Clone works but wrong account is used

**Problem:** Global git config or SSH config is interfering.

**Solution:**
1. Check current git config:
   ```bash
   cd cloned-repo
   git config user.name
   git config user.email
   ```

2. Re-run GhE to switch account:
   ```bash
   ghe
   # Choose "Switch account for current repo"
   ```

3. Verify SSH config:
   ```bash
   cat ~/.ssh/config
   # Ensure correct Host block exists
   ```

## 🔧 Advanced Usage

### Clone Multiple Repositories

```bash
# Clone multiple repos for a project
ghe https://github.com/org/frontend.git
ghe https://github.com/org/backend.git
ghe https://github.com/org/database.git

# All use the same account selection
```

### Clone with Different Accounts

```bash
# Clone work repo with work account
ghe https://github.com/mycompany/api.git
# Select: work account

# Clone personal repo with personal account
ghe https://github.com/myusername/hobby.git
# Select: personal account
```

### Clone and Switch Later

```bash
# Clone without setup (no accounts yet)
ghe https://github.com/user/repo.git

# Enter directory
cd repo

# Setup account later
ghe
# Add account and switch
```

### Scripting / Automation

```bash
#!/bin/bash
# Script to clone multiple repos

repos=(
  "https://github.com/org/repo1.git"
  "https://github.com/org/repo2.git"
  "https://github.com/org/repo3.git"
)

for repo in "${repos[@]}"; do
  ghe "$repo"
done
```

**Note:** Interactive prompts will appear for each repository. For fully automated cloning, use `git clone` after setting up GhE accounts globally.

## 📊 Activity Logging

All clone operations are logged for tracking:

```bash
# View activity log
ghe log

# Example log entry:
# 2024-01-15 10:30:45 | SWITCH | work | mycompany/api | SSH | SUCCESS
```

Log includes:
- Timestamp
- Action type (SWITCH for clone operations)
- Account name
- Repository path
- Authentication method
- Success/failure status
- Error message (if failed)

## 🎓 Learning Resources

- **Main README**: [README.md](README.md) - Full GhE documentation
- **Installation Guide**: [INSTALL.md](INSTALL.md) - All installation methods
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- **Platform Support**: [PLATFORM_SUPPORT_SUMMARY.md](PLATFORM_SUPPORT_SUMMARY.md) - Cross-platform compatibility

## 🤝 Contributing

Found a bug or have a feature request for the clone functionality? Please open an issue on [GitHub](https://github.com/dwirx/ghe/issues).

---

**Made with ❤️ by the GhE team**