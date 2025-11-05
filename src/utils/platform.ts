import * as os from "os";
import * as path from "path";
import * as fs from "fs";

// Platform detection
export const platform = {
    isWindows: os.platform() === "win32",
    isLinux: os.platform() === "linux",
    isMacOS: os.platform() === "darwin",
    isUnix: os.platform() !== "win32",
    type: os.platform(),
    arch: os.arch(),
    name: os.type(),
    release: os.release(),
};

// Permission cache to avoid repeated icacls calls on Windows (performance optimization)
interface PermissionCacheEntry {
    mode: number;
    timestamp: number;
}

const permissionCache = new Map<string, PermissionCacheEntry>();
const CACHE_TTL = 5000; // Cache for 5 seconds

function getCachedPermission(filepath: string): number | null {
    const cached = permissionCache.get(filepath);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.mode;
    }
    return null;
}

function setCachedPermission(filepath: string, mode: number): void {
    permissionCache.set(filepath, { mode, timestamp: Date.now() });
}

export function clearPermissionCache(filepath?: string): void {
    if (filepath) {
        permissionCache.delete(filepath);
    } else {
        permissionCache.clear();
    }
}

// Detect current shell environment
export function detectShell(): string {
    if (platform.isWindows) {
        // Check common Windows shell indicators
        if (process.env.PSModulePath) {
            return "powershell";
        }
        if (process.env.PROMPT && process.env.PROMPT.includes("$P$G")) {
            return "cmd";
        }
        if (process.env.SHELL?.includes("bash") || process.env.BASH) {
            return "bash"; // Git Bash, WSL, etc
        }
        if (process.env.ZSH_NAME) {
            return "zsh";
        }
        // Default to PowerShell for Windows (most common modern shell)
        return "powershell";
    }

    // Unix-like systems
    const shell = process.env.SHELL || "";
    if (shell.includes("bash")) return "bash";
    if (shell.includes("zsh")) return "zsh";
    if (shell.includes("fish")) return "fish";

    return shell || "bash";
}

// Cross-platform path handling
export function normalizePath(filepath: string): string {
    if (!filepath) return filepath;

    // Handle tilde expansion
    if (filepath.startsWith("~")) {
        filepath = filepath.replace(/^~/, os.homedir());
    }

    // Normalize path separators
    return path.normalize(filepath);
}

// Get home directory with proper handling
export function getHomeDirectory(): string {
    if (platform.isWindows) {
        // On Windows, prefer USERPROFILE over os.homedir() for consistency
        return process.env.USERPROFILE || process.env.HOME || os.homedir();
    }

    return os.homedir();
}

// Get SSH directory with platform-specific handling
export function getSshDirectory(): string {
    const homeDir = getHomeDirectory();

    if (platform.isWindows) {
        // Windows SSH directory - always use .ssh in user profile
        // This is where OpenSSH for Windows looks by default
        return path.join(homeDir, ".ssh");
    }

    return path.join(homeDir, ".ssh");
}

// Get config directory with XDG support on Linux
export function getConfigDirectory(appName: string = "ghe"): string {
    if (platform.isWindows) {
        // Windows: Use %APPDATA%
        const appData =
            process.env.APPDATA ||
            path.join(getHomeDirectory(), "AppData", "Roaming");
        return path.join(appData, appName);
    }

    if (platform.isLinux || platform.isMacOS) {
        // Linux/macOS: Use XDG_CONFIG_HOME or ~/.config
        const configHome =
            process.env.XDG_CONFIG_HOME ||
            path.join(getHomeDirectory(), ".config");
        return path.join(configHome, appName);
    }

    // Fallback
    return path.join(getHomeDirectory(), `.${appName}`);
}

// Expand environment variables and tilde
export function expandPath(filepath: string): string {
    if (!filepath) return filepath;

    // Expand environment variables
    if (platform.isWindows) {
        // Windows environment variables: %VAR%
        filepath = filepath.replace(/%([^%]+)%/g, (match, varName) => {
            return process.env[varName] || match;
        });
    } else {
        // Unix environment variables: $VAR or ${VAR}
        filepath = filepath.replace(/\$\{([^}]+)\}/g, (match, varName) => {
            return process.env[varName] || match;
        });
        filepath = filepath.replace(
            /\$([A-Z_][A-Z0-9_]*)/g,
            (match, varName) => {
                return process.env[varName] || match;
            },
        );
    }

    return normalizePath(filepath);
}

// Get Git credentials file path
export function getGitCredentialsPath(): string {
    if (platform.isWindows) {
        // Windows: typically in user profile
        return path.join(getHomeDirectory(), ".git-credentials");
    }

    return path.join(getHomeDirectory(), ".git-credentials");
}

// Check if a command exists in PATH
export function commandExists(command: string): boolean {
    try {
        if (platform.isWindows) {
            // On Windows, check common locations and PATH
            const { execSync } = require("child_process");
            execSync(`where ${command}`, { stdio: "ignore" });
            return true;
        } else {
            // On Unix systems
            const { execSync } = require("child_process");
            execSync(`which ${command}`, { stdio: "ignore" });
            return true;
        }
    } catch {
        return false;
    }
}

// Get shell command with proper escaping
export function getShellCommand(
    command: string,
    args: string[] = [],
): { command: string; args: string[] } {
    if (platform.isWindows) {
        // On Windows, some commands might need different handling
        if (
            command === "ssh" ||
            command === "ssh-keygen" ||
            command === "git"
        ) {
            // These should work directly if installed
            return { command, args };
        }

        // For other commands, might need cmd wrapper
        return { command: "cmd", args: ["/c", command, ...args] };
    }

    return { command, args };
}

// Set file permissions (Unix-style) with Windows compatibility
export function setFilePermissions(filepath: string, mode: number): boolean {
    if (!fs.existsSync(filepath)) {
        return false;
    }

    try {
        if (platform.isWindows) {
            // On Windows, use icacls to set permissions
            return setWindowsFilePermissions(filepath, mode);
        } else {
            // Unix-like systems - standard chmod
            fs.chmodSync(filepath, mode);
            return true;
        }
    } catch (error) {
        console.warn(`Failed to set permissions for ${filepath}:`, error);
        return false;
    }
}

// Windows-specific permission handling using icacls (optimized with timeout)
function setWindowsFilePermissions(filepath: string, mode: number): boolean {
    try {
        const { execSync } = require("child_process");
        const username =
            process.env.USERNAME || process.env.USER || "Administrator";

        // Timeout for icacls commands (3 seconds) to prevent hanging
        const timeout = 3000;

        // For private keys (mode 0o600 or 0o400), restrict to current user only
        if (mode === 0o600 || mode === 0o400) {
            // Optimization: Batch both commands together with && to reduce overhead
            const cmd = `icacls "${filepath}" /inheritance:r /grant:r "${username}:F"`;
            execSync(cmd, {
                stdio: "ignore",
                timeout,
            });

            // Update cache after successful operation
            clearPermissionCache(filepath);
            return true;
        }

        // For public files (mode 0o644), allow read for others
        if (mode === 0o644) {
            // Keep default permissions, just ensure it's readable
            clearPermissionCache(filepath);
            return true;
        }

        // For directories (mode 0o700)
        if (mode === 0o700) {
            const cmd = `icacls "${filepath}" /inheritance:r /grant:r "${username}:(OI)(CI)F"`;
            execSync(cmd, {
                stdio: "ignore",
                timeout,
            });
            clearPermissionCache(filepath);
            return true;
        }

        return true;
    } catch (error) {
        // If icacls fails, try attrib as fallback for basic protection
        try {
            const { execSync } = require("child_process");
            if (mode === 0o600 || mode === 0o400) {
                // Set read-only attribute with timeout
                execSync(`attrib +R "${filepath}"`, {
                    stdio: "ignore",
                    timeout: 2000,
                });
            }
            clearPermissionCache(filepath);
            return true;
        } catch {
            clearPermissionCache(filepath);
            return false;
        }
    }
}

// Check file permissions (returns mode for Unix, approximation for Windows)
export function getFilePermissions(filepath: string): number | null {
    try {
        if (!fs.existsSync(filepath)) {
            return null;
        }

        if (platform.isWindows) {
            // Check cache first to avoid expensive icacls call
            const cached = getCachedPermission(filepath);
            if (cached !== null) {
                return cached;
            }

            // On Windows, check if file is restricted to current user
            const mode = getWindowsFilePermissions(filepath);
            if (mode !== null) {
                setCachedPermission(filepath, mode);
            }
            return mode;
        } else {
            // Unix-like systems
            const stats = fs.statSync(filepath);
            return stats.mode & 0o777;
        }
    } catch {
        return null;
    }
}

// Windows-specific permission checking (optimized with timeout and better parsing)
function getWindowsFilePermissions(filepath: string): number {
    try {
        const { execSync } = require("child_process");
        const output = execSync(`icacls "${filepath}"`, {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "ignore"],
            timeout: 3000, // 3 second timeout to prevent hanging
        });

        // If only current user has access, approximate as 0o600
        // If others have read access, approximate as 0o644
        const lines = output.split("\n");
        const username = process.env.USERNAME || process.env.USER || "";

        let hasUserOnly = false;
        let hasOthers = false;
        let hasInheritance = false;

        // Optimized parsing - break early if we find "others"
        for (const line of lines) {
            const trimmed = line.trim();

            // Check for inheritance - inherited permissions mean not restricted
            if (trimmed.includes("(I)")) {
                hasInheritance = true;
                break; // Early exit - we know it's not restricted
            }

            if (
                trimmed.includes("Everyone") ||
                trimmed.includes("BUILTIN\\Users") ||
                trimmed.includes("NT AUTHORITY\\Authenticated Users")
            ) {
                hasOthers = true;
                break; // Early exit - we know it's not restricted
            }

            if (
                trimmed.includes(username) &&
                (trimmed.includes(":(F)") || trimmed.includes(":F"))
            ) {
                hasUserOnly = true;
            }
        }

        // If we have inheritance or others can access, it's not restricted
        if (hasInheritance || hasOthers) {
            return 0o644; // Public read
        }

        // If only user has access and no inheritance, it's private
        if (hasUserOnly) {
            return 0o600; // Private
        }

        // Default to assuming it's readable by others
        return 0o644;
    } catch {
        // Default to assuming it's readable by others (safe default)
        return 0o644;
    }
}

// Ensure directory exists with proper permissions
export function ensureDirectory(
    dirPath: string,
    mode: number = 0o755,
): boolean {
    try {
        // Skip if it's current directory or empty
        if (!dirPath || dirPath === "." || dirPath === "./") {
            return true;
        }

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Set permissions for the directory
        if (mode === 0o700) {
            setFilePermissions(dirPath, mode);
        }

        return true;
    } catch (error) {
        console.error(`Failed to create directory ${dirPath}:`, error);
        return false;
    }
}

// Platform-specific information
export function getPlatformInfo(): string {
    const shell = detectShell();
    const info = [
        `Platform: ${platform.type}`,
        `Architecture: ${platform.arch}`,
        `OS: ${platform.name} ${platform.release}`,
        `Shell: ${shell}`,
        `Home: ${getHomeDirectory()}`,
        `SSH Dir: ${getSshDirectory()}`,
        `Config Dir: ${getConfigDirectory()}`,
    ];

    return info.join("\n");
}

// Validate path is safe (no directory traversal)
export function isSafePath(filepath: string): boolean {
    const normalized = path.normalize(filepath);
    return (
        (!normalized.includes("..") && !path.isAbsolute(normalized)) ||
        path.isAbsolute(filepath)
    );
}

// Get temporary directory
export function getTempDirectory(): string {
    return os.tmpdir();
}

export default platform;
