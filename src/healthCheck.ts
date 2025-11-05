import * as fs from "fs";
import { exec, run } from "./utils/shell";
import type { Account, HealthStatus, GitPlatform } from "./types";
import { expandHome } from "./ssh";
import {
    getPlatformSshHost,
    getPlatformSshSuccessPattern,
    getPlatformApiUrl,
} from "./platformDetector";
import { platform, getFilePermissions } from "./utils/platform";

/**
 * Check if SSH key exists and has proper permissions
 */
export async function checkSshKey(
    keyPath: string,
): Promise<{ valid: boolean; error?: string }> {
    try {
        const fullPath = expandHome(keyPath);

        if (!fs.existsSync(fullPath)) {
            return { valid: false, error: "SSH key file not found" };
        }

        // Check permissions - use platform-aware function
        const mode = getFilePermissions(fullPath);

        if (mode !== null && mode !== 0o600 && mode !== 0o400) {
            // On Windows, permission checking is less strict
            if (platform.isWindows) {
                // On Windows, only warn if permissions are too open (644 means not properly restricted)
                // But don't repeatedly complain if user already tried to fix it
                if (mode === 0o644) {
                    // Double-check by trying to verify Windows ACLs more carefully
                    try {
                        const { execSync } = require("child_process");
                        const output = execSync(`icacls "${fullPath}"`, {
                            encoding: "utf8",
                            stdio: ["pipe", "pipe", "ignore"],
                        });

                        // If there's NO inheritance and user has exclusive access, consider it fixed
                        const hasNoInheritance = !output.includes("(I)");
                        const username =
                            process.env.USERNAME || process.env.USER || "";
                        const hasUserAccess = output.includes(username);
                        const hasOthers =
                            output.includes("Everyone") ||
                            output.includes("BUILTIN\\Users") ||
                            output.includes(
                                "NT AUTHORITY\\Authenticated Users",
                            );

                        // If properly restricted (no inheritance, user only), it's valid
                        if (hasNoInheritance && hasUserAccess && !hasOthers) {
                            // Permissions are actually OK, Windows just reports it differently
                            return { valid: true };
                        }
                    } catch {
                        // If we can't verify, assume it's OK on Windows
                        return { valid: true };
                    }

                    return {
                        valid: false,
                        error: `Permissions may be too open (${mode.toString(8)}), consider restricting access`,
                    };
                }
            } else {
                // Unix: strict permission check
                return {
                    valid: false,
                    error: `Incorrect permissions (${mode.toString(8)}), should be 600 or 400`,
                };
            }
        }

        // Check if key is readable
        try {
            fs.readFileSync(fullPath, "utf8");
        } catch {
            return { valid: false, error: "SSH key is not readable" };
        }

        return { valid: true };
    } catch (e: any) {
        return { valid: false, error: e?.message || String(e) };
    }
}

/**
 * Test SSH connection to git platform
 */
export async function testSshConnection(
    keyPath: string,
    platform: GitPlatform = "github",
    domain?: string,
): Promise<{ valid: boolean; error?: string }> {
    try {
        const fullPath = expandHome(keyPath);

        // Use platform detector for smart host resolution
        const host = getPlatformSshHost({ type: platform, domain });

        const result = await exec([
            "ssh",
            "-T",
            "-i",
            fullPath,
            "-o",
            "StrictHostKeyChecking=no",
            "-o",
            "UserKnownHostsFile=/dev/null",
            "-o",
            "LogLevel=ERROR",
            `git@${host}`,
        ]);

        // SSH test connections typically return exit code 1 with success message
        // Use platform-specific success patterns
        const output = result.stdout + result.stderr;

        // Check platform-specific success pattern
        const successPattern = getPlatformSshSuccessPattern(platform);
        if (successPattern.test(output)) {
            return { valid: true };
        }

        // Generic check - if we got here and no clear error
        if (result.code === 0 || result.code === 1) {
            return { valid: true };
        }

        return { valid: false, error: "SSH authentication failed" };
    } catch (e: any) {
        const msg = e?.message || String(e);
        if (msg.includes("Permission denied")) {
            return {
                valid: false,
                error: "Permission denied - SSH key not authorized",
            };
        }
        if (msg.includes("Could not resolve hostname")) {
            return { valid: false, error: "Cannot reach host" };
        }
        return { valid: false, error: msg };
    }
}

/**
 * Test token authentication
 */
export async function testTokenAuth(
    username: string,
    token: string,
    platform: GitPlatform = "github",
    apiUrl?: string,
): Promise<{ valid: boolean; error?: string; expiry?: string }> {
    try {
        // Use platform detector for smart API URL resolution
        const baseApiUrl = getPlatformApiUrl(platform, apiUrl);
        const url =
            platform === "github"
                ? `${baseApiUrl}/user`
                : platform === "gitlab"
                  ? `${baseApiUrl}/user`
                  : platform === "bitbucket"
                    ? `${baseApiUrl}/user`
                    : platform === "gitea"
                      ? `${baseApiUrl}/user`
                      : apiUrl || `${baseApiUrl}/user`;

        let authHeader = "";
        if (platform === "github" || platform === "gitea") {
            authHeader = `Authorization: token ${token}`;
        } else if (platform === "gitlab") {
            authHeader = `PRIVATE-TOKEN: ${token}`;
        } else if (platform === "bitbucket") {
            authHeader = `Authorization: Bearer ${token}`;
        }

        const result = await exec([
            "curl",
            "-s",
            "-w",
            "\n%{http_code}",
            "-H",
            authHeader,
            url,
        ]);

        const lines = result.stdout.trim().split("\n");
        const httpCode = lines[lines.length - 1];
        const body = lines.slice(0, -1).join("\n");

        if (httpCode === "200") {
            // Try to parse expiry for GitHub tokens
            if (platform === "github") {
                try {
                    // Check token scope and expiry via GitHub API
                    const scopeResult = await exec([
                        "curl",
                        "-s",
                        "-I",
                        "-H",
                        `Authorization: token ${token}`,
                        "https://api.github.com/user",
                    ]);

                    const expiryMatch = scopeResult.stdout.match(
                        /github-authentication-token-expiration: (.+)/i,
                    );
                    if (expiryMatch) {
                        return { valid: true, expiry: expiryMatch[1].trim() };
                    }
                } catch {
                    // Ignore expiry check errors
                }
            }

            return { valid: true };
        }

        if (httpCode === "401") {
            return { valid: false, error: "Invalid or expired token" };
        }

        if (httpCode === "403") {
            return { valid: false, error: "Token lacks required permissions" };
        }

        return { valid: false, error: `HTTP ${httpCode}` };
    } catch (e: any) {
        return { valid: false, error: e?.message || String(e) };
    }
}

/**
 * Perform health check on a single account
 */
export async function checkAccountHealth(
    account: Account,
): Promise<HealthStatus> {
    const status: HealthStatus = {
        accountName: account.name,
        lastChecked: new Date().toISOString(),
    };

    const platform = account.platform?.type || "github";
    const domain = account.platform?.domain;

    // Check SSH if configured
    if (account.ssh?.keyPath) {
        const keyCheck = await checkSshKey(account.ssh.keyPath);

        if (keyCheck.valid) {
            const sshTest = await testSshConnection(
                account.ssh.keyPath,
                platform,
                domain,
            );
            status.sshValid = sshTest.valid;
            status.sshError = sshTest.error;
        } else {
            status.sshValid = false;
            status.sshError = keyCheck.error;
        }
    }

    // Check token if configured
    if (account.token?.username && account.token?.token) {
        const tokenTest = await testTokenAuth(
            account.token.username,
            account.token.token,
            platform,
            account.platform?.apiUrl,
        );
        status.tokenValid = tokenTest.valid;
        status.tokenError = tokenTest.error;
        status.tokenExpiry = tokenTest.expiry;
    }

    return status;
}

/**
 * Check health of all accounts
 */
export async function checkAllAccountsHealth(
    accounts: Account[],
): Promise<HealthStatus[]> {
    const results: HealthStatus[] = [];

    for (const account of accounts) {
        try {
            const status = await checkAccountHealth(account);
            results.push(status);
        } catch (e: any) {
            results.push({
                accountName: account.name,
                lastChecked: new Date().toISOString(),
                sshValid: false,
                tokenValid: false,
                sshError: e?.message || String(e),
                tokenError: e?.message || String(e),
            });
        }
    }

    return results;
}

/**
 * Get summary of health status
 */
export function getHealthSummary(statuses: HealthStatus[]): {
    total: number;
    healthy: number;
    warnings: number;
    errors: number;
} {
    const summary = {
        total: statuses.length,
        healthy: 0,
        warnings: 0,
        errors: 0,
    };

    for (const status of statuses) {
        const hasSsh = status.sshValid !== undefined;
        const hasToken = status.tokenValid !== undefined;

        const sshOk = !hasSsh || status.sshValid === true;
        const tokenOk = !hasToken || status.tokenValid === true;

        if (sshOk && tokenOk) {
            summary.healthy++;
        } else if (status.sshValid === false && status.tokenValid === false) {
            summary.errors++;
        } else {
            summary.warnings++;
        }

        // Check for expiring tokens (within 7 days)
        if (status.tokenExpiry) {
            try {
                const expiryDate = new Date(status.tokenExpiry);
                const daysUntilExpiry =
                    (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                if (daysUntilExpiry < 7 && daysUntilExpiry > 0) {
                    summary.warnings++;
                }
            } catch {
                // Ignore date parse errors
            }
        }
    }

    return summary;
}
