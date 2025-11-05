import * as fs from "fs";
import * as path from "path";
import prompts from "prompts";
import type { AppConfig, Account } from "./types";
import { loadConfig, saveConfig } from "./config";
import { isGitRepo, getCurrentRemoteInfo, getCurrentGitUser } from "./git";
import { detectActiveAccount } from "./flows";
import {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    colors,
} from "./utils/ui";
import { run } from "./utils/shell";
import { logActivity } from "./activityLog";
import { getPlatformName, getPlatformIcon } from "./platformDetector";

/**
 * Quick switch - show recent accounts for fast switching
 */
export async function quickSwitch(): Promise<void> {
    const cfg = loadConfig();
    const cwd = process.cwd();

    if (!(await isGitRepo(cwd))) {
        showError("Not in a git repository");
        process.exit(1);
    }

    if (cfg.accounts.length === 0) {
        showError("No accounts configured. Run 'ghe' to add accounts.");
        process.exit(1);
    }

    // Get recent accounts from activity log
    const { getRecentActivity } = await import("./activityLog");
    const recentActivity = getRecentActivity(10);
    const recentAccountNames = [
        ...new Set(recentActivity.map((a) => a.accountName)),
    ];

    // Sort accounts: recent first, then alphabetically
    const sortedAccounts = cfg.accounts.sort((a, b) => {
        const aIndex = recentAccountNames.indexOf(a.name);
        const bIndex = recentAccountNames.indexOf(b.name);

        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.name.localeCompare(b.name);
    });

    const currentAccount = await detectActiveAccount(cfg.accounts, cwd);

    const { account } = await prompts({
        type: "select",
        name: "account",
        message: "Quick switch to account:",
        choices: sortedAccounts.map((acc) => ({
            title: `${acc.name}${currentAccount === acc.name ? " (current)" : ""}${recentAccountNames.includes(acc.name) ? " ⭐" : ""}`,
            value: acc.name,
            description:
                `${acc.gitUserName || ""} ${acc.gitEmail || ""}`.trim(),
        })),
    });

    if (!account) {
        process.exit(0);
    }

    const selectedAccount = cfg.accounts.find((a) => a.name === account);
    if (!selectedAccount) {
        showError("Account not found");
        process.exit(1);
    }

    // Import and use existing switch logic
    const { switchForCurrentRepo } = await import("./flows");
    await switchForCurrentRepo(cfg);
}

/**
 * Switch to specific account by name
 */
export async function switchToAccount(accountName: string): Promise<void> {
    const cfg = loadConfig();
    const cwd = process.cwd();

    if (!(await isGitRepo(cwd))) {
        showError("Not in a git repository");
        process.exit(1);
    }

    const account = cfg.accounts.find(
        (a) => a.name.toLowerCase() === accountName.toLowerCase(),
    );
    if (!account) {
        showError(`Account '${accountName}' not found`);
        showInfo("Available accounts:");
        cfg.accounts.forEach((a) => console.log(`  - ${a.name}`));
        process.exit(1);
    }

    // Import and use existing switch logic
    const { switchForCurrentRepo } = await import("./flows");
    await switchForCurrentRepo(cfg);
}

/**
 * Show current repository status
 */
export async function showStatus(): Promise<void> {
    const cfg = loadConfig();
    const cwd = process.cwd();

    if (!(await isGitRepo(cwd))) {
        showError("Not in a git repository");
        process.exit(1);
    }

    console.log("");
    console.log(colors.primary("📊 Repository Status"));
    console.log(colors.muted("─".repeat(50)));

    const [remoteInfo, gitUser, activeAccount] = await Promise.all([
        getCurrentRemoteInfo(cwd),
        getCurrentGitUser(cwd),
        detectActiveAccount(cfg.accounts, cwd),
    ]);

    // Repository info
    if (remoteInfo?.repoPath) {
        console.log(`${colors.accent("Repository:")} ${remoteInfo.repoPath}`);
        const [owner] = remoteInfo.repoPath.split("/");
        if (owner) {
            console.log(`${colors.accent("Owner:")} ${owner}`);
        }
    } else {
        console.log(colors.warning("No origin remote configured"));
    }

    // Remote URL
    if (remoteInfo?.remoteUrl) {
        console.log(`${colors.accent("Remote URL:")} ${remoteInfo.remoteUrl}`);
    }

    // Platform info
    if (remoteInfo?.platform) {
        const platformIcon = getPlatformIcon(remoteInfo.platform.type);
        const platformName = getPlatformName(remoteInfo.platform.type);
        console.log(
            `${colors.accent("Platform:")} ${platformIcon} ${platformName}`,
        );
        if (remoteInfo.platform.domain) {
            console.log(
                `${colors.accent("Domain:")} ${remoteInfo.platform.domain}`,
            );
        }
    }

    // Auth type
    if (remoteInfo?.authType) {
        console.log(
            `${colors.accent("Auth Type:")} ${remoteInfo.authType.toUpperCase()}`,
        );
    }

    console.log("");

    // Git identity
    console.log(colors.primary("👤 Git Identity"));
    console.log(colors.muted("─".repeat(50)));
    if (gitUser) {
        console.log(
            `${colors.accent("Name:")} ${gitUser.userName || colors.muted("Not set")}`,
        );
        console.log(
            `${colors.accent("Email:")} ${gitUser.userEmail || colors.muted("Not set")}`,
        );
    } else {
        console.log(colors.warning("Git identity not configured"));
    }

    console.log("");

    // Active account
    console.log(colors.primary("🔐 Active Account"));
    console.log(colors.muted("─".repeat(50)));
    if (activeAccount) {
        const account = cfg.accounts.find((a) => a.name === activeAccount);
        console.log(
            `${colors.accent("Account:")} ${colors.success(activeAccount)}`,
        );
        if (account) {
            if (account.ssh) {
                console.log(
                    `${colors.accent("SSH Key:")} ${account.ssh.keyPath}`,
                );
            }
            if (account.token) {
                console.log(
                    `${colors.accent("Token User:")} ${account.token.username}`,
                );
            }
            if (account.platform) {
                const platformIcon = getPlatformIcon(account.platform.type);
                const platformName = getPlatformName(account.platform.type);
                console.log(
                    `${colors.accent("Platform:")} ${platformIcon} ${platformName}`,
                );
                if (account.platform.domain) {
                    console.log(
                        `${colors.accent("Domain:")} ${account.platform.domain}`,
                    );
                }
            }
        }
    } else {
        console.log(colors.warning("Could not detect active account"));
    }

    console.log("");

    // Branch info
    try {
        const branch = await run(["git", "branch", "--show-current"], { cwd });
        if (branch.trim()) {
            console.log(colors.primary("🌿 Current Branch"));
            console.log(colors.muted("─".repeat(50)));
            console.log(`${colors.accent("Branch:")} ${branch.trim()}`);
            console.log("");
        }
    } catch {
        // Ignore branch errors
    }
}

/**
 * Git add, commit, and optional push with confirmation
 */
export async function shove(message: string): Promise<void> {
    const cwd = process.cwd();

    if (!(await isGitRepo(cwd))) {
        showError("Not in a git repository");
        process.exit(1);
    }

    if (!message || message.trim() === "") {
        showError("Commit message is required");
        showInfo("Usage: ghe shove <commit message>");
        process.exit(1);
    }

    try {
        // Git add
        showInfo("Adding files...");
        await run(["git", "add", "."], { cwd });
        showSuccess("Files added");

        // Git commit
        showInfo(`Committing with message: "${message}"`);
        await run(["git", "commit", "-m", message], { cwd });
        showSuccess("Committed successfully");

        // Confirm push
        const { shouldPush } = await prompts({
            type: "confirm",
            name: "shouldPush",
            message: "Push to origin?",
            initial: true,
        });

        if (shouldPush) {
            showInfo("Pushing to origin...");
            await run(["git", "push", "origin"], { cwd });
            showSuccess("Pushed successfully");

            // Log activity
            const cfg = loadConfig();
            const activeAccount = await detectActiveAccount(cfg.accounts, cwd);
            const remoteInfo = await getCurrentRemoteInfo(cwd);

            if (activeAccount) {
                logActivity({
                    action: "switch",
                    accountName: activeAccount,
                    repoPath: remoteInfo?.repoPath,
                    method: remoteInfo?.authType === "ssh" ? "ssh" : "token",
                    success: true,
                });
            }
        } else {
            showWarning("Push cancelled");
        }
    } catch (e: any) {
        showError(`Operation failed: ${e?.message || String(e)}`);
        process.exit(1);
    }
}

/**
 * Git add, commit with empty message, and optional push
 */
export async function shoveNoCommit(): Promise<void> {
    const cwd = process.cwd();

    if (!(await isGitRepo(cwd))) {
        showError("Not in a git repository");
        process.exit(1);
    }

    try {
        // Git add
        showInfo("Adding files...");
        await run(["git", "add", "."], { cwd });
        showSuccess("Files added");

        // Git commit with empty message
        showInfo("Committing with empty message...");
        await run(["git", "commit", "--allow-empty-message", "-m", ""], {
            cwd,
        });
        showSuccess("Committed successfully");

        // Confirm push
        const { shouldPush } = await prompts({
            type: "confirm",
            name: "shouldPush",
            message: "Push to origin?",
            initial: true,
        });

        if (shouldPush) {
            showInfo("Pushing to origin...");
            await run(["git", "push", "origin"], { cwd });
            showSuccess("Pushed successfully");

            // Log activity
            const cfg = loadConfig();
            const activeAccount = await detectActiveAccount(cfg.accounts, cwd);
            const remoteInfo = await getCurrentRemoteInfo(cwd);

            if (activeAccount) {
                logActivity({
                    action: "switch",
                    accountName: activeAccount,
                    repoPath: remoteInfo?.repoPath,
                    method: remoteInfo?.authType === "ssh" ? "ssh" : "token",
                    success: true,
                });
            }
        } else {
            showWarning("Push cancelled");
        }
    } catch (e: any) {
        showError(`Operation failed: ${e?.message || String(e)}`);
        process.exit(1);
    }
}

/**
 * List all available accounts
 */
export async function listAccounts(): Promise<void> {
    const cfg = loadConfig();

    if (cfg.accounts.length === 0) {
        showWarning("No accounts configured");
        showInfo("Run 'ghe' to add accounts");
        process.exit(0);
    }

    console.log("");
    console.log(colors.primary("📋 Configured Accounts"));
    console.log(colors.muted("─".repeat(50)));

    for (const account of cfg.accounts) {
        console.log("");
        console.log(colors.accent(`▸ ${account.name}`));

        if (account.gitUserName) {
            console.log(`  ${colors.muted("User:")} ${account.gitUserName}`);
        }
        if (account.gitEmail) {
            console.log(`  ${colors.muted("Email:")} ${account.gitEmail}`);
        }
        if (account.ssh) {
            console.log(`  ${colors.muted("SSH:")} ${account.ssh.keyPath}`);
        }
        if (account.token) {
            console.log(
                `  ${colors.muted("Token:")} ${account.token.username}`,
            );
        }
        if (account.platform) {
            const platformIcon = getPlatformIcon(account.platform.type);
            const platformName = getPlatformName(account.platform.type);
            console.log(
                `  ${colors.muted("Platform:")} ${platformIcon} ${platformName}`,
            );
            if (account.platform.domain) {
                console.log(
                    `  ${colors.muted("Domain:")} ${account.platform.domain}`,
                );
            }
        }
    }

    console.log("");
}

/**
 * Launch lazygit - interactive terminal UI for git operations
 */
export async function lazyGit(): Promise<void> {
    const cwd = process.cwd();

    // Check if we're in a git repository
    if (!(await isGitRepo(cwd))) {
        showError("Not in a git repository");
        showInfo("Navigate to a git repository first");
        process.exit(1);
    }

    // Check if lazygit is installed
    const { exec } = await import("./utils/shell");
    const { code } = await exec(["which", "lazygit"]);

    if (code !== 0) {
        showError("lazygit is not installed");
        console.log("");
        showInfo("Install lazygit:");
        console.log("");
        console.log("  macOS:   brew install lazygit");
        console.log("  Ubuntu:  sudo apt install lazygit");
        console.log("  Arch:    sudo pacman -S lazygit");
        console.log("  Fedora:  sudo dnf install lazygit");
        console.log("");
        console.log("Or visit: https://github.com/jesseduffield/lazygit");
        console.log("");
        process.exit(1);
    }

    // Show current account info
    const cfg = loadConfig();
    const activeAccount = await detectActiveAccount(cfg.accounts, cwd);
    const gitUser = await getCurrentGitUser(cwd);

    if (activeAccount) {
        console.log("");
        console.log(colors.success(`🚀 Launching lazygit with account: ${activeAccount}`));
        if (gitUser?.userName) {
            console.log(colors.muted(`   User: ${gitUser.userName}`));
        }
        if (gitUser?.userEmail) {
            console.log(colors.muted(`   Email: ${gitUser.userEmail}`));
        }
        console.log("");
    } else {
        console.log("");
        console.log(colors.warning("⚠️  No GHE account detected for this repository"));
        console.log(colors.muted("   Launching lazygit with current git config"));
        console.log("");
    }

    // Launch lazygit in interactive mode
    const { spawn } = await import("child_process");

    const lazygitProcess = spawn("lazygit", [], {
        cwd,
        stdio: "inherit",
    });

    // Wait for lazygit to exit
    await new Promise<void>((resolve, reject) => {
        lazygitProcess.on("exit", (code) => {
            if (code === 0 || code === null) {
                resolve();
            } else {
                reject(new Error(`lazygit exited with code ${code}`));
            }
        });

        lazygitProcess.on("error", (err) => {
            reject(err);
        });
    });
}
