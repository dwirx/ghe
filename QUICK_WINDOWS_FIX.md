# Quick Windows Fix Guide 🪟

## 🚨 Common Issues & Quick Fixes

### Issue 1: "ENOENT: no such file or directory, mkdir"

**What happened:**
```
✖ Download failed: ENOENT: no such file or directory, mkdir
```

**Quick Fix:**
```powershell
# Update to latest version
npm update -g ghe

# Or reinstall
npm uninstall -g ghe
npm install -g ghe
```

**Why it happened:** Old version didn't handle Windows paths correctly.

---

### Issue 2: "Incorrect permissions (666), should be 600"

**What happened:**
```
✗ SSH: Incorrect permissions (666), should be 600 or 400
```

**Quick Fix:**
```powershell
# Run health check
ghe health

# When prompted, answer "Yes" to fix permissions automatically
```

**Manual Fix (if automatic fails):**
```powershell
# For private key
$key = "$env:USERPROFILE\.ssh\id_ed25519_username"
icacls $key /inheritance:r
icacls $key /grant:r "$env:USERNAME`:F"

# For SSH directory
icacls "$env:USERPROFILE\.ssh" /inheritance:r
icacls "$env:USERPROFILE\.ssh" /grant:r "$env:USERNAME`:(OI)(CI)F"
```

---

### Issue 3: Command Not Found

**What happened:**
```
'ghe' is not recognized as an internal or external command
```

**Quick Fix:**
```powershell
# Check if installed
npm list -g ghe

# Install if missing
npm install -g ghe

# Restart terminal
```

---

### Issue 4: SSH Connection Fails

**What happened:**
```
✗ SSH: Connection failed
```

**Quick Fix:**
```powershell
# 1. Check if OpenSSH is installed
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'

# 2. Install if missing
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0

# 3. Test SSH
ssh -T git@github.com

# 4. Add SSH key to GitHub
Get-Content "$env:USERPROFILE\.ssh\id_ed25519_username.pub" | clip
# Then paste at: https://github.com/settings/keys
```

---

### Issue 5: Git Not Found

**What happened:**
```
'git' is not recognized as an internal or external command
```

**Quick Fix:**
```powershell
# Install Git for Windows
winget install Git.Git

# Or download from: https://git-scm.com/download/win

# Restart terminal after installation
```

---

## 🔧 One-Time Setup

### For PowerShell Users (Recommended)

```powershell
# 1. Install ghe
npm install -g ghe

# 2. Run compatibility test
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/dwirx/ghe/main/test-windows.ps1" -OutFile "test-windows.ps1"
powershell -File test-windows.ps1

# 3. Setup first account
ghe
# Choose: ➕ Add account
```

### For CMD Users

```cmd
REM 1. Install ghe
npm install -g ghe

REM 2. Run compatibility test
curl -o test-windows.cmd https://raw.githubusercontent.com/dwirx/ghe/main/test-windows.cmd
test-windows.cmd

REM 3. Setup first account
ghe
```

### For Git Bash Users

```bash
# 1. Install ghe
npm install -g ghe

# 2. Setup first account
ghe
```

---

## 🏥 Health Check

**Run this anytime you have issues:**

```powershell
ghe health
```

This will:
- ✅ Check SSH keys
- ✅ Check tokens
- ✅ Verify permissions
- ✅ Offer to fix issues automatically

---

## 📊 System Check

**Verify your system is ready:**

```powershell
# Check Node.js
node --version

# Check Git
git --version

# Check SSH
ssh -V

# Check ghe
ghe --version

# View platform info
ghe info
```

---

## 🔍 Troubleshooting Steps

### Step 1: Update Everything
```powershell
npm update -g ghe
git --version  # Should be 2.x or higher
node --version # Should be 16.x or higher
```

### Step 2: Check Paths
```powershell
# SSH directory
dir "$env:USERPROFILE\.ssh"

# Config directory
dir "$env:APPDATA\github-switch"

# Git credentials
dir "$env:USERPROFILE\.git-credentials"
```

### Step 3: Fix Permissions
```powershell
ghe health
# Answer "Yes" to fix permissions
```

### Step 4: Test Connection
```powershell
# Test GitHub SSH
ssh -T git@github.com

# Test HTTPS
git ls-remote https://github.com/dwirx/ghe
```

### Step 5: Reinstall (Last Resort)
```powershell
npm uninstall -g ghe
npm cache clean --force
npm install -g ghe
```

---

## 💡 Pro Tips

### Tip 1: Use PowerShell 7+
```powershell
# Install PowerShell 7
winget install Microsoft.PowerShell

# Check version
pwsh --version
```

### Tip 2: Add to PATH
```powershell
# If ghe not found, check npm global path
npm config get prefix

# Add to PATH if needed (as Administrator)
$path = npm config get prefix
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$path", "User")
```

### Tip 3: Use Aliases
```powershell
# Add to PowerShell profile
echo "Set-Alias -Name gs -Value ghe" | Out-File -Append $PROFILE

# Reload profile
. $PROFILE

# Now you can use: gs
```

### Tip 4: Run as Administrator (if needed)
```powershell
# Right-click PowerShell → "Run as Administrator"
# Then run ghe commands
```

---

## 📚 More Help

- **Full Windows Guide:** [WINDOWS_SUPPORT.md](WINDOWS_SUPPORT.md)
- **Detailed Fixes:** [WINDOWS_FIXES_v1.0.7.md](WINDOWS_FIXES_v1.0.7.md)
- **General Help:** [README.md](README.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 🆘 Still Having Issues?

1. **Run diagnostics:**
   ```powershell
   powershell -File test-windows.ps1
   ```

2. **Check version:**
   ```powershell
   ghe --version
   # Should be 1.0.7 or higher
   ```

3. **Report bug:**
   - Go to: https://github.com/dwirx/ghe/issues
   - Include output from: `ghe info`
   - Include error message
   - Mention your Windows version

---

## ✅ Success Checklist

- [ ] `ghe --version` works
- [ ] `ghe info` shows correct platform
- [ ] `ghe health` shows no errors
- [ ] SSH connection test passes
- [ ] Can switch accounts successfully

---

**Last Updated:** January 4, 2025  
**Version:** 1.0.7+