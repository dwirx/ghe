# Troubleshooting Guide - GhUx

## SSH Connection Issues

### SSH Test Fails After Configuration

If you see an error like:
```
✗ ✗ SSH connection test failed!
⚠ Make sure your SSH key is added to GitLab/GitHub/etc
```

Here are the steps to resolve it:

#### 1. Verify SSH Key Permissions
SSH requires strict permissions on your private key:

```bash
# Check current permissions
ls -la ~/.ssh/

# Fix permissions if needed
chmod 700 ~/.ssh
chmod 600 ~/.ssh/your_private_key
chmod 644 ~/.ssh/your_private_key.pub
```

#### 2. Verify SSH Key is Added to Your Git Platform

**For GitHub:**
1. Copy your public key:
   ```bash
   cat ~/.ssh/your_key.pub
   ```
2. Go to: https://github.com/settings/keys
3. Click "New SSH key"
4. Paste the key and save

**For GitLab:**
1. Copy your public key:
   ```bash
   cat ~/.ssh/your_key.pub
   ```
2. Go to: https://gitlab.com/-/profile/keys
3. Paste the key and save

**For Bitbucket:**
1. Copy your public key:
   ```bash
   cat ~/.ssh/your_key.pub
   ```
2. Go to: https://bitbucket.org/account/settings/ssh-keys/
3. Click "Add key"
4. Paste the key and save

**For Gitea/Self-hosted:**
1. Copy your public key:
   ```bash
   cat ~/.ssh/your_key.pub
   ```
2. Go to your Gitea instance → Settings → SSH / GPG Keys
3. Add your key

#### 3. Test SSH Connection Manually

Test the connection directly to see detailed error messages:

**For GitHub:**
```bash
ssh -T git@github.com
```
Expected output: `Hi username! You've successfully authenticated...`

**For GitLab:**
```bash
ssh -T git@gitlab.com
```
Expected output: `Welcome to GitLab, @username!`

**For Bitbucket:**
```bash
ssh -T git@bitbucket.org
```
Expected output: `authenticated via ssh key. You can use git to connect to Bitbucket. Shell access is disabled`

**For Gitea:**
```bash
ssh -T git@gitea.com
```
Expected output: `Hi there, username! You've successfully authenticated...` or similar

**For Custom Domain:**
```bash
ssh -T git@your-git-server.com
```

#### 4. Check SSH Config

Your `~/.ssh/config` should have entries like:

```
Host github.com
  HostName github.com
  User git
  IdentityFile /home/user/.ssh/id_ed25519_github
  IdentitiesOnly yes

Host gitlab.com
  HostName gitlab.com
  User git
  IdentityFile /home/user/.ssh/gitlab_podsni
  IdentitiesOnly yes
```

**Important:**
- `Host` should match the domain (e.g., `gitlab.com`, not an alias)
- `HostName` should be the actual server domain
- `IdentityFile` must point to your **private** key (not `.pub`)
- `IdentitiesOnly yes` prevents SSH from trying other keys

#### 5. Verify SSH Agent

If using SSH agent, ensure your key is loaded:

```bash
# Check loaded keys
ssh-add -l

# Add your key if missing
ssh-add ~/.ssh/your_private_key
```

#### 6. Debug SSH Connection

For detailed debugging output:

```bash
ssh -vvv -T git@github.com
# or
ssh -vvv -T git@gitlab.com
```

Look for lines like:
- `debug1: Offering public key:` - SSH is trying your key
- `debug1: Authentication succeeded` - Key accepted
- `Permission denied (publickey)` - Key not accepted/not added to platform

#### 7. Common Issues

**"Permission denied (publickey)"**
- SSH key not added to your account on the Git platform
- Wrong SSH key being used
- SSH key file permissions too open (should be 600)

**"Host key verification failed"**
- Remove the old host key: `ssh-keygen -R github.com` (or gitlab.com, etc)
- Accept the new fingerprint when connecting

**"Connection refused" or "Connection timeout"**
- Firewall blocking SSH port (22)
- Behind corporate proxy/VPN
- Server is down
- Try using HTTPS authentication instead

**"Could not resolve hostname"**
- DNS issue
- Typo in hostname
- Check your internet connection

#### 8. Alternative: Use HTTPS Authentication

If SSH continues to fail, switch to HTTPS with Personal Access Token:

1. In GhUx menu, choose "Add new account"
2. Select "Token (HTTPS)"
3. Generate a Personal Access Token from your Git platform:
   - GitHub: https://github.com/settings/tokens
   - GitLab: https://gitlab.com/-/profile/personal_access_tokens
   - Bitbucket: https://bitbucket.org/account/settings/app-passwords/
4. Enter your token when prompted

HTTPS tokens don't require SSH configuration and often work behind corporate firewalls.

---

## Platform Detection Issues

### Wrong Platform Detected

If GhUx detects the wrong Git platform:

1. **Manual Override:** When adding/editing account, select the correct platform from the list
2. **Custom Domain:** For self-hosted instances (e.g., `gitlab.company.com`), select the platform type and enter custom domain
3. **Check Remote URL:** Ensure your git remote URL is correct:
   ```bash
   git remote -v
   ```

### Self-Hosted Git Servers

For GitLab CE/EE, Gitea, or other self-hosted servers:

1. Add account in GhUx
2. When prompted for platform, select the correct type (GitLab, Gitea, etc)
3. When asked "Is this a custom domain?", select **Yes**
4. Enter your domain (e.g., `gitlab.company.com`)
5. Configure SSH or token as usual

---

## Git Credential Issues

### Token Not Working

If HTTPS token authentication fails:

1. **Verify token has correct permissions:**
   - GitHub: Needs `repo` scope at minimum
   - GitLab: Needs `read_repository` and `write_repository`
   - Bitbucket: Needs repository read/write access

2. **Check token expiration:**
   - Run `ghux health` to check token status
   - Regenerate expired tokens on your Git platform

3. **Check credential store:**
   ```bash
   cat ~/.git-credentials
   ```
   Should contain: `https://username:token@github.com`

4. **Test token manually:**
   ```bash
   curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
   ```

### Credential Helper Issues

If you see credential prompts repeatedly:

```bash
# Check current helper
git config --global credential.helper

# Should show "store" - if not, run:
git config --global credential.helper store
```

---

## General Troubleshooting

### Reset GhUx Configuration

If everything is broken, start fresh:

```bash
# Backup first
cp ~/.config/ghux/config.json ~/.config/ghux/config.json.backup

# Remove config
rm ~/.config/ghux/config.json

# Restart GhUx
ghux
```

### View Activity Log

Check what GhUx has been doing:

```bash
ghux log
```

This shows history of account switches, tests, and errors.

### Enable Verbose Output

For more detailed output:

```bash
# Run GhUx commands and check any error messages carefully
ghux health    # Check all accounts
ghux status    # Check current repo status
```

---

## Getting Help

If you're still stuck:

1. **Check Issues:** https://github.com/YOUR_REPO/ghux/issues
2. **Create Issue:** Provide:
   - Output of `ghux status`
   - Output of `ghux health`
   - Platform you're using (GitHub/GitLab/etc)
   - Error messages
   - OS and shell (`echo $SHELL`)
3. **Security:** Never share your private keys or tokens in issues!

---

## Quick Checklist

Before reporting an issue, verify:

- [ ] SSH key has correct permissions (600 for private, 644 for public)
- [ ] SSH key is added to Git platform account
- [ ] Can connect manually: `ssh -T git@github.com`
- [ ] `~/.ssh/config` has correct Host entry
- [ ] Platform is correctly detected in GhUx
- [ ] For tokens: token is valid and not expired
- [ ] For tokens: credential helper is set to "store"
- [ ] Running latest version: `ghux --version`
