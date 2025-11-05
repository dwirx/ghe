# Platform Testing Guide

This document describes how to test GhE with different Git platforms and what to expect.

## Prerequisites

Before testing, ensure you have:
1. SSH keys generated for each platform
2. Public keys added to your accounts on each platform
3. Accounts configured in GhE

## Test Procedure

### 1. GitHub Testing

**Setup:**
```bash
# Add GitHub account in GhE
ghe
# Choose: Add new account → SSH → GitHub → Enter details
```

**Manual SSH Test:**
```bash
ssh -T git@github.com
```

**Expected Output:**
```
Hi username! You've successfully authenticated, but GitHub does not provide shell access.
```

**GhE Test:**
```bash
ghe
# Choose: Test connection → Select GitHub account
```

**Expected GhE Output:**
```
✓ SSH authentication test passed!
ℹ Authenticated successfully to github.com
Successfully authenticated as username
```

---

### 2. GitLab Testing

**Setup:**
```bash
# Add GitLab account in GhE
ghe
# Choose: Add new account → SSH → GitLab → Enter details
```

**Manual SSH Test:**
```bash
ssh -T git@gitlab.com
```

**Expected Output:**
```
Welcome to GitLab, @username!
```

**GhE Test:**
```bash
ghe
# Choose: Test connection → Select GitLab account
```

**Expected GhE Output:**
```
✓ SSH authentication test passed!
ℹ Authenticated successfully to gitlab.com
Successfully authenticated as username
```

---

### 3. Bitbucket Testing

**Setup:**
```bash
# Add Bitbucket account in GhE
ghe
# Choose: Add new account → SSH → Bitbucket → Enter details
```

**Manual SSH Test:**
```bash
ssh -T git@bitbucket.org
```

**Expected Output:**
```
authenticated via ssh key.

You can use git to connect to Bitbucket. Shell access is disabled
```

**GhE Test:**
```bash
ghe
# Choose: Test connection → Select Bitbucket account
```

**Expected GhE Output:**
```
✓ SSH authentication test passed!
ℹ Authenticated successfully to bitbucket.org
Successfully authenticated as user
```

---

### 4. Gitea Testing

**Setup:**
```bash
# Add Gitea account in GhE
ghe
# Choose: Add new account → SSH → Gitea → Enter details
```

**Manual SSH Test:**
```bash
ssh -T git@gitea.com
# Or for self-hosted:
ssh -T git@gitea.yourcompany.com
```

**Expected Output (may vary):**
```
Hi there, username! You've successfully authenticated, but Gitea does not provide shell access.
```

**GhE Test:**
```bash
ghe
# Choose: Test connection → Select Gitea account
```

**Expected GhE Output:**
```
✓ SSH authentication test passed!
ℹ Authenticated successfully to gitea.com
Successfully authenticated as username
```

---

## SSH Config Verification

After switching accounts, verify your `~/.ssh/config`:

```bash
cat ~/.ssh/config
```

**Expected format for each platform:**

```
Host github.com
  HostName github.com
  User git
  IdentityFile /home/user/.ssh/id_ed25519_github
  IdentitiesOnly yes

Host gitlab.com
  HostName gitlab.com
  User git
  IdentityFile /home/user/.ssh/gitlab_key
  IdentitiesOnly yes

Host bitbucket.org
  HostName bitbucket.org
  User git
  IdentityFile /home/user/.ssh/bitbucket_key
  IdentitiesOnly yes

Host gitea.com
  HostName gitea.com
  User git
  IdentityFile /home/user/.ssh/gitea_key
  IdentitiesOnly yes
```

---

## Platform-Specific Success Patterns

GhE recognizes these patterns as successful authentication:

| Platform | Success Pattern | Example |
|----------|----------------|---------|
| GitHub | `Hi <user>! You've successfully authenticated` | `Hi john! You've successfully authenticated, but GitHub does not provide shell access.` |
| GitLab | `Welcome to GitLab, @<user>!` | `Welcome to GitLab, @john!` |
| Bitbucket | `authenticated via ssh key` or `You can use git` | `authenticated via ssh key. You can use git to connect to Bitbucket. Shell access is disabled` |
| Gitea | `Hi there, <user>!` or `successfully authenticated` | `Hi there, john! You've successfully authenticated, but Gitea does not provide shell access.` |

---

## Common Test Scenarios

### Scenario 1: Switch Between GitHub and GitLab in Same Repo

```bash
cd ~/my-project

# Initially using GitHub
git remote -v
# origin  git@github.com:user/repo.git (fetch)

# Switch to GitLab account
ghe
# Choose: Switch for current repo → Select GitLab account

# Verify remote changed
git remote -v
# origin  git@gitlab.com:user/repo.git (fetch)

# Test connection
ghe
# Choose: Test connection → Should show GitLab success
```

### Scenario 2: Global SSH Switch

```bash
# Set global default to Bitbucket
ghe
# Choose: Switch SSH globally → Select Bitbucket account

# Check SSH config
cat ~/.ssh/config | grep -A 5 "Host bitbucket.org"

# Test
ssh -T git@bitbucket.org
# Should succeed
```

### Scenario 3: Multi-Account Same Platform

```bash
# Add multiple GitHub accounts
ghe
# Add account: github-work
# Add account: github-personal

# Switch between them
ghe
# Choose: Switch SSH globally → github-work
# SSH config now uses work key

ghe
# Choose: Switch SSH globally → github-personal
# SSH config now uses personal key
```

---

## Troubleshooting Tests

### Test Failed: "Permission denied (publickey)"

**Causes:**
1. Public key not added to platform
2. Wrong key being used
3. Key permissions incorrect

**Fix:**
```bash
# Check key permissions
ls -la ~/.ssh/your_key
# Should be: -rw------- (600)

# Fix if needed
chmod 600 ~/.ssh/your_key

# Copy public key
cat ~/.ssh/your_key.pub

# Add to platform:
# - GitHub: https://github.com/settings/keys
# - GitLab: https://gitlab.com/-/profile/keys
# - Bitbucket: https://bitbucket.org/account/settings/ssh-keys/
# - Gitea: https://gitea.com/user/settings/keys
```

### Test Failed: "Connection timeout"

**Causes:**
1. Firewall blocking port 22
2. Behind corporate proxy
3. Server down

**Fix:**
```bash
# Test direct connection
nc -zv github.com 22
# Should show: Connection succeeded

# If timeout, try HTTPS instead:
ghe
# Choose: Add new account → Token (HTTPS)
```

### Test Shows Success But GhE Reports Failure

**Cause:** SSH output pattern not recognized

**Debug:**
```bash
# Run with verbose output
ssh -vvv -T git@yourplatform.com 2>&1 | tee ssh_debug.log

# Check what the actual success message is
grep -i "authenticated\|welcome\|success" ssh_debug.log

# Report the pattern so it can be added to GhE
```

---

## Health Check Testing

Test all accounts at once:

```bash
ghe health
```

**Expected Output:**
```
╭─ Account Health Check ──────────────────────────────╮
│                                                      │
│  ✓ github-work (SSH)                                │
│    • SSH Key: /home/user/.ssh/id_ed25519_work       │
│    • Platform: GitHub (github.com)                  │
│    • Status: ✓ Key exists, permissions OK          │
│                                                      │
│  ✓ gitlab-personal (SSH)                            │
│    • SSH Key: /home/user/.ssh/gitlab_key            │
│    • Platform: GitLab (gitlab.com)                  │
│    • Status: ✓ Key exists, permissions OK          │
│                                                      │
│  ✓ bitbucket-work (Token)                           │
│    • Username: john                                 │
│    • Platform: Bitbucket (bitbucket.org)            │
│    • Status: ✓ Token configured                     │
│                                                      │
╰──────────────────────────────────────────────────────╯
```

---

## Platform Detection Testing

Test auto-detection from remote URLs:

```bash
# GitHub
cd ~/github-project
git remote -v
# origin  git@github.com:user/repo.git

ghe status
# Expected: Should detect GitHub

# GitLab
cd ~/gitlab-project
git remote -v
# origin  git@gitlab.com:user/repo.git

ghe status
# Expected: Should detect GitLab

# Self-hosted GitLab
cd ~/company-project
git remote -v
# origin  git@gitlab.company.com:user/repo.git

ghe status
# Expected: Should detect GitLab with custom domain
```

---

## Integration Testing Checklist

- [ ] Can add account for each platform (GitHub, GitLab, Bitbucket, Gitea)
- [ ] SSH test passes for each platform
- [ ] Can switch between accounts of same platform
- [ ] Can switch between different platforms
- [ ] SSH config updated correctly after switch
- [ ] Platform auto-detected from git remote URL
- [ ] Health check shows correct status for all accounts
- [ ] Activity log records all operations
- [ ] Token authentication works as alternative to SSH
- [ ] Self-hosted instances detected correctly
- [ ] Multiple accounts per platform work independently

---

## Continuous Testing

After code changes, run this quick test:

```bash
# 1. Test GitHub
ssh -T git@github.com && echo "✓ GitHub OK" || echo "✗ GitHub FAIL"

# 2. Test GitLab
ssh -T git@gitlab.com && echo "✓ GitLab OK" || echo "✗ GitLab FAIL"

# 3. Test Bitbucket
ssh -T git@bitbucket.org && echo "✓ Bitbucket OK" || echo "✗ Bitbucket FAIL"

# 4. Test GhE
ghe health

# 5. Test platform detection
cd /tmp
git clone git@github.com:user/repo.git test-repo
cd test-repo
ghe status
cd /tmp && rm -rf test-repo
```

---

## Reporting Issues

When reporting platform-specific issues, include:

1. Platform name and URL
2. Output of manual SSH test: `ssh -T git@platform.com`
3. Output of GhE test
4. Content of `~/.ssh/config` (remove sensitive paths if needed)
5. Output of `ghe status` and `ghe health`
6. OS and shell: `echo $SHELL` and `uname -a`

**Example Report:**

```
Platform: GitLab (gitlab.com)
Issue: SSH test shows success but GhE reports failure

Manual test output:
$ ssh -T git@gitlab.com
Welcome to GitLab, @myusername!

GhE test output:
✗ SSH connection test failed!

SSH Config:
Host gitlab.com
  HostName gitlab.com
  User git
  IdentityFile /home/user/.ssh/gitlab_key
  IdentitiesOnly yes

Environment:
- OS: Ubuntu 22.04
- Shell: /bin/bash
- GhE version: 1.0.1
```
