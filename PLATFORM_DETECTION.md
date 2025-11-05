# 🌐 Platform Auto-Detection - Documentation

## Overview

GhE v1.0.1 introduces intelligent platform auto-detection that automatically identifies and configures the correct git hosting platform (GitHub, GitLab, Bitbucket, Gitea, or custom platforms) based on your repository's remote URL.

---

## ✨ Features

### 🔍 Automatic Platform Detection

GhE automatically detects the platform when:
- Adding a new account (detects from current repository)
- Switching accounts (uses account's configured platform)
- Testing connections (platform-aware testing)
- Displaying repository status (shows detected platform)
- Running health checks (tests against correct platform)

### 🎯 Smart URL Pattern Recognition

Detects platforms from various URL formats:

**GitHub:**
```
git@github.com:user/repo.git
https://github.com/user/repo.git
git@github.enterprise.com:user/repo.git
```

**GitLab:**
```
git@gitlab.com:user/repo.git
https://gitlab.com/user/repo.git
git@gitlab.company.com:user/repo.git
https://gitlab.company.com/user/repo.git
```

**Bitbucket:**
```
git@bitbucket.org:user/repo.git
https://bitbucket.org/user/repo.git
```

**Gitea:**
```
git@gitea.com:user/repo.git
https://gitea.com/user/repo.git
git@gitea.selfhosted.com:user/repo.git
```

**Custom/Other:**
```
git@custom-git.company.com:user/repo.git
https://git.internal.org/user/repo.git
```

---

## 🚀 How It Works

### 1. Adding New Account

When you add a new account inside a git repository, GhE automatically detects the platform:

```bash
cd ~/projects/company-repo  # GitLab repository
ghe

# Select "➕ Add account"
# GhE shows: "📡 Detected platform from current repo: 🦊 GitLab"
# Platform is pre-selected in the menu
```

**What happens:**
1. GhE reads the remote URL from `.git/config`
2. Analyzes URL pattern to identify platform
3. Extracts custom domain if present
4. Pre-selects the detected platform in account setup
5. Suggests custom domain if detected

### 2. Switching Accounts

When switching accounts, GhE uses the account's configured platform:

```bash
ghe switch work-gitlab
```

**What happens:**
1. Reads account's platform configuration
2. Builds remote URL using correct platform domain
3. Configures SSH for the specific platform host
4. Updates git credentials for HTTPS (if using token)
5. Shows platform icon and name in success message

**Example Output:**
```
✓ Repository switched to SSH authentication

🦊 Platform: GitLab
Remote: git@gitlab.company.com:team/api.git
Account: work-gitlab
```

### 3. Connection Testing

Platform-aware connection testing with specific validation:

```bash
ghe
# Select "🧪 Test connection"
```

**What happens:**
1. Detects account's platform configuration
2. Uses correct SSH host (github.com, gitlab.com, etc.)
3. Validates response with platform-specific patterns:
   - GitHub: "successfully authenticated"
   - GitLab: "Welcome to GitLab"
   - Bitbucket: "authenticated via"
   - Gitea: "Hi there"
4. Provides platform-specific troubleshooting URLs

**Example Output:**
```
🧪 Testing SSH connection to GitLab (gitlab.company.com)...
✓ SSH authentication test passed!

Authenticated successfully to gitlab.company.com
```

### 4. Health Checks

Health checks automatically use the correct platform:

```bash
ghe health
```

**For each account:**
- Tests SSH connection to correct platform host
- Validates token against correct API endpoint
- Shows platform-specific error messages
- Provides platform-specific fix URLs

### 5. Repository Status

View comprehensive repository information including platform:

```bash
ghe status
```

**Output:**
```
📊 Repository Status
──────────────────────────────────────────────────
Repository: company/api-server
Owner: company
Remote URL: git@gitlab.company.com:company/api-server.git
Platform: 🦊 GitLab
Domain: gitlab.company.com
Auth Type: SSH

👤 Git Identity
──────────────────────────────────────────────────
Name: John Doe
Email: john@company.com

🔐 Active Account
──────────────────────────────────────────────────
Account: work-gitlab
SSH Key: ~/.ssh/id_ed25519_work
Platform: 🦊 GitLab
Domain: gitlab.company.com
```

---

## 🎨 Platform Icons & Names

Each platform has a distinctive icon for easy identification:

| Platform   | Icon | Display Name |
|------------|------|--------------|
| GitHub     | 🐙   | GitHub       |
| GitLab     | 🦊   | GitLab       |
| Bitbucket  | 🪣   | Bitbucket    |
| Gitea      | 🍵   | Gitea        |
| Other      | 🔧   | Other        |

---

## 🔧 Platform-Specific Features

### SSH Configuration

Each platform gets its own SSH host configuration:

**GitHub:**
```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_work
  IdentitiesOnly yes
```

**GitLab (custom domain):**
```
Host gitlab.company.com
  HostName gitlab.company.com
  User git
  IdentityFile ~/.ssh/id_ed25519_work
  IdentitiesOnly yes
```

### API Endpoints

Platform-specific API URLs for token validation:

- **GitHub:** `https://api.github.com/user`
- **GitLab:** `https://gitlab.com/api/v4/user` or custom domain
- **Bitbucket:** `https://api.bitbucket.org/2.0/user`
- **Gitea:** `https://gitea.com/api/v1/user` or custom domain

### Authentication Headers

Each platform uses its preferred authentication method:

**GitHub/Gitea:**
```
Authorization: token ghp_xxxxxxxxxxxxx
```

**GitLab:**
```
PRIVATE-TOKEN: glpat-xxxxxxxxxxxxx
```

**Bitbucket:**
```
Authorization: Bearer xxxxxxxxxxxxx
```

### Settings URLs

Platform-specific settings pages for SSH keys and tokens:

**GitHub:**
- SSH Keys: https://github.com/settings/keys
- Tokens: https://github.com/settings/tokens

**GitLab:**
- SSH Keys: https://gitlab.com/-/profile/keys
- Tokens: https://gitlab.com/-/profile/personal_access_tokens

**Bitbucket:**
- SSH Keys: https://bitbucket.org/account/settings/ssh-keys/
- App Passwords: https://bitbucket.org/account/settings/app-passwords/

**Gitea:**
- SSH Keys: https://gitea.com/user/settings/keys
- Tokens: https://gitea.com/user/settings/applications

---

## 📝 Configuration Examples

### GitHub Account
```json
{
  "name": "personal",
  "gitUserName": "John Doe",
  "gitEmail": "john@personal.com",
  "platform": {
    "type": "github"
  },
  "ssh": {
    "keyPath": "~/.ssh/id_ed25519_personal"
  }
}
```

### GitLab Self-Hosted
```json
{
  "name": "work-gitlab",
  "gitUserName": "John Doe",
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

### Bitbucket Account
```json
{
  "name": "bitbucket-team",
  "gitUserName": "johndoe",
  "gitEmail": "john@team.com",
  "platform": {
    "type": "bitbucket"
  },
  "token": {
    "username": "johndoe",
    "token": "app-password-here"
  }
}
```

### Custom Git Platform
```json
{
  "name": "internal-git",
  "gitUserName": "john.doe",
  "gitEmail": "john.doe@internal.org",
  "platform": {
    "type": "other",
    "domain": "git.internal.org"
  },
  "ssh": {
    "keyPath": "~/.ssh/id_rsa_internal"
  }
}
```

---

## 🔍 Detection Algorithm

GhE uses a multi-step detection process:

### 1. URL Pattern Matching
```
Input: git@gitlab.company.com:user/repo.git

Step 1: Extract domain → "gitlab.company.com"
Step 2: Match against patterns → Contains "gitlab"
Step 3: Identify platform → GitLab
Step 4: Compare domain → Not default gitlab.com
Step 5: Store custom domain → "gitlab.company.com"
```

### 2. Platform Patterns

Each platform has multiple detection patterns:

**GitHub:**
- Domain patterns: `github.com`, `*.github.com`
- URL patterns: `github.com[/:]`, `git@github.com:`
- Priority: High (most common)

**GitLab:**
- Domain patterns: `gitlab.com`, `*.gitlab.com`, contains "gitlab"
- URL patterns: `gitlab.com[/:]`, `git@gitlab.`, contains "gitlab"
- Priority: High

**Bitbucket:**
- Domain patterns: `bitbucket.org`, `*.bitbucket.org`
- URL patterns: `bitbucket.org[/:]`, `git@bitbucket.org:`
- Priority: Medium

**Gitea:**
- Domain patterns: `gitea.com`, `*.gitea.com`, contains "gitea"
- URL patterns: `gitea.com[/:]`, `git@gitea.`, contains "gitea"
- Priority: Medium

**Other:**
- Fallback for any unrecognized domain
- Requires manual domain configuration

### 3. Domain Extraction

Supports multiple URL formats:

```javascript
// SSH format
git@domain.com:path/repo.git → domain.com

// HTTPS format
https://domain.com/path/repo.git → domain.com

// SSH protocol format
ssh://git@domain.com/path/repo.git → domain.com
```

---

## 🎯 Use Cases

### Case 1: Work with Multiple Platforms

```bash
# Company uses GitLab
cd ~/work/api-server
ghe
# Add account → Auto-detects GitLab → work-gitlab

# Personal projects on GitHub
cd ~/personal/portfolio
ghe
# Add account → Auto-detects GitHub → personal-github

# Client project on Bitbucket
cd ~/client/website
ghe
# Add account → Auto-detects Bitbucket → client-bitbucket

# Switch easily between them
ghe quick  # Shows all with platform icons
```

### Case 2: Self-Hosted GitLab

```bash
# Clone from self-hosted GitLab
git clone git@gitlab.company.com:team/project.git
cd project

# Add account
ghe
# GhE detects:
# - Platform: GitLab
# - Domain: gitlab.company.com
# Pre-selects GitLab and suggests custom domain
```

### Case 3: Enterprise GitHub

```bash
# Clone from GitHub Enterprise
git clone git@github.enterprise.com:org/repo.git
cd repo

# Add account
ghe
# GhE detects:
# - Platform: GitHub
# - Domain: github.enterprise.com
# Works seamlessly with custom domain
```

---

## 🛠️ Troubleshooting

### Platform Not Detected

**Problem:** Platform shows as "Other" when it should be recognized.

**Solution:**
1. Check remote URL: `git remote -v`
2. Verify URL contains platform identifier (github, gitlab, etc.)
3. Manually select platform when adding account
4. Set custom domain if using self-hosted

### Wrong Platform Detected

**Problem:** GitLab detected as GitHub (or vice versa).

**Solution:**
1. Edit account: `ghe` → "✏️ Edit account"
2. Update platform selection
3. Set correct custom domain
4. Test connection to verify

### Custom Domain Issues

**Problem:** Custom domain not working with platform.

**Solution:**
1. Verify domain is accessible: `ping gitlab.company.com`
2. Test SSH manually: `ssh -T git@gitlab.company.com`
3. Check DNS resolution
4. Ensure firewall allows SSH/HTTPS
5. Set custom API URL if needed (advanced)

### SSH Test Fails Despite Correct Config

**Problem:** Health check shows SSH test failed.

**Solution:**
1. Verify SSH key uploaded to platform
2. Check platform-specific SSH key settings URL (shown in error)
3. Test manually: `ssh -T git@<platform-domain>`
4. Check SSH key permissions: `ls -la ~/.ssh/id_*`
5. Verify platform host in `~/.ssh/config`

---

## 🔐 Security Notes

### Platform-Specific Security

- Each platform has its own SSH host configuration
- Keys are isolated per platform
- Token authentication uses platform-specific headers
- No cross-platform credential sharing

### Best Practices

1. **Use separate keys per platform:**
   ```
   ~/.ssh/id_ed25519_github
   ~/.ssh/id_ed25519_gitlab
   ~/.ssh/id_ed25519_bitbucket
   ```

2. **Verify platform before pushing:**
   ```bash
   ghe status  # Check active platform
   ```

3. **Use SSH over tokens when possible:**
   - SSH keys are more secure
   - Tokens stored in plaintext in `~/.git-credentials`
   - SSH keys can be protected with passphrase

4. **Regular health checks:**
   ```bash
   ghe health  # Weekly recommended
   ```

---

## 📚 API Reference

### Platform Detection Functions

```typescript
// Detect platform from remote URL
detectPlatformFromUrl(url: string | null): PlatformConfig

// Detect platform from domain
detectPlatformFromDomain(domain: string): GitPlatform

// Get platform display name
getPlatformName(platform: GitPlatform): string

// Get platform icon
getPlatformIcon(platform: GitPlatform): string

// Get SSH host for platform
getPlatformSshHost(config: PlatformConfig): string

// Build remote URL for platform
buildRemoteUrl(
  platform: PlatformConfig,
  repoPath: string,
  useSSH: boolean
): string

// Get platform-specific instructions
getPlatformInstructions(
  platform: GitPlatform,
  domain?: string
): {
  sshKeyUrl: string;
  tokenUrl: string;
  sshTestCommand: string;
}

// Get platform SSH success pattern
getPlatformSshSuccessPattern(platform: GitPlatform): RegExp

// Validate platform config
validatePlatformConfig(config: PlatformConfig): {
  valid: boolean;
  error?: string;
}
```

---

## 🎓 Learn More

- **Main Documentation:** See README.md
- **New Features:** See FEATURES_v1.0.1.md
- **Changelog:** See CHANGELOG.md
- **GitHub Issues:** https://github.com/dwirx/ghe/issues

---

**Platform Auto-Detection makes GhE truly multi-platform! 🚀**

*No more manual configuration - GhE adapts to your workflow automatically.*