# Update Checker Feature

## Overview

GhE now includes an automatic update checker that notifies you when a new version is available. This ensures you're always using the latest features and bug fixes.

## How It Works

### Automatic Check on Startup

Every time you run `ghe`, the application automatically checks for updates in the background:

- **Check Interval**: Once every 24 hours (cached)
- **Non-blocking**: Doesn't slow down the application startup
- **Silent on Error**: If the check fails, it won't interrupt your workflow

### Update Notification

When a new version is available, you'll see a beautiful notification box with:

- Current version vs. latest version
- Update type indicator:
  - 🚀 **Major** update (e.g., 1.0.0 → 2.0.0) - Red highlight
  - ✨ **Minor** update (e.g., 1.0.0 → 1.1.0) - Yellow highlight  
  - 🔧 **Patch** update (e.g., 1.0.0 → 1.0.1) - Green highlight
- Installation commands for multiple package managers
- Link to changelog

### Example Notification

```
╭─────────────────── Update Available ───────────────────╮
│                                                         │
│  🚀 Update available: 1.0.0 → 2.0.0                   │
│                                                         │
│  Run to update:                                         │
│  npm install -g ghe                                    │
│                                                         │
│  Or with specific package manager:                      │
│  yarn global add ghe                                   │
│  pnpm add -g ghe                                       │
│  bun install -g ghe                                    │
│                                                         │
│  Changelog: https://github.com/dwirx/ghe/releases     │
│                                                         │
╰─────────────────────────────────────────────────────────╯
```

## Manual Update Check

You can manually check for updates at any time using the interactive menu:

1. Run `ghe`
2. Select "🔄 Check for updates" from the main menu
3. The app will force check (ignoring cache) and show results

## Updating GhE

### Using npm (recommended)

```bash
npm install -g ghe
```

### Using yarn

```bash
yarn global add ghe
```

### Using pnpm

```bash
pnpm add -g ghe
```

### Using bun

```bash
bun install -g ghe
```

## Configuration

The update checker uses these default settings:

- **Update Check Interval**: 24 hours
- **Cache Location**: `~/.config/configstore/update-notifier-ghe.json`
- **Network Timeout**: 5 seconds
- **Show Notification**: Enabled by default

## Privacy

The update checker:

- Only connects to npm registry (registry.npmjs.org)
- Does NOT collect or send any user data
- Does NOT track usage statistics
- Only checks the published package version

## Disabling Update Checks

If you want to disable automatic update checks, you can:

### Option 1: Environment Variable

```bash
export NO_UPDATE_NOTIFIER=1
```

Add this to your `~/.bashrc`, `~/.zshrc`, or equivalent shell config file.

### Option 2: Remove Package (not recommended)

```bash
cd ~/.config/configstore/
rm update-notifier-ghe.json
```

Note: The check will resume on next run.

## Technical Details

### Dependencies

- `update-notifier`: Industry-standard npm package for update notifications
- Version checking is done via npm registry API
- Follows semantic versioning (semver) standards

### Cache Strategy

- Update information is cached for 24 hours
- Cache is stored in user's config directory
- Prevents excessive network requests
- Respects `updateCheckInterval` setting

### Error Handling

- Network failures are handled silently
- Parsing errors don't interrupt the application
- Timeout after 5 seconds to prevent hanging
- Graceful fallback to continue without update check

## Troubleshooting

### Update notification not showing

1. Check if you've seen the notification in the last 24 hours (cached)
2. Force check using "Check for updates" menu option
3. Verify internet connection
4. Check if `NO_UPDATE_NOTIFIER` environment variable is set

### Cannot connect to npm registry

- Check your internet connection
- Verify firewall/proxy settings
- Try accessing https://registry.npmjs.org/ghe manually

### Cache issues

Clear the cache file:

```bash
rm ~/.config/configstore/update-notifier-ghe.json
```

## Related Files

- `src/utils/updateChecker.ts` - Update checker implementation
- `src/cli.ts` - Integration with main CLI
- `package.json` - Package metadata and dependencies

## See Also

- [Changelog](./CHANGELOG.md) - Version history
- [Installation Guide](./README.md#installation) - How to install GhE
- [GitHub Releases](https://github.com/dwirx/ghe/releases) - Release notes