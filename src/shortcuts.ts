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
 * Shortcut definition interface
 */
interface ShortcutItem {
    command: string;
    equivalent: string;
    description: string;
    category: string;
    needsInput?: boolean;
    inputPlaceholder?: string;
    executable?: boolean;
}

/**
 * Get all available shortcuts
 */
function getAllShortcuts(): ShortcutItem[] {
    return [
        // Branch Viewing
        {
            command: "ghe gb",
            equivalent: "git branch",
            description: "Show local branches",
            category: "Branch Viewing",
            executable: true,
        },
        {
            command: "ghe gba",
            equivalent: "git branch -a",
            description: "Show all branches (local + remote)",
            category: "Branch Viewing",
            executable: true,
        },
        {
            command: "ghe gbr",
            equivalent: "git branch -r",
            description: "Show remote branches only",
            category: "Branch Viewing",
            executable: true,
        },
        {
            command: "ghe gsb",
            equivalent: "git show-branch",
            description: "Show branch comparison",
            category: "Branch Viewing",
            executable: true,
        },
        {
            command: "ghe gs",
            equivalent: "git status",
            description: "Show git status with current branch",
            category: "Branch Viewing",
            executable: true,
        },
        // Branch Creation
        {
            command: "ghe gbn <name>",
            equivalent: "git branch <name>",
            description: "Create new branch without switching",
            category: "Branch Creation",
            needsInput: true,
            inputPlaceholder: "feature/my-feature",
            executable: true,
        },
        {
            command: "ghe gcb <name>",
            equivalent: "git checkout -b <name>",
            description: "Create & switch to new branch",
            category: "Branch Creation",
            needsInput: true,
            inputPlaceholder: "feature/my-feature",
            executable: true,
        },
        {
            command: "ghe gsc <name>",
            equivalent: "git switch -c <name>",
            description: "Create & switch to new branch (modern)",
            category: "Branch Creation",
            needsInput: true,
            inputPlaceholder: "feature/my-feature",
            executable: true,
        },
        // Branch Switching
        {
            command: "ghe gco <name>",
            equivalent: "git checkout <name>",
            description: "Switch to branch",
            category: "Branch Switching",
            needsInput: true,
            inputPlaceholder: "main",
            executable: true,
        },
        {
            command: "ghe gsw <name>",
            equivalent: "git switch <name>",
            description: "Switch to branch (modern)",
            category: "Branch Switching",
            needsInput: true,
            inputPlaceholder: "main",
            executable: true,
        },
        {
            command: "ghe gback",
            equivalent: "git checkout -",
            description: "Switch to previous branch",
            category: "Branch Switching",
            executable: true,
        },
        // Fetch/Pull
        {
            command: "ghe gf",
            equivalent: "git fetch origin",
            description: "Fetch from origin",
            category: "Fetch/Pull",
            executable: true,
        },
        {
            command: "ghe gp",
            equivalent: "git pull",
            description: "Pull from remote",
            category: "Fetch/Pull",
            executable: true,
        },
        // Git Shortcuts
        {
            command: "ghe shove <message>",
            equivalent: "git add . && git commit -m <message> && git push",
            description: "Add, commit, and push with confirmation",
            category: "Git Shortcuts",
            needsInput: true,
            inputPlaceholder: "fix: bug in feature",
            executable: true,
        },
        {
            command: "ghe shovenc",
            equivalent: "git add . && git commit --allow-empty-message && git push",
            description: "Add, commit (empty msg), and push with confirmation",
            category: "Git Shortcuts",
            executable: true,
        },
        // Git Config
        {
            command: "ghe setname <name>",
            equivalent: "git config --global user.name <name>",
            description: "Set global git user.name",
            category: "Git Config",
            needsInput: true,
            inputPlaceholder: "John Doe",
            executable: true,
        },
        {
            command: "ghe setmail <email>",
            equivalent: "git config --global user.email <email>",
            description: "Set global git user.email",
            category: "Git Config",
            needsInput: true,
            inputPlaceholder: "john@example.com",
            executable: true,
        },
        {
            command: "ghe showconfig",
            equivalent: "git config --list",
            description: "Show all git configuration",
            category: "Git Config",
            executable: true,
        },
        // CLI Shortcuts
        {
            command: "ghe switch <account>",
            equivalent: "-",
            description: "Switch to specific account",
            category: "CLI Shortcuts",
            needsInput: true,
            inputPlaceholder: "work",
            executable: true,
        },
        {
            command: "ghe quick",
            equivalent: "-",
            description: "Quick switch menu (recent accounts)",
            category: "CLI Shortcuts",
            executable: true,
        },
        {
            command: "ghe status",
            equivalent: "-",
            description: "Show current repository status",
            category: "CLI Shortcuts",
            executable: true,
        },
        {
            command: "ghe list",
            equivalent: "-",
            description: "List all configured accounts",
            category: "CLI Shortcuts",
            executable: true,
        },
        {
            command: "ghe health",
            equivalent: "-",
            description: "Check health of all accounts",
            category: "CLI Shortcuts",
            executable: true,
        },
        {
            command: "ghe log",
            equivalent: "-",
            description: "View activity log",
            category: "CLI Shortcuts",
            executable: true,
        },
        {
            command: "ghe lazy",
            equivalent: "lazygit",
            description: "Launch lazygit (auto-installs if needed)",
            category: "CLI Shortcuts",
            executable: true,
        },
    ];
}

/**
 * Execute a shortcut command
 */
async function executeShortcut(
    shortcut: ShortcutItem,
    userInput?: string,
): Promise<void> {
    const { spawn } = await import("child_process");

    let command = shortcut.command;

    // Replace placeholder with user input
    if (shortcut.needsInput && userInput) {
        command = command.replace(/<[^>]+>/g, userInput);
    }

    showInfo(`Executing: ${colors.accent(command)}`);
    console.log("");

    // Parse command to get executable and args
    const parts = command.split(/\s+/);
    const executable = parts[0] || "";
    const args = parts.slice(1);

    return new Promise<void>((resolve, reject) => {
        const proc = spawn(executable, args, {
            cwd: process.cwd(),
            stdio: "inherit",
        });

        proc.on("exit", (code) => {
            console.log("");
            if (code === 0 || code === null) {
                showSuccess("Command completed successfully");
                resolve();
            } else {
                showError(`Command exited with code ${code}`);
                reject(new Error(`Command exited with code ${code}`));
            }
        });

        proc.on("error", (err) => {
            console.log("");
            showError(`Failed to execute command: ${err.message}`);
            reject(err);
        });
    });
}

/**
 * Interactive shortcuts browser with search and execute
 */
export async function showShortcutsInteractive(): Promise<void> {
    const shortcuts = getAllShortcuts();

    while (true) {
        console.log("");
        console.log(colors.primary("⚡ Shortcuts Browser"));
        console.log(colors.muted("═".repeat(80)));
        console.log("");

        // Build choices with search support
        const choices = shortcuts.map((s) => ({
            title: `${colors.success(s.command.padEnd(35))} ${colors.muted("→")} ${s.description}`,
            value: s,
            description: `${s.category} | ${s.equivalent}`,
        }));

        choices.push({
            title: colors.muted("🚪 Exit"),
            value: null,
            description: "Close shortcuts browser",
        });

        const { selectedShortcut } = await prompts({
            type: "autocomplete",
            name: "selectedShortcut",
            message: colors.accent("Search or select a shortcut:"),
            choices: choices,
            suggest: (input, choices) => {
                const inputLower = input.toLowerCase();
                return Promise.resolve(
                    choices.filter((choice) => {
                        if (!choice.value) return true; // Keep exit option
                        const s = choice.value as ShortcutItem;
                        return (
                            s.command.toLowerCase().includes(inputLower) ||
                            s.description.toLowerCase().includes(inputLower) ||
                            s.equivalent.toLowerCase().includes(inputLower) ||
                            s.category.toLowerCase().includes(inputLower)
                        );
                    }),
                );
            },
        });

        if (!selectedShortcut) {
            console.log("");
            showSuccess("Thank you for using GHE shortcuts! 👋");
            break;
        }

        const shortcut = selectedShortcut as ShortcutItem;

        // Show detailed info
        console.log("");
        console.log(colors.accent("▸ Shortcut Details"));
        console.log("");
        console.log(`  ${colors.text("Command:")} ${colors.success(shortcut.command)}`);
        console.log(`  ${colors.text("Equivalent:")} ${colors.muted(shortcut.equivalent)}`);
        console.log(`  ${colors.text("Description:")} ${shortcut.description}`);
        console.log(`  ${colors.text("Category:")} ${colors.accent(shortcut.category)}`);
        console.log("");

        // Ask for action
        const { action } = await prompts({
            type: "select",
            name: "action",
            message: "What would you like to do?",
            choices: [
                {
                    title: colors.success("▶️  Execute this command"),
                    value: "execute",
                    disabled: !shortcut.executable,
                },
                {
                    title: colors.accent("📋 Copy to clipboard"),
                    value: "copy",
                },
                {
                    title: colors.muted("🔙 Back to list"),
                    value: "back",
                },
            ],
        });

        if (!action || action === "back") {
            continue;
        }

        if (action === "copy") {
            // For now, just show the command
            console.log("");
            showSuccess(`Command: ${shortcut.command}`);
            showInfo("Copy this command to use it");
            console.log("");

            const { continuePrompt } = await prompts({
                type: "text",
                name: "continuePrompt",
                message: colors.muted("Press Enter to continue..."),
                initial: "",
            });
            continue;
        }

        if (action === "execute") {
            let userInput: string | undefined;

            // Get user input if needed
            if (shortcut.needsInput) {
                const { input } = await prompts({
                    type: "text",
                    name: "input",
                    message: `Enter ${shortcut.inputPlaceholder ? `value (e.g., ${shortcut.inputPlaceholder})` : "value"}:`,
                    validate: (value) =>
                        value.trim().length > 0
                            ? true
                            : "Input is required",
                });

                if (!input) {
                    showWarning("Command execution cancelled");
                    continue;
                }

                userInput = input;
            }

            // Confirm execution
            const { confirm } = await prompts({
                type: "confirm",
                name: "confirm",
                message: `Execute: ${shortcut.command.replace(/<[^>]+>/g, userInput || "<value>")}?`,
                initial: true,
            });

            if (!confirm) {
                showWarning("Command execution cancelled");
                continue;
            }

            // Execute
            try {
                await executeShortcut(shortcut, userInput);
            } catch (e) {
                // Error already displayed
            }

            console.log("");
            const { continuePrompt } = await prompts({
                type: "text",
                name: "continuePrompt",
                message: colors.muted("Press Enter to continue..."),
                initial: "",
            });
        }
    }
}

/**
 * Show all available shortcuts with descriptions and search functionality
 */
export async function showShortcuts(searchQuery?: string, interactive?: boolean): Promise<void> {
    // If interactive mode requested
    if (interactive) {
        return await showShortcutsInteractive();
    }

    const shortcuts = getAllShortcuts();

    // Filter shortcuts if search query provided
    let filteredShortcuts = shortcuts;
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredShortcuts = shortcuts.filter(
            (s) =>
                s.command.toLowerCase().includes(query) ||
                s.description.toLowerCase().includes(query) ||
                s.equivalent.toLowerCase().includes(query) ||
                s.category.toLowerCase().includes(query),
        );

        if (filteredShortcuts.length === 0) {
            showWarning(`No shortcuts found matching: "${searchQuery}"`);
            showInfo("Try a different search term or run 'ghe shortcuts' to see all");
            return;
        }
    }

    // Group by category
    const groupedShortcuts = filteredShortcuts.reduce(
        (acc, shortcut) => {
            if (!acc[shortcut.category]) {
                acc[shortcut.category] = [];
            }
            acc[shortcut.category]?.push(shortcut);
            return acc;
        },
        {} as Record<string, typeof shortcuts>,
    );

    console.log("");
    if (searchQuery) {
        console.log(colors.primary(`🔍 Search Results for: "${searchQuery}"`));
        console.log(colors.muted(`Found ${filteredShortcuts.length} shortcut(s)`));
    } else {
        console.log(colors.primary("⚡ Available Shortcuts"));
        console.log(colors.muted(`Total: ${shortcuts.length} shortcuts`));
    }
    console.log(colors.muted("═".repeat(80)));
    console.log("");

    // Display shortcuts by category
    for (const [category, items] of Object.entries(groupedShortcuts)) {
        console.log(colors.accent(`▸ ${category}`));
        console.log("");

        for (const item of items) {
            console.log(`  ${colors.success(item.command.padEnd(30))}`);
            console.log(
                `  ${colors.muted("→")} ${colors.text(item.equivalent)}`,
            );
            console.log(`  ${colors.muted(item.description)}`);
            console.log("");
        }
    }

    if (!searchQuery) {
        console.log(colors.muted("─".repeat(80)));
        console.log("");
        console.log(colors.accent("💡 Tips:"));
        console.log(`  • Interactive mode: ${colors.success("ghe shortcuts -i")} or ${colors.success("ghe shortcuts --interactive")}`);
        console.log(`  • Search shortcuts: ${colors.success("ghe shortcuts <query>")}`);
        console.log(`  • Example: ${colors.success("ghe shortcuts branch")}`);
        console.log(`  • Example: ${colors.success("ghe shortcuts fetch")}`);
        console.log("");
        console.log(colors.muted("In interactive mode, you can search, view details, and execute shortcuts!"));
        console.log("");
    }
}

/**
 * Launch lazygit - interactive terminal UI for git operations
 * Built-in lazygit with auto-download for cross-platform support
 */
export async function lazyGit(): Promise<void> {
    const cwd = process.cwd();

    // Check if we're in a git repository
    if (!(await isGitRepo(cwd))) {
        showError("Not in a git repository");
        showInfo("Navigate to a git repository first");
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

    // Get or download lazygit binary
    let lazygitPath: string;

    try {
        const { ensureLazygit, getLazygitVersion } = await import("./lazygitManager");
        lazygitPath = await ensureLazygit();

        // Show version info
        const version = await getLazygitVersion(lazygitPath);
        if (version !== "unknown") {
            console.log(colors.muted(`   lazygit version: ${version}`));
        }
        console.log("");
    } catch (error: any) {
        showError(`Failed to setup lazygit: ${error?.message || String(error)}`);
        process.exit(1);
    }

    // Launch lazygit in interactive mode
    const { spawn } = await import("child_process");

    const lazygitProcess = spawn(lazygitPath, [], {
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
