# Debug Instructions for SSH Test Issues

## Problem
Bitbucket SSH test succeeds manually but GhUx reports failure.

## Steps to Debug

### 1. Run GhUx with Debug Output

```bash
cd ~/experiment/ghux
bun run index.ts
```

Then:
1. Choose "Test connection"
2. Select your Bitbucket account (`bitbucket.podsni`)
3. **Copy ALL the debug output** that appears, especially lines that start with `[DEBUG SSH Test]`

### 2. What to Look For

The debug output will show:
```
[DEBUG SSH Test] Host: bitbucket.org
[DEBUG SSH Test] Exit code: <number>
[DEBUG SSH Test] stdout: "<content>"
[DEBUG SSH Test] stderr: "<content>"
[DEBUG SSH Test] combined: "<content>"
[DEBUG SSH Test] Pattern match result: true/false
```

### 3. Send Me This Information

Copy and paste:
1. All the `[DEBUG SSH Test]` lines
2. The final result message (success or failure)
3. Any error messages you see

### 4. Expected Results

**For Bitbucket (should succeed):**
- Exit code: 0 or 1 (both can be success for Bitbucket)
- stdout or stderr should contain: "authenticated via ssh key"
- Pattern match result: true
- Final message: "✓ SSH authentication test passed!"

**For Gitea (expected to fail until key is added):**
- Exit code: 255
- stderr: "Permission denied (publickey)"
- Pattern match result: false
- Final message: "✗ SSH connection test failed!"

### 5. Manual Comparison

Run manual tests to compare:

```bash
# Bitbucket
ssh -T git@bitbucket.org 2>&1
echo "Exit code: $?"

# Gitea
ssh -T git@gitea.com 2>&1
echo "Exit code: $?"
```

## Quick Test Script

Save this as `test_ssh.sh` and run it:

```bash
#!/bin/bash

echo "=== Testing Bitbucket ==="
ssh -T git@bitbucket.org 2>&1
echo "Exit code: $?"
echo ""

echo "=== Testing Gitea ==="
ssh -T git@gitea.com 2>&1
echo "Exit code: $?"
echo ""

echo "=== Testing GitLab ==="
ssh -T git@gitlab.com 2>&1
echo "Exit code: $?"
echo ""

echo "=== Checking SSH Config ==="
cat ~/.ssh/config | grep -A 5 "Host bitbucket.org"
cat ~/.ssh/config | grep -A 5 "Host gitea.com"
```

Then run:
```bash
chmod +x test_ssh.sh
./test_ssh.sh
```

## What I Need

Please send me the output from:
1. Running GhUx test (with `[DEBUG SSH Test]` lines)
2. Running the manual `test_ssh.sh` script above

This will help me identify if:
- The regex pattern is not matching
- The exit code is unexpected
- Bun's `$` command is not capturing output correctly
- There's a timing or async issue

## For Gitea Setup

If you want Gitea to work, you need to:

1. Copy your public key:
   ```bash
   cat /home/ubuntu/.ssh/gitea-podsni.pub
   ```

2. Add it to Gitea:
   - If using gitea.com: https://gitea.com/user/settings/keys
   - If self-hosted: https://your-gitea-domain.com/user/settings/keys

3. Test manually:
   ```bash
   ssh -T git@gitea.com
   # Should show success message
   ```

4. Test in GhUx again

## Temporary Debug Build

The current code has debug logging enabled. Once we fix the issue, I'll remove the debug statements.