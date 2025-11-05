import updateNotifier from "update-notifier";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { colors, showBox } from "./ui";

// Get package.json path
function getPackageJson() {
    try {
        // Try to read from the project root
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const pkgPath = join(__dirname, "../../package.json");
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        return pkg;
    } catch (error) {
        // Fallback to hardcoded values if package.json can't be read
        return {
            name: "ghux",
            version: "1.0.0",
        };
    }
}

export interface UpdateInfo {
    current: string;
    latest: string;
    type: "major" | "minor" | "patch" | "latest" | "prerelease" | "build";
    name: string;
}

/**
 * Check for updates and show notification if available
 * @param options Configuration options
 */
export function checkForUpdates(
    options: {
        updateCheckInterval?: number; // in milliseconds, default: 1 day
        showNotification?: boolean; // default: true
    } = {},
): UpdateInfo | null {
    const {
        updateCheckInterval = 1000 * 60 * 60 * 24, // 24 hours
        showNotification = true,
    } = options;

    try {
        const pkg = getPackageJson();

        const notifier = updateNotifier({
            pkg,
            updateCheckInterval,
            shouldNotifyInNpmScript: false,
        });

        if (notifier.update && showNotification) {
            const { current, latest, type } = notifier.update;

            showUpdateNotification({
                current,
                latest,
                type,
                name: pkg.name,
            });

            return { current, latest, type, name: pkg.name };
        }

        return notifier.update
            ? {
                  current: notifier.update.current,
                  latest: notifier.update.latest,
                  type: notifier.update.type,
                  name: pkg.name,
              }
            : null;
    } catch (error) {
        // Silently fail - don't interrupt the user experience
        return null;
    }
}

/**
 * Show update notification with custom styling
 */
function showUpdateNotification(update: UpdateInfo) {
    const { current, latest, type, name } = update;

    let typeColor = colors.accent;
    let emoji = "📦";

    if (type === "major") {
        typeColor = colors.error;
        emoji = "🚀";
    } else if (type === "minor") {
        typeColor = colors.warning;
        emoji = "✨";
    } else if (type === "patch") {
        typeColor = colors.success;
        emoji = "🔧";
    } else {
        typeColor = colors.accent;
        emoji = "📦";
    }

    const message = [
        `${emoji} Update available: ${colors.muted(current)} → ${typeColor(latest)}`,
        ``,
        `${colors.text("Run to update:")}`,
        `${colors.primary("npm install -g " + name)}`,
        ``,
        `${colors.muted("Or with specific package manager:")}`,
        `${colors.secondary("yarn global add " + name)}`,
        `${colors.secondary("pnpm add -g " + name)}`,
        `${colors.secondary("bun install -g " + name)}`,
        ``,
        `${colors.text("Changelog:")} ${colors.accent("https://github.com/dwirx/ghux/releases")}`,
    ].join("\n");

    showBox(message, {
        title: "Update Available",
        type: type === "major" ? "warning" : "info",
        padding: 1,
    });

    console.log(); // Add spacing
}

/**
 * Force check for updates (ignores cache)
 */
export async function forceCheckUpdate(): Promise<UpdateInfo | null> {
    try {
        const pkg = getPackageJson();

        const notifier = updateNotifier({
            pkg,
            updateCheckInterval: 0, // Force check
            shouldNotifyInNpmScript: false,
        });

        // Manually check for updates
        await notifier.fetchInfo();

        if (notifier.update) {
            const { current, latest, type } = notifier.update;

            showUpdateNotification({
                current,
                latest,
                type,
                name: pkg.name,
            });

            return { current, latest, type, name: pkg.name };
        } else {
            showBox(
                `${colors.success("✓")} You're using the latest version: ${colors.accent(pkg.version)}`,
                {
                    title: "Up to Date",
                    type: "success",
                },
            );
            return null;
        }
    } catch (error: any) {
        showBox(
            `${colors.error("✗")} Could not check for updates\n${colors.muted(error?.message || String(error))}`,
            {
                title: "Update Check Failed",
                type: "error",
            },
        );
        return null;
    }
}

/**
 * Get current version
 */
export function getCurrentVersion(): string {
    try {
        const pkg = getPackageJson();
        return pkg.version;
    } catch {
        return "1.0.0";
    }
}
