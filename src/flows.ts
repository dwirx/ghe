import prompts from "prompts";
import * as fs from "fs";

import type { AppConfig, Account, PlatformConfig } from "./types";
import { saveConfig } from "./config";
import { getSshDirectory, getGitCredentialsPath } from "./utils/platform";
import {
    ensureCredentialStore,
    getRemoteUrl,
    isGitRepo,
    parseRepoFromUrl,
    setLocalGitIdentity,
    setRemoteUrl,
    withGitSuffix,
    getCurrentGitUser,
    getCurrentRemoteInfo,
} from "./git";
import {
    ensureSshConfigBlock,
    expandHome,
    generateSshKey,
    importPrivateKey,
    ensurePublicKey,
    testSshConnection,
    listSshPrivateKeys,
    suggestDestFilenames,
    SSH_DIR,
    ensureKeyPermissions,
} from "./ssh";
import { testTokenAuth } from "./git";
import {
    showSection,
    showAccount,
    showList,
    stylePrompt,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showBox,
    showRepoStatus,
    createSpinner,
    colors,
} from "./utils/ui";
import { logActivity } from "./activityLog";
import {
    detectPlatformFromUrl,
    getPlatformName,
    getPlatformIcon,
    getPlatformSshHost,
    buildRemoteUrl,
    getPlatformInstructions,
    autoDetectPlatform,
} from "./platformDetector";

export async function detectActiveAccount(
    accounts: Account[],
    cwd = process.cwd(),
): Promise<string | null> {
    try {
        // Check if we're in a git repository
        if (!(await isGitRepo(cwd))) {
            return null;
        }

        // Get current git user and remote info
        const gitUser = await getCurrentGitUser(cwd);
        const remoteInfo = await getCurrentRemoteInfo(cwd);

        if (!gitUser && !remoteInfo) {
            return null;
        }

        // Try to match account based on git identity and remote URL
        for (const account of accounts) {
            let matches = 0;
            let totalChecks = 0;

            // Check git identity match
            if (gitUser) {
                if (account.gitUserName) {
                    totalChecks++;
                    if (gitUser.userName === account.gitUserName) matches++;
                }
                if (account.gitEmail) {
                    totalChecks++;
                    if (gitUser.userEmail === account.gitEmail) matches++;
                }
            }

            // Check remote URL type match (SSH vs HTTPS)
            if (remoteInfo) {
                totalChecks++;
                if (remoteInfo.authType === "ssh" && account.ssh) {
                    matches++;
                } else if (remoteInfo.authType === "https" && account.token) {
                    matches++;
                }
            }

            // If we have matches and they represent a significant portion
            if (matches > 0 && matches >= Math.ceil(totalChecks * 0.5)) {
                return account.name;
            }
        }

        return null;
    } catch {
        return null;
    }
}

export async function chooseAccount(accounts: Account[]) {
    // Detect active account
    const activeAccountName = await detectActiveAccount(accounts);

    const { idx } = await prompts({
        type: "select",
        name: "idx",
        message: stylePrompt("Choose account"),
        choices: accounts.map((a, i) => {
            const isActive = a.name === activeAccountName;
            const statusIcon = isActive
                ? colors.success("●")
                : colors.muted("○");
            const statusText = isActive ? colors.success(" (ACTIVE)") : "";

            // Build description with available methods
            const methods = [];
            if (a.ssh) methods.push("SSH");
            if (a.token) methods.push("Token");
            const methodsText =
                methods.length > 0 ? ` • ${methods.join(", ")}` : "";

            // Add platform info
            const platformInfo = a.platform
                ? ` • ${getPlatformIcon(a.platform.type)} ${getPlatformName(a.platform.type)}`
                : "";

            return {
                title: `${statusIcon} ${a.name}${statusText}`,
                value: i,
                description:
                    `${a.gitUserName || ""} ${a.gitEmail || ""}${methodsText}${platformInfo}`.trim(),
            };
        }),
    });

    if (idx === undefined) return null;
    return accounts[idx];
}

export async function addAccountFlow(cfg: AppConfig) {
    // Try to detect platform from current repo
    const cwd = process.cwd();
    let detectedPlatform: PlatformConfig = { type: "github" };
    let detectedPlatformName = "GitHub";

    try {
        if (await isGitRepo(cwd)) {
            const remoteInfo = await getCurrentRemoteInfo(cwd);
            if (remoteInfo?.platform) {
                detectedPlatform = remoteInfo.platform;
                detectedPlatformName = getPlatformName(detectedPlatform.type);
                showInfo(
                    `📡 Detected platform from current repo: ${getPlatformIcon(detectedPlatform.type)} ${detectedPlatformName}`,
                );
                if (detectedPlatform.domain) {
                    showInfo(`   Domain: ${detectedPlatform.domain}`);
                }
            }
        }
    } catch {
        // Ignore errors, use default
    }

    const base = await prompts([
        {
            type: "text",
            name: "name",
            message: "Account label (e.g., work, personal)",
            validate: (v) => !!v || "Required",
        },
        {
            type: "text",
            name: "gitUserName",
            message: "Git user.name (optional)",
        },
        {
            type: "text",
            name: "gitEmail",
            message: "Git user.email (optional)",
        },
        {
            type: "select",
            name: "platform",
            message: `Git platform (detected: ${detectedPlatformName})`,
            choices: [
                {
                    title: `${getPlatformIcon("github")} GitHub`,
                    value: "github",
                },
                {
                    title: `${getPlatformIcon("gitlab")} GitLab`,
                    value: "gitlab",
                },
                {
                    title: `${getPlatformIcon("bitbucket")} Bitbucket`,
                    value: "bitbucket",
                },
                { title: `${getPlatformIcon("gitea")} Gitea`, value: "gitea" },
                { title: `${getPlatformIcon("other")} Other`, value: "other" },
            ],
            initial: [
                "github",
                "gitlab",
                "bitbucket",
                "gitea",
                "other",
            ].indexOf(detectedPlatform.type),
        },
        {
            type: "multiselect",
            name: "methods",
            message: "Enable methods",
            choices: [
                { title: "SSH", value: "ssh" },
                { title: "Token (HTTPS)", value: "token" },
            ],
            min: 1,
        },
    ]);
    if (!base.name) return;

    const acc: Account = {
        name: base.name,
        gitUserName: base.gitUserName,
        gitEmail: base.gitEmail,
        platform: {
            type: base.platform || "github",
        },
    };

    // Ask for custom domain if not GitHub
    if (base.platform && base.platform !== "github") {
        const suggestedDomain =
            base.platform === detectedPlatform.type && detectedPlatform.domain
                ? detectedPlatform.domain
                : "";
        const domainPrompt = await prompts({
            type: "text",
            name: "domain",
            message: `Custom domain for ${getPlatformName(base.platform)} (optional, e.g., gitlab.company.com)`,
            initial: suggestedDomain,
        });
        if (domainPrompt.domain) {
            acc.platform!.domain = domainPrompt.domain;
        }
    }

    if (base.methods.includes("ssh")) {
        const existingKeys = listSshPrivateKeys();
        const keyChoices = [
            ...existingKeys.map((p) => ({ title: p, value: p })),
            { title: "Ketik path kunci manual…", value: "__manual__" },
        ];
        const sel = await prompts([
            {
                type: keyChoices.length ? "autocomplete" : "text",
                name: "keySel",
                message: `Pilih SSH key di ${getSshDirectory()} atau ketik manual`,
                choices: keyChoices,
            },
        ]);
        let keyPath: string | undefined;
        if (sel.keySel && sel.keySel !== "__manual__") {
            keyPath = expandHome(sel.keySel);
        } else {
            const manual = await prompts([
                {
                    type: "text",
                    name: "keyPath",
                    message: `SSH key path (mis. ${getSshDirectory()}/id_ed25519_work)`,
                    validate: (v) => !!v || "Required",
                },
            ]);
            keyPath = expandHome(manual.keyPath);
        }
        const more = await prompts([
            {
                type: "text",
                name: "hostAlias",
                message: "SSH host alias (opsional)",
                initial: `github-${base.name}`,
            },
            {
                type: !keyPath || !fs.existsSync(keyPath) ? "confirm" : null,
                name: "gen",
                message: "Key tidak ditemukan. Generate baru (ed25519)?",
            },
        ]);
        const alias = more.hostAlias || `github-${base.name}`;
        acc.ssh = { keyPath: keyPath!, hostAlias: alias };
        if (keyPath && fs.existsSync(keyPath)) {
            ensureKeyPermissions(keyPath);
        }
        if (keyPath && !fs.existsSync(keyPath) && more.gen) {
            await generateSshKey(
                keyPath,
                base.gitEmail || base.gitUserName || `${base.name}@github`,
            );
            showSuccess(`Generated SSH key: ${keyPath}`);
            const pub = keyPath + ".pub";
            if (fs.existsSync(pub)) showInfo(`Public key: ${pub}`);
        }
    }

    if (base.methods.includes("token")) {
        const tokenAns = await prompts([
            { type: "text", name: "username", message: "GitHub username" },
            {
                type: "password",
                name: "token",
                message: "GitHub Personal Access Token",
            },
        ]);
        acc.token = { username: tokenAns.username, token: tokenAns.token };
    }

    cfg.accounts.push(acc);
    saveConfig(cfg);
    showSuccess(`Account updated: ${acc.name}`);

    // Log activity
    logActivity({
        action: "edit",
        accountName: acc.name,
        platform: acc.platform?.type || "github",
        success: true,
    });

    // Log activity
    logActivity({
        action: "add",
        accountName: acc.name,
        platform: acc.platform?.type || "github",
        success: true,
    });

    showSuccess(`Account saved: ${acc.name}`);
}

export async function removeAccountFlow(cfg: AppConfig) {
    if (!cfg.accounts.length) return console.log("No accounts to remove.");
    const { idx } = await prompts({
        type: "select",
        name: "idx",
        message: "Remove which account?",
        choices: cfg.accounts.map((a, i) => ({ title: a.name, value: i })),
    });
    if (idx === undefined) return;
    const [removed] = cfg.accounts.splice(idx, 1);
    saveConfig(cfg);
    showSuccess(`Removed account: ${removed?.name || "Unknown"}`);

    // Log activity
    if (removed) {
        logActivity({
            action: "remove",
            accountName: removed.name,
            platform: removed.platform?.type || "github",
            success: true,
        });
    }
}

export async function listAccounts(cfg: AppConfig) {
    if (!cfg.accounts.length) {
        showWarning("No accounts configured. Please add an account first.");
        return;
    }

    showSection("Account Overview");

    // Detect active account
    const activeAccountName = await detectActiveAccount(cfg.accounts);

    // Show repository info if we're in a git repo
    const cwd = process.cwd();
    if (await isGitRepo(cwd)) {
        const remoteInfo = await getCurrentRemoteInfo(cwd);
        const gitUser = await getCurrentGitUser(cwd);

        if (remoteInfo || gitUser) {
            showBox(
                [
                    remoteInfo
                        ? `Repository: ${colors.accent(remoteInfo.repoPath || "Unknown")}`
                        : "",
                    remoteInfo
                        ? `Auth Type: ${colors.secondary(remoteInfo.authType?.toUpperCase() || "Unknown")}`
                        : "",
                    gitUser
                        ? `Git User: ${colors.text(gitUser.userName || "Not set")}`
                        : "",
                    gitUser
                        ? `Git Email: ${colors.text(gitUser.userEmail || "Not set")}`
                        : "",
                    activeAccountName
                        ? `Active Account: ${colors.success(activeAccountName)}`
                        : colors.warning("No active account detected"),
                ]
                    .filter(Boolean)
                    .join("\n"),
                {
                    title: "Current Repository Status",
                    type: activeAccountName ? "success" : "warning",
                },
            );
        }
    }

    // Display all accounts with enhanced styling
    cfg.accounts.forEach((account, index) => {
        const isActive = account.name === activeAccountName;
        const statusIcon = isActive ? colors.success("●") : colors.muted("○");
        const statusText = isActive ? colors.success(" (ACTIVE)") : "";

        console.log();
        console.log(
            `${statusIcon} ${colors.primary(`Account ${index + 1}:`)} ${colors.text(account.name)}${statusText}`,
        );

        // Git Identity
        if (account.gitUserName || account.gitEmail) {
            console.log(colors.muted("  Git Identity:"));
            if (account.gitUserName)
                console.log(colors.muted(`    Name: ${account.gitUserName}`));
            if (account.gitEmail)
                console.log(colors.muted(`    Email: ${account.gitEmail}`));
        }

        // SSH Configuration
        if (account.ssh) {
            console.log(colors.accent("  SSH Configuration:"));
            console.log(colors.muted(`    Key Path: ${account.ssh.keyPath}`));
            console.log(
                colors.muted(
                    `    Host Alias: ${account.ssh.hostAlias || `github-${account.name}`}`,
                ),
            );

            // Check if SSH key exists
            const keyExists = fs.existsSync(expandHome(account.ssh.keyPath));
            const keyStatus = keyExists
                ? colors.success("✓ Key exists")
                : colors.error("✗ Key missing");
            console.log(colors.muted(`    Status: ${keyStatus}`));
        }

        // Token Configuration
        if (account.token) {
            console.log(colors.secondary("  Token Authentication:"));
            console.log(
                colors.muted(`    Username: ${account.token.username}`),
            );
            console.log(colors.muted(`    Token: ${"*".repeat(20)} (stored)`));
        }

        // Show available methods
        const methods = [];
        if (account.ssh) methods.push(colors.accent("SSH"));
        if (account.token) methods.push(colors.secondary("Token"));

        if (methods.length > 0) {
            console.log(colors.muted(`    Methods: ${methods.join(", ")}`));
        }

        // Platform Configuration
        if (account.platform) {
            const platformIcon = getPlatformIcon(account.platform.type);
            const platformName = getPlatformName(account.platform.type);
            console.log(
                colors.muted(`  Platform: ${platformIcon} ${platformName}`),
            );
            if (account.platform.domain) {
                console.log(
                    colors.muted(`    Domain: ${account.platform.domain}`),
                );
            }
        }
    });

    console.log();
    showInfo(`Total accounts: ${cfg.accounts.length}`);
}

export async function switchForCurrentRepo(cfg: AppConfig) {
    const cwd = process.cwd();
    if (!(await isGitRepo(cwd))) {
        console.log("Not a git repository. cd into a repo and try again.");
        return;
    }
    if (!cfg.accounts.length) {
        console.log("No accounts configured yet.");
        return;
    }
    const acc = await chooseAccount(cfg.accounts);
    if (!acc) return;

    const methods = [
        ...(acc.ssh ? [{ title: "SSH", value: "ssh" as const }] : []),
        ...(acc.token
            ? [{ title: "Token (HTTPS)", value: "token" as const }]
            : []),
    ];
    if (!methods.length) {
        console.log("Selected account has no methods configured.");
        return;
    }
    const { method } = await prompts({
        type: methods.length === 1 ? null : "select",
        name: "method",
        message: "Choose method",
        choices: methods,
    });
    const chosen = (methods.length === 1 ? methods[0]?.value : method) as
        | "ssh"
        | "token"
        | undefined;

    if (!chosen) {
        console.log("No authentication method selected.");
        return;
    }

    let remoteUrl = await getRemoteUrl("origin", cwd);
    let repoPath = parseRepoFromUrl(remoteUrl || "");
    if (!repoPath) {
        const ans = await prompts({
            type: "text",
            name: "repo",
            message: "owner/repo (current repository)",
            validate: (v) => (/.+\/.+/.test(v) ? true : "Use owner/repo"),
        });
        if (!ans.repo) return;
        repoPath = withGitSuffix(ans.repo);
    }
    repoPath = withGitSuffix(repoPath);

    if (chosen === "ssh" && acc.ssh) {
        const keyPath = expandHome(acc.ssh.keyPath);
        if (!fs.existsSync(keyPath)) {
            const { gen } = await prompts({
                type: "confirm",
                name: "gen",
                message: stylePrompt(
                    `SSH key not found at ${keyPath}. Generate now?`,
                    "confirm",
                ),
            });
            if (gen) {
                const spinner = createSpinner("Generating SSH key...");
                spinner.start();

                try {
                    const platform = acc.platform?.type || "github";
                    await generateSshKey(
                        keyPath,
                        acc.gitEmail ||
                            acc.gitUserName ||
                            `${acc.name}@${platform}`,
                    );
                    spinner.stop();
                    showSuccess(`Generated SSH key: ${keyPath}`);
                } catch (error) {
                    spinner.stop();
                    throw error;
                }
            } else {
                showWarning("Operation cancelled.");
                return;
            }
        }

        // Ensure permissions and configure SSH for the platform
        ensureKeyPermissions(keyPath);
        const platformHost = getPlatformSshHost(
            acc.platform || { type: "github" },
        );
        ensureSshConfigBlock(platformHost, keyPath, platformHost);
        const newUrl = buildRemoteUrl(
            acc.platform || { type: "github" },
            repoPath,
            true,
        );
        await setRemoteUrl(newUrl, "origin", cwd);
        await setLocalGitIdentity(acc.gitUserName, acc.gitEmail, cwd);

        const platformName = getPlatformName(acc.platform?.type || "github");
        const platformIcon = getPlatformIcon(acc.platform?.type || "github");
        showBox(
            `Repository switched to SSH authentication\n\n${platformIcon} Platform: ${platformName}\nRemote: ${newUrl}\nAccount: ${acc.name}`,
            { title: "SSH Configuration Applied", type: "success" },
        );

        // Log activity
        logActivity({
            action: "switch",
            accountName: acc.name,
            repoPath: repoPath.replace(/\.git$/, ""),
            method: "ssh",
            platform: acc.platform?.type || "github",
            success: true,
        });

        return;
    }

    if (chosen === "token" && acc.token) {
        const httpsUrl = buildRemoteUrl(
            acc.platform || { type: "github" },
            repoPath,
            false,
        );
        await setRemoteUrl(httpsUrl, "origin", cwd);
        await setLocalGitIdentity(acc.gitUserName, acc.gitEmail, cwd);
        await ensureCredentialStore(acc.token.username, acc.token.token);

        const platformName = getPlatformName(acc.platform?.type || "github");
        const platformIcon = getPlatformIcon(acc.platform?.type || "github");
        showBox(
            `Repository switched to HTTPS token authentication\n\n${platformIcon} Platform: ${platformName}\nRemote: ${httpsUrl}\nAccount: ${acc.name}\n\nNote: Token stored in ${getGitCredentialsPath()} (plaintext)\nConsider using SSH for stronger local security.`,
            { title: "Token Configuration Applied", type: "success" },
        );

        // Log activity
        logActivity({
            action: "switch",
            accountName: acc.name,
            repoPath: repoPath.replace(/\.git$/, ""),
            method: "token",
            platform: acc.platform?.type || "github",
            success: true,
        });

        return;
    }
}

export async function editAccountFlow(cfg: AppConfig) {
    if (!cfg.accounts.length) return console.log("No accounts to edit.");
    const acc = await chooseAccount(cfg.accounts);
    if (!acc) return;

    const methodsInit: string[] = [];
    if (acc.ssh) methodsInit.push("ssh");
    if (acc.token) methodsInit.push("token");

    const base = await prompts([
        {
            type: "text",
            name: "name",
            message: "Account label",
            initial: acc.name,
            validate: (v) => !!v || "Required",
        },
        {
            type: "text",
            name: "gitUserName",
            message: "Git user.name",
            initial: acc.gitUserName || "",
        },
        {
            type: "text",
            name: "gitEmail",
            message: "Git user.email",
            initial: acc.gitEmail || "",
        },
        {
            type: "multiselect",
            name: "methods",
            message: "Enable methods",
            choices: [
                { title: "SSH", value: "ssh", selected: acc.ssh !== undefined },
                {
                    title: "Token (HTTPS)",
                    value: "token",
                    selected: acc.token !== undefined,
                },
            ],
        },
    ]);
    if (!base.name) return;

    acc.name = base.name;
    acc.gitUserName = base.gitUserName || undefined;
    acc.gitEmail = base.gitEmail || undefined;

    const useSsh = base.methods.includes("ssh");
    const useTok = base.methods.includes("token");
    acc.ssh = useSsh
        ? (acc.ssh ?? { keyPath: "", hostAlias: `github-${acc.name}` })
        : undefined;
    acc.token = useTok ? (acc.token ?? { username: "", token: "" }) : undefined;

    if (useSsh && acc.ssh) {
        const sshAns = await prompts([
            {
                type: "text",
                name: "keyPath",
                message: "SSH key path",
                initial:
                    acc.ssh.keyPath ||
                    `${getSshDirectory()}/id_ed25519_` + acc.name,
            },
            {
                type: "text",
                name: "hostAlias",
                message: "SSH host alias",
                initial: acc.ssh.hostAlias || `github-${acc.name}`,
            },
            {
                type: (prev: string) =>
                    prev && !fs.existsSync(expandHome(prev)) ? "confirm" : null,
                name: "gen",
                message: "Key not found. Generate new ed25519 key?",
            },
        ]);
        acc.ssh.keyPath = expandHome(sshAns.keyPath);
        acc.ssh.hostAlias = sshAns.hostAlias || `github-${acc.name}`;
        if (!fs.existsSync(acc.ssh.keyPath) && sshAns.gen) {
            await generateSshKey(
                acc.ssh.keyPath,
                acc.gitEmail || acc.gitUserName || `${acc.name}@github`,
            );
        }
    }

    if (useTok && acc.token) {
        const tokAns = await prompts([
            {
                type: "text",
                name: "username",
                message: "GitHub username",
                initial: acc.token.username || "",
            },
            {
                type: "password",
                name: "token",
                message: "GitHub token (leave blank to keep)",
            },
        ]);
        acc.token.username = tokAns.username || acc.token.username;
        if (tokAns.token) acc.token.token = tokAns.token;
    }

    saveConfig(cfg);
    showSuccess(`Updated account: ${acc.name}`);
}

export async function importSshKeyFlow(cfg: AppConfig) {
    if (!cfg.accounts.length) return console.log("No accounts. Add one first.");
    const acc = await chooseAccount(cfg.accounts);
    if (!acc) return;

    const existingKeys = listSshPrivateKeys();
    const srcChoices = existingKeys.map((p) => ({ title: p, value: p }));
    const destSugs = suggestDestFilenames(acc.token?.username, acc.name);
    const destChoices = destSugs.map((n) => ({
        title: `${SSH_DIR}/${n}`,
        value: n,
    }));

    const ans = await prompts([
        {
            type: "text",
            name: "username",
            message: "GitHub username untuk key ini",
            initial: acc.token?.username || "",
        },
        {
            type: srcChoices.length ? "autocomplete" : "text",
            name: "src",
            message: "Pilih/isi path private key yang sudah ada",
            choices: srcChoices,
        },
        {
            type: destChoices.length ? "autocomplete" : "text",
            name: "dest",
            message: "Nama file tujuan di ~/.ssh",
            choices: destChoices,
            initial: destSugs[0] || `id_ed25519_${acc.name}`,
            validate: (v: string) =>
                (v && !/[\/]/.test(v)) || "Masukkan nama file saja, tanpa path",
        },
        {
            type: "confirm",
            name: "makeDefault",
            message: "Jadikan default (Host github.com) sekarang?",
            initial: true,
        },
        {
            type: "confirm",
            name: "writeAlias",
            message: "Tambahkan juga alias Host khusus (opsional)?",
            initial: false,
        },
        {
            type: (prev: boolean) => (prev ? "text" : null),
            name: "alias",
            message: "Nama alias Host",
            initial: (_: string, values: any) =>
                `github-${values.username || acc.name}`,
        },
        {
            type: "confirm",
            name: "test",
            message: "Test SSH connection setelah import?",
            initial: true,
        },
    ]);
    if (!ans.src || !ans.dest) return;
    const destFull = `${SSH_DIR}/${ans.dest}`;
    // Cegah overwrite tanpa konfirmasi jika file sudah ada
    if (fs.existsSync(destFull)) {
        const { overwrite } = await prompts({
            type: "confirm",
            name: "overwrite",
            message: `${destFull} sudah ada. Timpa?`,
            initial: false,
        });
        if (!overwrite) return console.log("Dibatalkan.");
    }
    const imported = importPrivateKey(ans.src, destFull);
    const pub = await ensurePublicKey(imported);

    acc.ssh = {
        keyPath: imported,
        hostAlias: ans.alias || `github-${ans.username || acc.name}`,
    };
    if (ans.makeDefault) {
        const platformHost = getPlatformSshHost(
            acc.platform || { type: "github" },
        );
        ensureSshConfigBlock(platformHost, acc.ssh.keyPath, platformHost);
        showSuccess(`Set as default Host ${platformHost}`);
    }
    if (ans.writeAlias && ans.alias) {
        const platformHost = getPlatformSshHost(
            acc.platform || { type: "github" },
        );
        ensureSshConfigBlock(acc.ssh.hostAlias!, acc.ssh.keyPath, platformHost);
        showSuccess(`Alias Host added: ${acc.ssh.hostAlias}`);
    }
    saveConfig(cfg);
    showSuccess(`Imported SSH key: ${imported}`);
    showInfo(`Public key: ${pub}`);

    if (ans.test) {
        const platformHost = getPlatformSshHost(
            acc.platform || { type: "github" },
        );
        const platformName = getPlatformName(acc.platform?.type || "github");
        const platformIcon = getPlatformIcon(acc.platform?.type || "github");

        const spinner = createSpinner(
            `Testing SSH connection to ${platformName} (${platformHost})...`,
        );
        spinner.start();

        try {
            const res = await testSshConnection(undefined, platformHost);
            spinner.stop();

            if (res.ok) {
                showSuccess("✓ SSH test OK");
                showInfo(`Authenticated successfully to ${platformHost}`);
            } else {
                showError("✗ SSH test FAILED");
                const platformInstructions = getPlatformInstructions(
                    acc.platform?.type || "github",
                    acc.platform?.domain,
                );
                showWarning(
                    `Make sure your SSH key is added to ${platformName}:`,
                );
                showInfo("1. Copy your public key:");
                showInfo(`   cat ${imported}.pub`);
                showInfo(`2. Add it at: ${platformInstructions.sshKeyUrl}`);
            }

            if (res.message) {
                console.log(colors.muted(`\nDetails: ${res.message}`));
            }
        } catch (error) {
            spinner.stop();
            showError("✗ SSH test failed with error");
            const errorMsg =
                error instanceof Error ? error.message : String(error);
            console.log(colors.error(`Error: ${errorMsg}`));
        }
    }
}

export async function testConnectionFlow(cfg: AppConfig) {
    if (!cfg.accounts.length) {
        showWarning("No accounts configured. Please add an account first.");
        return;
    }

    showSection("Test Connection");

    const acc = await chooseAccount(cfg.accounts);
    if (!acc) return;

    const methods = [
        ...(acc.ssh
            ? [{ title: `${colors.accent("🔑")} SSH`, value: "ssh" as const }]
            : []),
        ...(acc.token
            ? [
                  {
                      title: `${colors.secondary("🔐")} Token`,
                      value: "token" as const,
                  },
              ]
            : []),
    ];

    if (!methods.length) {
        showError("Selected account has no authentication methods configured.");
        return;
    }

    const { method } = await prompts({
        type: methods.length === 1 ? null : "select",
        name: "method",
        message: stylePrompt("Test which authentication method?"),
        choices: methods,
    });

    const chosen = (methods.length === 1 ? methods[0]?.value : method) as
        | "ssh"
        | "token";

    if (chosen === "ssh" && acc.ssh) {
        // Validasi SSH key exists
        const keyPath = expandHome(acc.ssh.keyPath);
        if (!fs.existsSync(keyPath)) {
            showError(`SSH key not found at: ${keyPath}`);
            showInfo("Generate the key first or check the path.");
            return;
        }

        const platformHost = getPlatformSshHost(
            acc.platform || { type: "github" },
        );
        const platformName = getPlatformName(acc.platform?.type || "github");
        const platformIcon = getPlatformIcon(acc.platform?.type || "github");

        const spinner = createSpinner(
            `Testing SSH connection to ${platformName} (${platformHost})...`,
        );
        spinner.start();

        try {
            const res = await testSshConnection(undefined, platformHost);
            spinner.stop();

            if (res.ok) {
                showSuccess("✓ SSH connection test passed!");
                showInfo(`Authenticated successfully to ${platformHost}`);

                // Log activity
                logActivity({
                    action: "test",
                    accountName: acc.name,
                    method: "ssh",
                    platform: acc.platform?.type || "github",
                    success: true,
                });
            } else {
                showError("✗ SSH connection test failed!");
                const platformInstructions = getPlatformInstructions(
                    acc.platform?.type || "github",
                    acc.platform?.domain,
                );
                showWarning(
                    `Make sure your SSH key is added to ${platformName}:`,
                );
                showInfo("1. Copy your public key:");
                showInfo(`   cat ${keyPath}.pub`);
                showInfo(`2. Add it at: ${platformInstructions.sshKeyUrl}`);

                // Log activity
                logActivity({
                    action: "test",
                    accountName: acc.name,
                    method: "ssh",
                    platform: acc.platform?.type || "github",
                    success: false,
                    error: res.message || "SSH test failed",
                });
            }

            if (res.message) {
                console.log(colors.muted(res.message));
            }
        } catch (error) {
            spinner.stop();
            showError("✗ SSH test failed with error");
            const errorMsg =
                error instanceof Error ? error.message : String(error);
            console.log(colors.error(`Error: ${errorMsg}`));
            const platformInstructions = getPlatformInstructions(
                acc.platform?.type || "github",
                acc.platform?.domain,
            );
            showInfo("\nTroubleshooting:");
            showInfo(
                "• Check if SSH key permissions are correct (600 for private key)",
            );
            showInfo(
                `• Verify the key is added to your ${platformName} account`,
            );
            showInfo(`   Add at: ${platformInstructions.sshKeyUrl}`);
            showInfo(
                `• Test manually with: ${platformInstructions.sshTestCommand}`,
            );
        }
    } else if (chosen === "token" && acc.token) {
        const spinner = createSpinner("Testing token authentication...");
        spinner.start();

        try {
            const res = await testTokenAuth(
                acc.token.username,
                acc.token.token,
            );
            spinner.stop();

            if (res.ok) {
                showSuccess("✓ Token authentication test passed!");
                showInfo(`Successfully authenticated as ${acc.token.username}`);

                // Log activity
                logActivity({
                    action: "test",
                    accountName: acc.name,
                    method: "token",
                    platform: acc.platform?.type || "github",
                    success: true,
                });
            } else {
                showError("✗ Token authentication failed");

                // Log activity
                logActivity({
                    action: "test",
                    accountName: acc.name,
                    method: "token",
                    platform: acc.platform?.type || "github",
                    success: false,
                    error: res.message || "Token authentication failed",
                });
                showWarning("Please check:");
                const platformInstructions = getPlatformInstructions(
                    acc.platform?.type || "github",
                    acc.platform?.domain,
                );
                showInfo("• Token has not expired");
                showInfo("• Token has correct permissions (repo access)");
                showInfo("• Username is correct");
                showInfo(
                    `\nCreate a new token at: ${platformInstructions.tokenUrl}`,
                );
            }

            if (res.message) {
                console.log(colors.muted(`\nDetails: ${res.message}`));
            }
        } catch (error) {
            spinner.stop();
            showError("✗ Token test failed with error");
            const errorMsg =
                error instanceof Error ? error.message : String(error);
            console.log(colors.error(`Error: ${errorMsg}`));
            showInfo("\nPossible issues:");
            showInfo("• Network connectivity problems");
            showInfo("• Invalid token format");
            showInfo("• GitHub API is unreachable");
        }
    }
}

export async function switchGlobalSshFlow(cfg: AppConfig) {
    if (!cfg.accounts.length) return console.log("No accounts. Add one first.");
    const acc = await chooseAccount(cfg.accounts);
    if (!acc) return;
    if (!acc.ssh) return console.log("Selected account has no SSH configured.");

    const keyPath = expandHome(acc.ssh.keyPath);

    // Get platform-specific host
    const platformHost = getPlatformSshHost(acc.platform || { type: "github" });
    const platformName = getPlatformName(acc.platform?.type || "github");
    const platformIcon = getPlatformIcon(acc.platform?.type || "github");

    if (!fs.existsSync(keyPath)) {
        const { gen } = await prompts({
            type: "confirm",
            name: "gen",
            message: `SSH key not found at ${keyPath}. Generate now?`,
        });
        if (gen) {
            const platform = acc.platform?.type || "github";
            await generateSshKey(
                keyPath,
                acc.gitEmail || acc.gitUserName || `${acc.name}@${platform}`,
            );
        } else {
            console.log("Aborted.");
            return;
        }
    }

    // Ensure strict permissions and set global host to always use this key
    try {
        const permOk = ensureKeyPermissions(keyPath);
        if (!permOk) {
            showWarning("Warning: Could not set all file permissions correctly");
            showInfo(
                "This may cause SSH authentication issues. Check file permissions manually.",
            );
        }
        ensureSshConfigBlock(platformHost, keyPath, platformHost);
        showSuccess(
            `Updated ~/.ssh/config → Host ${platformIcon} ${platformName} (${platformHost}) using: ${keyPath}`,
        );
    } catch (error) {
        showError("Failed to configure SSH");
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(colors.error(`Error: ${errorMsg}`));
        showInfo(
            "\nNote: If you're on Windows, permission setting may take a few seconds.",
        );
        return;
    }

    const { doTest } = await prompts({
        type: "confirm",
        name: "doTest",
        message: stylePrompt("Test SSH connection now?", "confirm"),
        initial: true,
    });

    if (doTest) {
        const spinner = createSpinner(
            `Testing SSH connection to ${platformName} (${platformHost})...`,
        );
        spinner.start();

        try {
            const res = await testSshConnection(undefined, platformHost);
            spinner.stop();

            if (res.ok) {
                showSuccess("✓ SSH authentication test passed!");
                showInfo(`Authenticated successfully to ${platformHost}`);

                // Log activity
                logActivity({
                    action: "test",
                    accountName: acc.name,
                    method: "ssh",
                    platform: acc.platform?.type || "github",
                    success: true,
                });
            } else {
                showError("✗ SSH connection test failed!");
                const platformInstructions = getPlatformInstructions(
                    acc.platform?.type || "github",
                    acc.platform?.domain,
                );
                showWarning(
                    `Make sure your SSH key is added to ${platformName}:`,
                );
                showInfo("1. Copy your public key:");
                showInfo(`   cat ${keyPath}.pub`);
                showInfo(`2. Add it at: ${platformInstructions.sshKeyUrl}`);

                // Log activity
                logActivity({
                    action: "test",
                    accountName: acc.name,
                    method: "ssh",
                    platform: acc.platform?.type || "github",
                    success: false,
                    error: res.message || "SSH test failed",
                });
            }

            if (res.message) {
                console.log(colors.muted(res.message));
            }
        } catch (error) {
            spinner.stop();
            showError("✗ SSH test failed with error");
            const errorMsg =
                error instanceof Error ? error.message : String(error);
            console.log(colors.error(`Error: ${errorMsg}`));
            const platformInstructions = getPlatformInstructions(
                acc.platform?.type || "github",
                acc.platform?.domain,
            );
            showInfo("\nTroubleshooting:");
            showInfo(
                "• Check if SSH key permissions are correct (600 for private key)",
            );
            showInfo(
                `• Verify the key is added to your ${platformName} account`,
            );
            showInfo(`   Add at: ${platformInstructions.sshKeyUrl}`);
            showInfo(
                `• Test manually with: ${platformInstructions.sshTestCommand}`,
            );
        }
    }
}

/**
 * Health check flow - check all accounts
 */
export async function healthCheckFlow(): Promise<void> {
    const { loadConfig } = await import("./config");
    const cfg = loadConfig();

    if (cfg.accounts.length === 0) {
        showError("No accounts configured");
        return;
    }

    showSection("Account Health Check");

    const { checkAllAccountsHealth, getHealthSummary } = await import(
        "./healthCheck"
    );

    const spinner = createSpinner("Checking account health...");
    spinner.start();

    try {
        const statuses = await checkAllAccountsHealth(cfg.accounts);
        spinner.stop();

        const summary = getHealthSummary(statuses);

        // Show summary
        console.log("");
        console.log(colors.primary("📊 Health Summary"));
        console.log(colors.muted("─".repeat(50)));
        console.log(`${colors.accent("Total Accounts:")} ${summary.total}`);
        console.log(`${colors.success("✓ Healthy:")} ${summary.healthy}`);
        console.log(`${colors.warning("⚠ Warnings:")} ${summary.warnings}`);
        console.log(`${colors.error("✗ Errors:")} ${summary.errors}`);
        console.log("");

        // Show detailed results
        console.log(colors.primary("📋 Detailed Results"));
        console.log(colors.muted("─".repeat(50)));

        for (const status of statuses) {
            console.log("");
            console.log(colors.accent(`▸ ${status.accountName}`));

            if (status.sshValid !== undefined) {
                if (status.sshValid) {
                    console.log(`  ${colors.success("✓")} SSH: Valid`);
                } else {
                    console.log(
                        `  ${colors.error("✗")} SSH: ${status.sshError || "Invalid"}`,
                    );
                }
            }

            if (status.tokenValid !== undefined) {
                if (status.tokenValid) {
                    console.log(`  ${colors.success("✓")} Token: Valid`);
                    if (status.tokenExpiry) {
                        const expiryDate = new Date(status.tokenExpiry);
                        const daysUntil = Math.floor(
                            (expiryDate.getTime() - Date.now()) /
                                (1000 * 60 * 60 * 24),
                        );
                        if (daysUntil < 7 && daysUntil > 0) {
                            console.log(
                                `  ${colors.warning("⚠")} Token expires in ${daysUntil} days`,
                            );
                        } else if (daysUntil <= 0) {
                            console.log(
                                `  ${colors.error("✗")} Token has expired`,
                            );
                        }
                    }
                } else {
                    console.log(
                        `  ${colors.error("✗")} Token: ${status.tokenError || "Invalid"}`,
                    );
                }
            }

            const lastChecked = new Date(status.lastChecked);
            console.log(
                `  ${colors.muted("Last checked:")} ${lastChecked.toLocaleString()}`,
            );
        }

        console.log("");

        // Check if there are permission issues that can be fixed
        const hasPermissionIssues = statuses.some(
            (s) =>
                s.sshError &&
                (s.sshError.includes("permission") ||
                    s.sshError.includes("Permissions")),
        );

        if (hasPermissionIssues) {
            console.log("");
            const { fixPermissions } = await prompts({
                type: "confirm",
                name: "fixPermissions",
                message: stylePrompt(
                    "Some SSH keys have permission issues. Fix them automatically?",
                ),
                initial: true,
            });

            if (fixPermissions) {
                showSection("Fixing Permissions");
                const fixSpinner = createSpinner(
                    "Fixing SSH key permissions...",
                );
                fixSpinner.start();

                let fixed = 0;
                for (const account of cfg.accounts) {
                    if (account.ssh?.keyPath) {
                        try {
                            ensureKeyPermissions(
                                expandHome(account.ssh.keyPath),
                            );
                            fixed++;
                        } catch (e: any) {
                            console.log(
                                `  ${colors.warning("⚠")} Failed to fix ${account.name}: ${e?.message || String(e)}`,
                            );
                        }
                    }
                }

                fixSpinner.stop();
                if (fixed > 0) {
                    showSuccess(`Fixed permissions for ${fixed} SSH key(s)`);
                    showInfo("Run health check again to verify the fixes");
                }
            }
        }

        // Save health check results
        cfg.healthChecks = statuses;
        cfg.lastHealthCheck = new Date().toISOString();
        saveConfig(cfg);

        showSuccess("Health check completed");
    } catch (e: any) {
        spinner.stop();
        showError(`Health check failed: ${e?.message || String(e)}`);
    }
}

/**
 * Activity log flow - show activity history
 */
export async function showActivityLogFlow(): Promise<void> {
    const {
        getRecentActivity,
        getActivityStats,
        exportToCSV,
        clearActivityLog,
        getLogFilePath,
    } = await import("./activityLog");

    showSection("Activity Log");

    const { action } = await prompts({
        type: "select",
        name: "action",
        message: stylePrompt("Choose an action"),
        choices: [
            {
                title: colors.primary("📜 View recent activity"),
                value: "recent",
            },
            { title: colors.accent("📊 View statistics"), value: "stats" },
            { title: colors.secondary("📥 Export to CSV"), value: "export" },
            { title: colors.warning("🗑️ Clear log"), value: "clear" },
            { title: colors.muted("← Back"), value: "back" },
        ],
    });

    if (!action || action === "back") {
        return;
    }

    if (action === "recent") {
        const entries = getRecentActivity(20);

        if (entries.length === 0) {
            showInfo("No activity recorded yet");
            return;
        }

        console.log("");
        console.log(colors.primary("📜 Recent Activity"));
        console.log(colors.muted("─".repeat(80)));

        for (const entry of entries) {
            const timestamp = new Date(entry.timestamp).toLocaleString();
            const statusIcon = entry.success
                ? colors.success("✓")
                : colors.error("✗");
            const actionIcon =
                {
                    switch: "🔄",
                    add: "➕",
                    remove: "🗑️",
                    edit: "✏️",
                    test: "🧪",
                }[entry.action] || "•";

            console.log("");
            console.log(
                `${statusIcon} ${actionIcon} ${colors.accent(entry.action.toUpperCase())} - ${entry.accountName}`,
            );
            console.log(`   ${colors.muted("Time:")} ${timestamp}`);
            if (entry.repoPath) {
                console.log(`   ${colors.muted("Repo:")} ${entry.repoPath}`);
            }
            if (entry.method) {
                console.log(
                    `   ${colors.muted("Method:")} ${entry.method.toUpperCase()}`,
                );
            }
            if (entry.platform) {
                console.log(
                    `   ${colors.muted("Platform:")} ${entry.platform}`,
                );
            }
            if (entry.error) {
                console.log(`   ${colors.error("Error:")} ${entry.error}`);
            }
        }

        console.log("");
    }

    if (action === "stats") {
        const stats = getActivityStats();

        console.log("");
        console.log(colors.primary("📊 Activity Statistics"));
        console.log(colors.muted("─".repeat(50)));
        console.log("");

        console.log(colors.accent("Overall Stats:"));
        console.log(`  Total Operations: ${stats.totalOperations}`);
        console.log(
            `  ${colors.success("✓")} Successful: ${stats.successfulOperations}`,
        );
        console.log(`  ${colors.error("✗")} Failed: ${stats.failedOperations}`);
        if (stats.lastActivity) {
            console.log(
                `  Last Activity: ${new Date(stats.lastActivity).toLocaleString()}`,
            );
        }

        console.log("");
        console.log(colors.accent("Account Usage:"));
        const sortedAccounts = Object.entries(stats.accountUsage).sort(
            (a, b) => b[1] - a[1],
        );
        for (const [account, count] of sortedAccounts) {
            console.log(`  ${account}: ${count} operations`);
        }

        if (Object.keys(stats.repoUsage).length > 0) {
            console.log("");
            console.log(colors.accent("Repository Usage:"));
            const sortedRepos = Object.entries(stats.repoUsage)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);
            for (const [repo, count] of sortedRepos) {
                console.log(`  ${repo}: ${count} operations`);
            }
        }

        if (Object.keys(stats.methodUsage).length > 0) {
            console.log("");
            console.log(colors.accent("Method Usage:"));
            for (const [method, count] of Object.entries(stats.methodUsage)) {
                console.log(`  ${method.toUpperCase()}: ${count} operations`);
            }
        }

        if (Object.keys(stats.platformUsage).length > 0) {
            console.log("");
            console.log(colors.accent("Platform Usage:"));
            for (const [platform, count] of Object.entries(
                stats.platformUsage,
            )) {
                console.log(`  ${platform}: ${count} operations`);
            }
        }

        console.log("");
    }

    if (action === "export") {
        const csv = exportToCSV();
        const outputPath = getLogFilePath().replace(".log", ".csv");

        try {
            fs.writeFileSync(outputPath, csv, "utf8");
            showSuccess(`Activity log exported to: ${outputPath}`);
        } catch (e: any) {
            showError(`Failed to export: ${e?.message || String(e)}`);
        }
    }

    if (action === "clear") {
        const { confirm } = await prompts({
            type: "confirm",
            name: "confirm",
            message: "Are you sure you want to clear the activity log?",
            initial: false,
        });

        if (confirm) {
            try {
                clearActivityLog();
                showSuccess("Activity log cleared");
            } catch (e: any) {
                showError(`Failed to clear log: ${e?.message || String(e)}`);
            }
        }
    }
}

/**
 * Clone a repository with account selection
 */
export async function cloneRepositoryFlow(
    repoUrl: string,
    targetDir?: string,
): Promise<void> {
    const { loadConfig } = await import("./config");
    const { cloneRepository, normalizeGitUrl } = await import("./git");
    const cfg = loadConfig();

    showSection("Clone Repository");

    // Validate URL
    const normalized = normalizeGitUrl(repoUrl);
    if (!normalized) {
        showError(`Invalid git URL: ${repoUrl}`);
        return;
    }

    showInfo(`Repository: ${colors.accent(normalized.url)}`);
    showInfo(
        `Auth Type: ${colors.secondary(normalized.isSSH ? "SSH" : "HTTPS")}`,
    );

    // If no accounts configured, clone without account setup
    if (cfg.accounts.length === 0) {
        showWarning("No accounts configured. Cloning without account setup...");

        const { confirm } = await prompts({
            type: "confirm",
            name: "confirm",
            message: stylePrompt("Proceed with clone?"),
            initial: true,
        });

        if (!confirm) {
            showWarning("Clone cancelled");
            return;
        }

        try {
            const spinner = createSpinner("Cloning repository...");
            const clonedDir = await cloneRepository(
                normalized.url,
                targetDir,
                process.cwd(),
            );
            spinner.stop();

            if (clonedDir) {
                showSuccess(`Repository cloned to: ${clonedDir}`);
                showInfo(
                    `Run ${colors.accent("ghe")} inside ${colors.accent(clonedDir)} to configure account`,
                );
            } else {
                showSuccess("Repository cloned successfully");
            }
        } catch (e: any) {
            showError(`Clone failed: ${e?.message || String(e)}`);
        }
        return;
    }

    // Ask user to select account
    showInfo("Select an account to use for this repository:");
    const acc = await chooseAccount(cfg.accounts);
    if (!acc) {
        showWarning("No account selected");
        return;
    }

    // Determine which auth method to use
    let useSSH = normalized.isSSH;
    let authMethod: "ssh" | "token" | null = null;

    if (acc.ssh && acc.token) {
        // Both methods available, let user choose
        const { method } = await prompts({
            type: "select",
            name: "method",
            message: stylePrompt("Choose authentication method"),
            choices: [
                {
                    title: `${colors.primary("🔑 SSH")} - Using key: ${acc.ssh.keyPath}`,
                    value: "ssh",
                },
                {
                    title: `${colors.accent("🔐 Token")} - Using username: ${acc.token.username}`,
                    value: "token",
                },
            ],
        });

        if (!method) {
            showWarning("Clone cancelled");
            return;
        }
        authMethod = method;
        useSSH = method === "ssh";
    } else if (acc.ssh) {
        authMethod = "ssh";
        useSSH = true;
    } else if (acc.token) {
        authMethod = "token";
        useSSH = false;
    } else {
        showError("Selected account has no SSH key or token configured");
        return;
    }

    // Build the remote URL based on auth method
    const platform = detectPlatformFromUrl(normalized.url);
    const repoPath = parseRepoFromUrl(normalized.url);

    if (!repoPath) {
        showError("Could not parse repository path from URL");
        return;
    }

    const cloneUrl = buildRemoteUrl(
        platform,
        repoPath.replace(/\.git$/, ""),
        useSSH,
    );

    showInfo(`Clone URL: ${colors.muted(cloneUrl)}`);

    const { confirm } = await prompts({
        type: "confirm",
        name: "confirm",
        message: stylePrompt("Proceed with clone?"),
        initial: true,
    });

    if (!confirm) {
        showWarning("Clone cancelled");
        return;
    }

    try {
        // Setup authentication before cloning
        if (authMethod === "ssh" && acc.ssh) {
            const keyPath = expandHome(acc.ssh.keyPath);
            const platformHost = getPlatformSshHost(platform);
            await ensureSshConfigBlock(platformHost, keyPath);
            showSuccess(`SSH configured for ${getPlatformName(platform.type)}`);
        } else if (authMethod === "token" && acc.token) {
            await ensureCredentialStore(acc.token.username, acc.token.token);
            showSuccess("Token credentials configured");
        }

        // Clone the repository
        const spinner = createSpinner("Cloning repository...");
        const clonedDir = await cloneRepository(
            cloneUrl,
            targetDir,
            process.cwd(),
        );
        spinner.stop();

        if (clonedDir) {
            // Set git identity in the cloned repo
            const clonedPath = require("path").join(process.cwd(), clonedDir);
            if (acc.gitUserName || acc.gitEmail) {
                await setLocalGitIdentity(
                    acc.gitUserName,
                    acc.gitEmail,
                    clonedPath,
                );
                showSuccess(
                    `Git identity set: ${acc.gitUserName || ""} <${acc.gitEmail || ""}>`,
                );
            }

            showSuccess(`Repository cloned to: ${colors.accent(clonedDir)}`);
            showSuccess(
                `Account ${colors.primary(acc.name)} configured for this repository`,
            );

            // Log activity
            logActivity({
                action: "switch",
                accountName: acc.name,
                repoPath: repoPath.replace(/\.git$/, ""),
                method: authMethod || undefined,
                platform: platform.type,
                success: true,
            });
        } else {
            showSuccess("Repository cloned successfully");
        }
    } catch (e: any) {
        showError(`Clone failed: ${e?.message || String(e)}`);

        // Log failure
        logActivity({
            action: "switch",
            accountName: acc.name,
            repoPath: repoPath?.replace(/\.git$/, "") || repoUrl,
            method: authMethod || undefined,
            platform: platform.type,
            success: false,
            error: e?.message || String(e),
        });
    }
}
