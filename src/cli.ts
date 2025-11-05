import prompts from "prompts";
import { loadConfig } from "./config";
import {
    addAccountFlow,
    listAccounts,
    removeAccountFlow,
    switchForCurrentRepo,
    chooseAccount,
    detectActiveAccount,
} from "./flows";
import { generateSshKey } from "./ssh";
import { getCurrentGitUser, getCurrentRemoteInfo, isGitRepo } from "./git";
import {
    showTitle,
    showSection,
    stylePrompt,
    showSuccess,
    showError,
    showSeparator,
    showWarning,
    showBox,
    colors,
} from "./utils/ui";
import { ensureGithubCli, manageGithubCliFlow } from "./utils/githubCli";
import {
    checkForUpdates,
    forceCheckUpdate,
    getCurrentVersion,
} from "./utils/updateChecker";
import type { Account } from "./types";

// Version constant - synced by CI/CD workflow
const PACKAGE_VERSION = "1.0.6";

function showVersion() {
    console.log(`ghe v${PACKAGE_VERSION}`);
    console.log("Beautiful GitHub Account Switcher");
    console.log(
        "Interactive CLI tool for managing multiple GitHub accounts per repository",
    );
    console.log(
        "Enhanced with automatic active account detection and comprehensive connection testing",
    );
    console.log("");
    console.log("GitHub: https://github.com/dwirx/ghe");
    console.log("NPM: https://www.npmjs.com/package/ghe");
}

function showHelp() {
    console.log(`GHE - GitHub Account Switcher v${PACKAGE_VERSION}`);
    console.log("");
    console.log("Usage:");
    console.log("  ghe                      Start interactive mode");
    console.log("  ghe --version            Show version information");
    console.log("  ghe --help               Show this help message");
    console.log("");
    console.log("Clone Repository:");
    console.log(
        "  ghe <repo-url> [dir]     Clone repository with account selection",
    );
    console.log("                            Supports SSH and HTTPS URLs");
    console.log("");
    console.log("Universal Download (RECOMMENDED):");
    console.log("  ghe dl <url> [options]   Download ANY file from ANY URL");
    console.log(
        "                            Auto-detects: Git repos OR regular URLs",
    );
    console.log(
        "                            Works with: PDFs, ISOs, installers, etc.",
    );
    console.log("  ghe get <url>            Alias for 'dl' command");
    console.log("  ghe fetch-file <url>     Alias for 'dl' command");
    console.log("");
    console.log("Universal Download (Alternative):");
    console.log("  ghe dlx <url> [options]  Explicit universal downloader");
    console.log(
        "                            Same as 'dl' but explicit for any URL",
    );
    console.log("");
    console.log("Universal Download Options (dl/dlx/get):");
    console.log("  -o, --output <name>       Custom output filename");
    console.log("  -O                        Keep original filename");
    console.log("  -d, --dir <path>          Output directory");
    console.log(
        "  --preserve-path           Preserve repository path structure",
    );
    console.log("  -f, --file-list <path>    Download from file list");
    console.log("  --pattern <glob>          Download files matching pattern");
    console.log("  --exclude <glob>          Exclude files matching pattern");
    console.log("  -b, --branch <name>       Specify branch (Git repos only)");
    console.log("  -t, --tag <name>          Specify tag (Git repos only)");
    console.log("  -c, --commit <hash>       Specify commit (Git repos only)");
    console.log("  --info                    Show file info before download");
    console.log("  --progress                Show progress bar");
    console.log("  --overwrite               Overwrite existing files");
    console.log("  -A, --user-agent <ua>     Custom user agent string");
    console.log("  -H, --header <header>     Add custom HTTP header");
    console.log("  --no-redirect             Don't follow redirects");
    console.log("");
    console.log("Download Directory:");
    console.log("  ghe dl-dir <url>         Download entire directory");
    console.log(
        "  --depth <n>               Maximum directory depth (default: 10)",
    );
    console.log("");
    console.log("Download Release:");
    console.log("  ghe dl-release <repo>    Download from latest release");
    console.log("  --asset <name>            Filter by asset name");
    console.log("  --version <tag>           Specific release version");
    console.log("");
    console.log("CLI Shortcuts:");
    console.log("  ghe switch <account>     Switch to specific account");
    console.log(
        "  ghe quick                Quick switch menu (recent accounts)",
    );
    console.log("  ghe status               Show current repository status");
    console.log("  ghe list                 List all configured accounts");
    console.log("  ghe health               Check health of all accounts");
    console.log("  ghe log                  View activity log");
    console.log("  ghe lazy                 Launch lazygit terminal UI");
    console.log("");
    console.log("Git Shortcuts:");
    console.log(
        "  ghe shove <message>      Add, commit, and push with confirmation",
    );
    console.log(
        "  ghe shovenc              Add, commit (empty msg), push with confirmation",
    );
    console.log("");
    console.log("Git Config Commands:");
    console.log(
        "  ghe setname <name>       Set global git user.name",
    );
    console.log(
        "  ghe setmail <email>      Set global git user.email",
    );
    console.log(
        "  ghe showconfig           Show all git configuration",
    );
    console.log("");
    console.log("Interactive Commands:");
    console.log("  • Add account             Add a new GitHub account");
    console.log(
        "  • Switch account          Switch account for current repository",
    );
    console.log("  • List accounts           Show all configured accounts");
    console.log("  • Health check            Verify SSH keys and tokens");
    console.log(
        "  • Activity log            View usage history and statistics",
    );
    console.log("  • Test connection         Test SSH/token connectivity");
    console.log(
        "  • Generate SSH key        Create new SSH key for an account",
    );
    console.log("  • Multi-platform support  GitHub, GitLab, Bitbucket, Gitea");
    console.log("");
    console.log("Examples:");
    console.log(
        "  ghe                                                # Start interactive menu",
    );
    console.log(
        "  ghe https://github.com/user/repo.git               # Clone with HTTPS",
    );
    console.log(
        "  ghe git@github.com:user/repo.git                   # Clone with SSH",
    );
    console.log(
        "  ghe https://github.com/user/repo.git myproject     # Clone to 'myproject' dir",
    );
    console.log(
        "  ghe dl https://example.com/file.pdf                # Download any file",
    );
    console.log(
        "  ghe dl https://releases.ubuntu.com/22.04/ubuntu.iso   # Download ISO",
    );
    console.log(
        "  ghe dl https://github.com/user/repo/blob/main/README.md  # Download from Git repo",
    );
    console.log(
        "  ghe dl https://omarchy.org/install -o install.sh   # Download script",
    );
    console.log(
        "  ghe dl <url> -o custom.txt                         # Download with custom name",
    );
    console.log(
        "  ghe dl-dir https://github.com/user/repo/tree/main/src    # Download directory",
    );
    console.log(
        '  ghe dl github.com/user/repo --pattern "*.md"       # Download all markdown files',
    );
    console.log(
        "  ghe dl-release github.com/user/repo                # Download latest release",
    );
    console.log(
        "  ghe switch work                                    # Switch to 'work' account",
    );
    console.log(
        "  ghe quick                                          # Quick switch to recent account",
    );
    console.log(
        "  ghe status                                         # Show current repo status",
    );
    console.log(
        '  ghe shove "fix: bug"                               # Add, commit, and push',
    );
    console.log(
        "  ghe health                                         # Check all accounts health",
    );
    console.log(
        '  ghe setname "John Doe"                             # Set git user.name globally',
    );
    console.log(
        "  ghe setmail john@example.com                       # Set git user.email globally",
    );
    console.log(
        "  ghe showconfig                                     # Show all git configuration",
    );
    console.log("");
    console.log("Documentation: https://github.com/dwirx/ghe#readme");
}

async function showRepositoryContext(accounts: Account[]) {
    const cwd = process.cwd();

    if (!(await isGitRepo(cwd))) {
        showBox(
            colors.muted(
                "Run ghe inside a Git repository to see active account details.",
            ),
            {
                title: "Repository Context",
                type: "info",
            },
        );
        return;
    }

    const [activeAccount, remoteInfo, gitUser] = await Promise.all([
        detectActiveAccount(accounts, cwd),
        getCurrentRemoteInfo(cwd),
        getCurrentGitUser(cwd),
    ]);

    const lines: string[] = [];

    if (remoteInfo?.repoPath) {
        lines.push(`Repository: ${colors.accent(remoteInfo.repoPath)}`);
        const [owner] = remoteInfo.repoPath.split("/");
        if (owner) {
            lines.push(`Owner: ${colors.text(owner)}`);
        }
    } else {
        lines.push(colors.warning("No origin remote configured"));
    }

    if (remoteInfo?.authType) {
        lines.push(
            `Auth Type: ${colors.secondary(remoteInfo.authType.toUpperCase())}`,
        );
    }

    if (gitUser) {
        lines.push(`Git User: ${colors.text(gitUser.userName || "Not set")}`);
        lines.push(`Git Email: ${colors.text(gitUser.userEmail || "Not set")}`);
    }

    if (activeAccount) {
        lines.push(`Active Account: ${colors.success(activeAccount)}`);
    } else {
        lines.push(colors.warning("Active account could not be detected"));
    }

    showBox(lines.join("\n"), {
        title: "Repository Context",
        type: activeAccount ? "success" : "warning",
    });
}

export async function main() {
    // Handle command line arguments
    const args = process.argv.slice(2);

    if (args.includes("--version") || args.includes("-v")) {
        showVersion();
        return;
    }

    if (args.includes("--help") || args.includes("-h")) {
        showHelp();
        return;
    }

    // Show beautiful title
    showTitle();

    // Check for updates (non-blocking, cached for 24 hours)
    checkForUpdates({
        updateCheckInterval: 1000 * 60 * 60 * 24, // Check once per day
        showNotification: true,
    });

    await ensureGithubCli({ promptInstall: false, promptLogin: false });

    const cfg = loadConfig();

    while (true) {
        showSection("Main Menu");

        await showRepositoryContext(cfg.accounts);

        const { action } = await prompts({
            type: "select",
            name: "action",
            message: stylePrompt("Choose an action"),
            choices: [
                {
                    title: colors.primary("🔄 Switch account for current repo"),
                    value: "switch",
                    description: "Change GitHub account for this repository",
                },
                {
                    title: colors.accent("📋 List accounts"),
                    value: "list",
                    description: "View all configured accounts",
                },
                {
                    title: colors.success("➕ Add account"),
                    value: "add",
                    description: "Configure a new GitHub account",
                },
                {
                    title: colors.secondary("✏️  Edit account"),
                    value: "edit",
                    description: "Modify existing account settings",
                },
                {
                    title: colors.warning("🗑️  Remove account"),
                    value: "remove",
                    description: "Delete an account configuration",
                },
                {
                    title: colors.accent("🔑 Generate SSH key"),
                    value: "genkey",
                    description: "Create new SSH key for an account",
                },
                {
                    title: colors.secondary("📥 Import SSH private key"),
                    value: "importkey",
                    description: "Import existing SSH key",
                },
                {
                    title: colors.primary("🌐 Switch SSH globally"),
                    value: "globalssh",
                    description: "Change global SSH configuration",
                },
                {
                    title: colors.accent("🧪 Test connection"),
                    value: "test",
                    description: "Verify account authentication",
                },
                {
                    title: colors.primary("🏥 Health check"),
                    value: "health",
                    description:
                        "Check health of all accounts (SSH keys, tokens)",
                },
                {
                    title: colors.accent("📜 Activity log"),
                    value: "log",
                    description: "View activity history and statistics",
                },
                {
                    title: colors.accent("☁ Kelola GitHub CLI"),
                    value: "githubcli",
                    description:
                        "Instal, cek status, login, dan lihat panduan perintah",
                },
                {
                    title: colors.secondary("🔄 Check for updates"),
                    value: "checkupdate",
                    description: "Check for new version of GHE",
                },
                {
                    title: colors.muted("🚪 Exit"),
                    value: "exit",
                    description: "Close the application",
                },
            ],
            initial: 0,
        });

        if (action === "exit" || action === undefined) {
            showSeparator();
            showSuccess("Thank you for using GHE! 👋");
            break;
        }

        try {
            showSeparator();

            if (action === "switch") await switchForCurrentRepo(cfg);
            if (action === "list") await listAccounts(cfg);
            if (action === "add") await addAccountFlow(cfg);
            if (action === "edit") {
                const { editAccountFlow } = await import("./flows");
                await editAccountFlow(cfg);
            }
            if (action === "remove") await removeAccountFlow(cfg);
            if (action === "genkey") {
                if (!cfg.accounts.length) {
                    showError(
                        "No accounts found. Please add an account first.",
                    );
                } else {
                    const acc = await chooseAccount(cfg.accounts);
                    if (acc?.ssh) {
                        const keyPath = acc.ssh.keyPath;
                        await generateSshKey(
                            keyPath,
                            acc.gitEmail ||
                                acc.gitUserName ||
                                `${acc.name}@github`,
                        );
                        showSuccess(`Generated SSH key: ${keyPath}`);
                    } else {
                        showWarning(
                            "Selected account has no SSH configuration.",
                        );
                    }
                }
            }
            if (action === "importkey") {
                const { importSshKeyFlow } = await import("./flows");
                await importSshKeyFlow(cfg);
            }
            if (action === "test") {
                const { testConnectionFlow } = await import("./flows");
                await testConnectionFlow(cfg);
            }
            if (action === "globalssh") {
                const { switchGlobalSshFlow } = await import("./flows");
                await switchGlobalSshFlow(cfg);
            }
            if (action === "githubcli") {
                await manageGithubCliFlow();
            }
            if (action === "health") {
                const { healthCheckFlow } = await import("./flows");
                await healthCheckFlow();
            }
            if (action === "log") {
                const { showActivityLogFlow } = await import("./flows");
                await showActivityLogFlow();
            }
            if (action === "checkupdate") {
                await forceCheckUpdate();
            }
        } catch (e: any) {
            showError(`Operation failed: ${e?.message || String(e)}`);
        }

        // Add a pause before showing menu again
        console.log();
        await prompts({
            type: "text",
            name: "continue",
            message: colors.muted("Press Enter to continue..."),
            initial: "",
        });
    }
}
