#!/usr/bin/env bun
import { main } from "./src/cli";

// Parse command line arguments
const args = process.argv.slice(2);

// Handle direct commands
if (args.length > 0) {
    const command = args[0];

    // Universal download command (dlx) - download anything from any URL
    if (command === "dlx") {
        const {
            downloadFromUrl,
            downloadMultipleUrls,
            downloadFromFileList: downloadUniversalFromFileList,
        } = await import("./src/universalDownload");

        // Parse options
        const options: any = {};
        let urls: string[] = [];

        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            if (!arg) continue;

            if (arg === "-o" || arg === "--output") {
                options.output = args[++i];
            } else if (arg === "-d" || arg === "--dir") {
                options.outputDir = args[++i];
            } else if (arg === "-f" || arg === "--file-list") {
                const fileList = args[++i];
                if (fileList) {
                    await downloadUniversalFromFileList(fileList, options);
                    process.exit(0);
                }
            } else if (arg === "--info") {
                options.showInfo = true;
            } else if (arg === "--progress") {
                options.showProgress = true;
            } else if (arg === "--overwrite") {
                options.overwrite = true;
            } else if (arg === "--no-redirect") {
                options.followRedirects = false;
            } else if (arg === "--user-agent" || arg === "-A") {
                options.userAgent = args[++i];
            } else if (arg === "--header" || arg === "-H") {
                const header = args[++i];
                if (header) {
                    const [key, ...valueParts] = header.split(":");
                    if (key) {
                        const value = valueParts.join(":").trim();
                        if (!options.headers) options.headers = {};
                        options.headers[key.trim()] = value;
                    }
                }
            } else if (!arg.startsWith("-")) {
                urls.push(arg);
            }
        }

        if (urls.length === 0) {
            console.error("Error: No URL specified");
            console.log("Usage: ghe dlx <url> [options]");
            console.log("");
            console.log("Examples:");
            console.log("  ghe dlx https://example.com/file.pdf");
            console.log(
                "  ghe dlx https://example.com/installer.sh -o install.sh",
            );
            console.log(
                "  ghe dlx https://releases.ubuntu.com/22.04/ubuntu.iso -d ~/Downloads/",
            );
            console.log("  ghe dlx url1 url2 url3  # Multiple downloads");
            process.exit(1);
        }

        // Download files
        if (urls.length === 1 && urls[0]) {
            await downloadFromUrl(urls[0], options);
        } else {
            await downloadMultipleUrls(urls, options);
        }

        process.exit(0);
    }

    // Universal download commands (dl, get, fetch-file) - now handles BOTH git repos and any URL!
    if (command === "dl" || command === "get" || command === "fetch-file") {
        const {
            downloadSingleFile,
            downloadMultipleFiles,
            downloadFromFileList,
        } = await import("./src/download");

        // Parse options
        const options: any = {};
        let urls: string[] = [];

        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            if (!arg) continue;

            if (arg === "-o" || arg === "--output") {
                options.output = args[++i];
            } else if (arg === "-O") {
                options.output = null; // keep original name
            } else if (arg === "-d" || arg === "--dir") {
                options.outputDir = args[++i];
            } else if (arg === "--preserve-path") {
                options.preservePath = true;
            } else if (arg === "-f" || arg === "--file-list") {
                const fileList = args[++i];
                if (fileList) {
                    await downloadFromFileList(fileList, options);
                    process.exit(0);
                }
            } else if (arg === "--pattern" || arg === "--glob") {
                options.pattern = args[++i];
            } else if (arg === "--exclude") {
                options.exclude = args[++i];
            } else if (arg === "--branch" || arg === "-b") {
                options.branch = args[++i];
            } else if (arg === "--tag" || arg === "-t") {
                options.tag = args[++i];
            } else if (arg === "--commit" || arg === "-c") {
                options.commit = args[++i];
            } else if (arg === "--info") {
                options.showInfo = true;
            } else if (arg === "--progress") {
                options.showProgress = true;
            } else if (arg === "--overwrite") {
                options.overwrite = true;
            } else if (arg === "--no-redirect") {
                options.followRedirects = false;
            } else if (arg === "--user-agent" || arg === "-A") {
                options.userAgent = args[++i];
            } else if (arg === "--header" || arg === "-H") {
                const header = args[++i];
                if (header) {
                    const [key, ...valueParts] = header.split(":");
                    if (key) {
                        const value = valueParts.join(":").trim();
                        if (!options.headers) options.headers = {};
                        options.headers[key.trim()] = value;
                    }
                }
            } else if (!arg.startsWith("-")) {
                urls.push(arg);
            }
        }

        if (urls.length === 0) {
            console.error("Error: No URL specified");
            console.log("Usage: ghe dl <url> [options]");
            console.log("");
            console.log("Download from Git repositories OR any URL:");
            console.log(
                "  ghe dl https://github.com/user/repo/blob/main/file.md",
            );
            console.log("  ghe dl https://example.com/document.pdf");
            console.log(
                "  ghe dl https://releases.ubuntu.com/22.04/ubuntu.iso",
            );
            process.exit(1);
        }

        // Download files (auto-detects git repo or regular URL)
        if (urls.length === 1 && urls[0]) {
            await downloadSingleFile(urls[0], options);
        } else {
            await downloadMultipleFiles(urls, options);
        }

        process.exit(0);
    }

    if (command === "dl-dir") {
        const { downloadDirectory, downloadWithPattern } = await import(
            "./src/download"
        );

        const options: any = {};
        let url = "";

        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            if (!arg) continue;

            if (arg === "-d" || arg === "--dir") {
                options.outputDir = args[++i];
            } else if (arg === "--depth") {
                const depthArg = args[++i];
                if (depthArg) {
                    options.depth = parseInt(depthArg, 10);
                }
            } else if (arg === "--branch" || arg === "-b") {
                options.branch = args[++i];
            } else if (arg === "--pattern") {
                options.pattern = args[++i];
            } else if (arg === "--exclude") {
                options.exclude = args[++i];
            } else if (arg === "--overwrite") {
                options.overwrite = true;
            } else if (!arg.startsWith("-")) {
                url = arg;
            }
        }

        if (!url) {
            console.error("Error: No URL specified");
            console.log("Usage: ghe dl-dir <url> [options]");
            process.exit(1);
        }

        if (options.pattern) {
            await downloadWithPattern(url, options.pattern, options);
        } else {
            await downloadDirectory(url, options);
        }

        process.exit(0);
    }

    if (command === "dl-release") {
        const { downloadRelease } = await import("./src/download");

        const options: any = {};
        let url = "";

        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            if (!arg) continue;

            if (arg === "--asset") {
                options.asset = args[++i];
            } else if (arg === "--version" || arg === "-v") {
                options.version = args[++i];
            } else if (arg === "-d" || arg === "--dir") {
                options.outputDir = args[++i];
            } else if (arg === "--overwrite") {
                options.overwrite = true;
            } else if (!arg.startsWith("-")) {
                url = arg;
            }
        }

        if (!url) {
            console.error("Error: No URL specified");
            console.log("Usage: ghe dl-release <repo-url> [options]");
            process.exit(1);
        }

        await downloadRelease(url, options);
        process.exit(0);
    }

    // Check if first argument is a URL (for git clone functionality)
    if (
        command &&
        (command.startsWith("http://") ||
            command.startsWith("https://") ||
            command.startsWith("git@") ||
            command.startsWith("ssh://"))
    ) {
        // ghe <repo-url> [target-dir]
        const { cloneRepositoryFlow } = await import("./src/flows");
        const repoUrl = command;
        const targetDir = args[1]; // optional
        await cloneRepositoryFlow(repoUrl, targetDir);
        process.exit(0);
    }

    // CLI Shortcuts
    if (command === "switch" && args.length > 1) {
        // ghe switch <account-name>
        const { switchToAccount } = await import("./src/shortcuts");
        const accountName = args[1];
        if (accountName) {
            await switchToAccount(accountName);
        }
        process.exit(0);
    }

    if (command === "quick") {
        // ghe quick - quick switch menu
        const { quickSwitch } = await import("./src/shortcuts");
        await quickSwitch();
        process.exit(0);
    }

    if (command === "status") {
        // ghe status - show current repo status
        const { showStatus } = await import("./src/shortcuts");
        await showStatus();
        process.exit(0);
    }

    if (command === "list") {
        // ghe list - list all accounts
        const { listAccounts } = await import("./src/shortcuts");
        await listAccounts();
        process.exit(0);
    }

    if (command === "shove" && args.length > 1) {
        // ghe shove <message> - add, commit with message, confirm push
        const { shove } = await import("./src/shortcuts");
        const message = args.slice(1).join(" ");
        await shove(message);
        process.exit(0);
    }

    if (command === "shovenc") {
        // ghe shovenc - add, commit with empty message, confirm push
        const { shoveNoCommit } = await import("./src/shortcuts");
        await shoveNoCommit();
        process.exit(0);
    }

    if (command === "health") {
        // ghe health - check health of all accounts
        const { healthCheckFlow } = await import("./src/flows");
        await healthCheckFlow();
        process.exit(0);
    }

    if (command === "log") {
        // ghe log - show activity log
        const { showActivityLogFlow } = await import("./src/flows");
        await showActivityLogFlow();
        process.exit(0);
    }

    if (command === "lazy") {
        // ghe lazy - launch lazygit
        const { lazyGit } = await import("./src/shortcuts");
        await lazyGit();
        process.exit(0);
    }

    if (command === "shortcuts" || command === "shortcut") {
        // ghe shortcuts [search-query] - show all shortcuts or search
        // ghe shortcuts -i / --interactive - interactive mode
        const { showShortcuts } = await import("./src/shortcuts");

        // Check for interactive flag
        const hasInteractiveFlag = args.includes("-i") || args.includes("--interactive");

        if (hasInteractiveFlag) {
            // Interactive mode
            await showShortcuts(undefined, true);
        } else {
            // Normal mode with optional search
            const searchQuery = args.slice(1).filter(arg => !arg.startsWith("-")).join(" ");
            await showShortcuts(searchQuery || undefined, false);
        }
        process.exit(0);
    }

    if (command === "setname") {
        // ghe setname <name> - set global git user.name
        const { setGlobalUserName } = await import("./src/git");
        const { showSuccess, showError } = await import("./src/utils/ui");

        if (args.length < 2 || !args[1]) {
            showError("Please provide a username");
            console.log("Usage: ghe setname <username>");
            console.log('Example: ghe setname "John Doe"');
            process.exit(1);
        }

        try {
            const userName = args.slice(1).join(" ");
            await setGlobalUserName(userName);
            showSuccess(`Git user.name set to: ${userName}`);
        } catch (e: any) {
            showError(`Failed to set git user.name: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "setmail") {
        // ghe setmail <email> - set global git user.email
        const { setGlobalUserEmail } = await import("./src/git");
        const { showSuccess, showError } = await import("./src/utils/ui");

        if (args.length < 2 || !args[1]) {
            showError("Please provide an email address");
            console.log("Usage: ghe setmail <email>");
            console.log("Example: ghe setmail john.doe@example.com");
            process.exit(1);
        }

        try {
            const email = args[1];
            await setGlobalUserEmail(email);
            showSuccess(`Git user.email set to: ${email}`);
        } catch (e: any) {
            showError(
                `Failed to set git user.email: ${e?.message || String(e)}`,
            );
        }
        process.exit(0);
    }

    if (command === "showconfig") {
        // ghe showconfig - show git config list
        const { getGitConfigList } = await import("./src/git");
        const { showSuccess, showError, showSection } = await import(
            "./src/utils/ui"
        );

        try {
            showSection("Git Configuration");
            const config = await getGitConfigList();
            console.log(config);
            console.log("");
            showSuccess("Git configuration displayed successfully");
        } catch (e: any) {
            showError(`Failed to get git config: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Git Branch Viewing Commands
    if (command === "gb") {
        // ghe gb - git branch
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "branch"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to list branches: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gba") {
        // ghe gba - git branch -a
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "branch", "-a"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to list all branches: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gbr") {
        // ghe gbr - git branch -r
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "branch", "-r"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to list remote branches: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gsb") {
        // ghe gsb - git show-branch
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "show-branch"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to show branch comparison: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gs") {
        // ghe gs - git status
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "status"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to show status: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Git Branch Creation Commands
    if (command === "gbn") {
        // ghe gbn <branch-name> - git branch <branch-name>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        if (args.length < 2 || !args[1]) {
            showError("Please provide a branch name");
            console.log("Usage: ghe gbn <branch-name>");
            console.log("Example: ghe gbn feature/new-feature");
            process.exit(1);
        }

        try {
            const branchName = args[1];
            await run(["git", "branch", branchName], { cwd: process.cwd() });
            showSuccess(`Branch '${branchName}' created successfully`);
        } catch (e: any) {
            showError(`Failed to create branch: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gcb") {
        // ghe gcb <branch-name> - git checkout -b <branch-name>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        if (args.length < 2 || !args[1]) {
            showError("Please provide a branch name");
            console.log("Usage: ghe gcb <branch-name>");
            console.log("Example: ghe gcb feature/new-feature");
            process.exit(1);
        }

        try {
            const branchName = args[1];
            await run(["git", "checkout", "-b", branchName], { cwd: process.cwd() });
            showSuccess(`Branch '${branchName}' created and switched to`);
        } catch (e: any) {
            showError(`Failed to create and checkout branch: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gsc") {
        // ghe gsc <branch-name> - git switch -c <branch-name>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        if (args.length < 2 || !args[1]) {
            showError("Please provide a branch name");
            console.log("Usage: ghe gsc <branch-name>");
            console.log("Example: ghe gsc feature/new-feature");
            process.exit(1);
        }

        try {
            const branchName = args[1];
            await run(["git", "switch", "-c", branchName], { cwd: process.cwd() });
            showSuccess(`Branch '${branchName}' created and switched to`);
        } catch (e: any) {
            showError(`Failed to create and switch branch: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Git Branch Switching Commands
    if (command === "gco") {
        // ghe gco <branch-name> - git checkout <branch-name>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        if (args.length < 2 || !args[1]) {
            showError("Please provide a branch name");
            console.log("Usage: ghe gco <branch-name>");
            console.log("Example: ghe gco main");
            process.exit(1);
        }

        try {
            const branchName = args[1];
            await run(["git", "checkout", branchName], { cwd: process.cwd() });
            showSuccess(`Switched to branch '${branchName}'`);
        } catch (e: any) {
            showError(`Failed to checkout branch: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gsw") {
        // ghe gsw <branch-name> - git switch <branch-name>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        if (args.length < 2 || !args[1]) {
            showError("Please provide a branch name");
            console.log("Usage: ghe gsw <branch-name>");
            console.log("Example: ghe gsw main");
            process.exit(1);
        }

        try {
            const branchName = args[1];
            await run(["git", "switch", branchName], { cwd: process.cwd() });
            showSuccess(`Switched to branch '${branchName}'`);
        } catch (e: any) {
            showError(`Failed to switch branch: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gback") {
        // ghe gback - git checkout -
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "checkout", "-"], { cwd: process.cwd() });
            showSuccess("Switched to previous branch");
        } catch (e: any) {
            showError(`Failed to switch to previous branch: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Git Fetch/Pull Commands
    if (command === "gf") {
        // ghe gf - git fetch origin
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError, showInfo } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            showInfo("Fetching from origin...");
            await run(["git", "fetch", "origin"], { cwd: process.cwd() });
            showSuccess("Fetch completed successfully");
        } catch (e: any) {
            showError(`Failed to fetch from origin: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gp") {
        // ghe gp - git pull
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError, showInfo } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            showInfo("Pulling from remote...");
            await run(["git", "pull"], { cwd: process.cwd() });
            showSuccess("Pull completed successfully");
        } catch (e: any) {
            showError(`Failed to pull from remote: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Branch Management Commands
    if (command === "gbd") {
        // ghe gbd <branch> - git branch -d <branch>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        if (args.length < 2 || !args[1]) {
            showError("Please provide a branch name");
            console.log("Usage: ghe gbd <branch-name>");
            process.exit(1);
        }

        try {
            const branchName = args[1];
            await run(["git", "branch", "-d", branchName], { cwd: process.cwd() });
            showSuccess(`Branch '${branchName}' deleted successfully`);
        } catch (e: any) {
            showError(`Failed to delete branch: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gbD") {
        // ghe gbD <branch> - git branch -D <branch>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        if (args.length < 2 || !args[1]) {
            showError("Please provide a branch name");
            console.log("Usage: ghe gbD <branch-name>");
            process.exit(1);
        }

        try {
            const branchName = args[1];
            await run(["git", "branch", "-D", branchName], { cwd: process.cwd() });
            showSuccess(`Branch '${branchName}' force deleted successfully`);
        } catch (e: any) {
            showError(`Failed to force delete branch: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gbm") {
        // ghe gbm <new-name> - git branch -m <new-name>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        if (args.length < 2 || !args[1]) {
            showError("Please provide a new branch name");
            console.log("Usage: ghe gbm <new-branch-name>");
            process.exit(1);
        }

        try {
            const newName = args[1];
            await run(["git", "branch", "-m", newName], { cwd: process.cwd() });
            showSuccess(`Branch renamed to '${newName}'`);
        } catch (e: any) {
            showError(`Failed to rename branch: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Additional Fetch/Pull Commands
    if (command === "gfa") {
        // ghe gfa - git fetch --all
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError, showInfo } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            showInfo("Fetching from all remotes...");
            await run(["git", "fetch", "--all"], { cwd: process.cwd() });
            showSuccess("Fetch from all remotes completed");
        } catch (e: any) {
            showError(`Failed to fetch: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gpr") {
        // ghe gpr - git pull --rebase
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError, showInfo } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            showInfo("Pulling with rebase...");
            await run(["git", "pull", "--rebase"], { cwd: process.cwd() });
            showSuccess("Pull with rebase completed");
        } catch (e: any) {
            showError(`Failed to pull with rebase: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Commit Commands
    if (command === "gc") {
        // ghe gc <message> - git commit -m <message>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        const message = args.slice(1).join(" ");
        if (!message) {
            showError("Please provide a commit message");
            console.log("Usage: ghe gc <message>");
            process.exit(1);
        }

        try {
            await run(["git", "commit", "-m", message], { cwd: process.cwd() });
            showSuccess("Committed successfully");
        } catch (e: any) {
            showError(`Failed to commit: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gca") {
        // ghe gca <message> - git commit -am <message>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError, showInfo } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        const message = args.slice(1).join(" ");
        if (!message) {
            showError("Please provide a commit message");
            console.log("Usage: ghe gca <message>");
            process.exit(1);
        }

        try {
            showInfo("Adding all changes and committing...");
            await run(["git", "commit", "-am", message], { cwd: process.cwd() });
            showSuccess("Committed successfully");
        } catch (e: any) {
            showError(`Failed to commit: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gcam") {
        // ghe gcam <message> - git commit --amend -m <message>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        const message = args.slice(1).join(" ");
        if (!message) {
            showError("Please provide a commit message");
            console.log("Usage: ghe gcam <message>");
            process.exit(1);
        }

        try {
            await run(["git", "commit", "--amend", "-m", message], { cwd: process.cwd() });
            showSuccess("Commit amended successfully");
        } catch (e: any) {
            showError(`Failed to amend commit: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gcan") {
        // ghe gcan - git commit --amend --no-edit
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "commit", "--amend", "--no-edit"], { cwd: process.cwd() });
            showSuccess("Commit amended successfully");
        } catch (e: any) {
            showError(`Failed to amend commit: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Add/Stage Commands
    if (command === "ga") {
        // ghe ga - git add .
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "add", "."], { cwd: process.cwd() });
            showSuccess("All changes added to staging");
        } catch (e: any) {
            showError(`Failed to add changes: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gaa") {
        // ghe gaa - git add --all
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "add", "--all"], { cwd: process.cwd() });
            showSuccess("All changes added to staging");
        } catch (e: any) {
            showError(`Failed to add changes: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gap") {
        // ghe gap - git add -p
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "add", "-p"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to add changes: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Push Commands
    if (command === "gps") {
        // ghe gps - git push
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError, showInfo } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            showInfo("Pushing to remote...");
            await run(["git", "push"], { cwd: process.cwd() });
            showSuccess("Pushed successfully");
        } catch (e: any) {
            showError(`Failed to push: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gpsu") {
        // ghe gpsu - git push -u origin HEAD
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError, showInfo } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            showInfo("Pushing and setting upstream...");
            await run(["git", "push", "-u", "origin", "HEAD"], { cwd: process.cwd() });
            showSuccess("Pushed and set upstream successfully");
        } catch (e: any) {
            showError(`Failed to push: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gpsf") {
        // ghe gpsf - git push --force-with-lease
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError, showInfo } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            showInfo("Force pushing with lease...");
            await run(["git", "push", "--force-with-lease"], { cwd: process.cwd() });
            showSuccess("Force pushed successfully");
        } catch (e: any) {
            showError(`Failed to force push: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Log Commands
    if (command === "gl") {
        // ghe gl - git log --oneline
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "log", "--oneline"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to show log: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gll") {
        // ghe gll - git log --graph --oneline --all
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "log", "--graph", "--oneline", "--all"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to show log: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "glog") {
        // ghe glog - detailed colored log
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "log", "--graph", "--pretty=format:%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to show log: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Diff Commands
    if (command === "gd") {
        // ghe gd - git diff
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "diff"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to show diff: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gds") {
        // ghe gds - git diff --staged
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "diff", "--staged"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to show diff: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gdh") {
        // ghe gdh - git diff HEAD
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "diff", "HEAD"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to show diff: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Stash Commands
    if (command === "gst") {
        // ghe gst - git stash
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "stash"], { cwd: process.cwd() });
            showSuccess("Changes stashed successfully");
        } catch (e: any) {
            showError(`Failed to stash: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gstp") {
        // ghe gstp - git stash pop
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "stash", "pop"], { cwd: process.cwd() });
            showSuccess("Stash applied and removed");
        } catch (e: any) {
            showError(`Failed to pop stash: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gsta") {
        // ghe gsta - git stash apply
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "stash", "apply"], { cwd: process.cwd() });
            showSuccess("Stash applied successfully");
        } catch (e: any) {
            showError(`Failed to apply stash: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gstl") {
        // ghe gstl - git stash list
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "stash", "list"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to list stash: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gstd") {
        // ghe gstd - git stash drop
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "stash", "drop"], { cwd: process.cwd() });
            showSuccess("Stash dropped successfully");
        } catch (e: any) {
            showError(`Failed to drop stash: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Merge Commands
    if (command === "gm") {
        // ghe gm <branch> - git merge <branch>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        if (args.length < 2 || !args[1]) {
            showError("Please provide a branch name");
            console.log("Usage: ghe gm <branch-name>");
            process.exit(1);
        }

        try {
            const branchName = args[1];
            await run(["git", "merge", branchName], { cwd: process.cwd() });
            showSuccess(`Merged '${branchName}' successfully`);
        } catch (e: any) {
            showError(`Failed to merge: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gma") {
        // ghe gma - git merge --abort
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "merge", "--abort"], { cwd: process.cwd() });
            showSuccess("Merge aborted");
        } catch (e: any) {
            showError(`Failed to abort merge: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gmc") {
        // ghe gmc - git merge --continue
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "merge", "--continue"], { cwd: process.cwd() });
            showSuccess("Merge continued");
        } catch (e: any) {
            showError(`Failed to continue merge: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Rebase Commands
    if (command === "grb") {
        // ghe grb <branch> - git rebase <branch>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        if (args.length < 2 || !args[1]) {
            showError("Please provide a branch name");
            console.log("Usage: ghe grb <branch-name>");
            process.exit(1);
        }

        try {
            const branchName = args[1];
            await run(["git", "rebase", branchName], { cwd: process.cwd() });
            showSuccess(`Rebased onto '${branchName}' successfully`);
        } catch (e: any) {
            showError(`Failed to rebase: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "grba") {
        // ghe grba - git rebase --abort
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "rebase", "--abort"], { cwd: process.cwd() });
            showSuccess("Rebase aborted");
        } catch (e: any) {
            showError(`Failed to abort rebase: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "grbc") {
        // ghe grbc - git rebase --continue
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "rebase", "--continue"], { cwd: process.cwd() });
            showSuccess("Rebase continued");
        } catch (e: any) {
            showError(`Failed to continue rebase: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Reset Commands
    if (command === "grh") {
        // ghe grh - git reset HEAD
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "reset", "HEAD"], { cwd: process.cwd() });
            showSuccess("All changes unstaged");
        } catch (e: any) {
            showError(`Failed to reset: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "grhh") {
        // ghe grhh - git reset --hard HEAD
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError, showWarning } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            showWarning("This will discard all uncommitted changes!");
            await run(["git", "reset", "--hard", "HEAD"], { cwd: process.cwd() });
            showSuccess("All changes discarded");
        } catch (e: any) {
            showError(`Failed to reset: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "grsh") {
        // ghe grsh - git reset --soft HEAD~1
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "reset", "--soft", "HEAD~1"], { cwd: process.cwd() });
            showSuccess("Last commit undone, changes kept staged");
        } catch (e: any) {
            showError(`Failed to reset: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Remote Commands
    if (command === "gr") {
        // ghe gr - git remote -v
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "remote", "-v"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to show remotes: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gra") {
        // ghe gra <name> <url> - git remote add <name> <url>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        if (args.length < 3 || !args[1] || !args[2]) {
            showError("Please provide remote name and URL");
            console.log("Usage: ghe gra <name> <url>");
            console.log("Example: ghe gra upstream https://github.com/user/repo.git");
            process.exit(1);
        }

        try {
            const name = args[1];
            const url = args[2];
            await run(["git", "remote", "add", name, url], { cwd: process.cwd() });
            showSuccess(`Remote '${name}' added successfully`);
        } catch (e: any) {
            showError(`Failed to add remote: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "grr") {
        // ghe grr <name> - git remote remove <name>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        if (args.length < 2 || !args[1]) {
            showError("Please provide remote name");
            console.log("Usage: ghe grr <name>");
            process.exit(1);
        }

        try {
            const name = args[1];
            await run(["git", "remote", "remove", name], { cwd: process.cwd() });
            showSuccess(`Remote '${name}' removed successfully`);
        } catch (e: any) {
            showError(`Failed to remove remote: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Clean Commands
    if (command === "gclean") {
        // ghe gclean - git clean -fd
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError, showWarning } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            showWarning("Removing untracked files and directories...");
            await run(["git", "clean", "-fd"], { cwd: process.cwd() });
            showSuccess("Untracked files removed");
        } catch (e: any) {
            showError(`Failed to clean: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gcleann") {
        // ghe gcleann - git clean -fdn
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "clean", "-fdn"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to preview clean: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Tag Commands
    if (command === "gt") {
        // ghe gt - git tag
        const { run } = await import("./src/utils/shell");
        const { showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        try {
            await run(["git", "tag"], { cwd: process.cwd() });
        } catch (e: any) {
            showError(`Failed to list tags: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gta") {
        // ghe gta <tag> - git tag -a <tag>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        if (args.length < 2 || !args[1]) {
            showError("Please provide a tag name");
            console.log("Usage: ghe gta <tag-name>");
            console.log("Example: ghe gta v1.0.0");
            process.exit(1);
        }

        try {
            const tagName = args[1];
            await run(["git", "tag", "-a", tagName], { cwd: process.cwd() });
            showSuccess(`Tag '${tagName}' created`);
        } catch (e: any) {
            showError(`Failed to create tag: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    if (command === "gtd") {
        // ghe gtd <tag> - git tag -d <tag>
        const { run } = await import("./src/utils/shell");
        const { showSuccess, showError } = await import("./src/utils/ui");
        const { isGitRepo } = await import("./src/git");

        if (!(await isGitRepo(process.cwd()))) {
            showError("Not in a git repository");
            process.exit(1);
        }

        if (args.length < 2 || !args[1]) {
            showError("Please provide a tag name");
            console.log("Usage: ghe gtd <tag-name>");
            process.exit(1);
        }

        try {
            const tagName = args[1];
            await run(["git", "tag", "-d", tagName], { cwd: process.cwd() });
            showSuccess(`Tag '${tagName}' deleted`);
        } catch (e: any) {
            showError(`Failed to delete tag: ${e?.message || String(e)}`);
        }
        process.exit(0);
    }

    // Help and version are handled in main()
}

// Start interactive mode
main();
