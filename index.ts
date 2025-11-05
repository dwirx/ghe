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
            console.log("Usage: ghux dlx <url> [options]");
            console.log("");
            console.log("Examples:");
            console.log("  ghux dlx https://example.com/file.pdf");
            console.log(
                "  ghux dlx https://example.com/installer.sh -o install.sh",
            );
            console.log(
                "  ghux dlx https://releases.ubuntu.com/22.04/ubuntu.iso -d ~/Downloads/",
            );
            console.log("  ghux dlx url1 url2 url3  # Multiple downloads");
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
            console.log("Usage: ghux dl <url> [options]");
            console.log("");
            console.log("Download from Git repositories OR any URL:");
            console.log(
                "  ghux dl https://github.com/user/repo/blob/main/file.md",
            );
            console.log("  ghux dl https://example.com/document.pdf");
            console.log(
                "  ghux dl https://releases.ubuntu.com/22.04/ubuntu.iso",
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
            console.log("Usage: ghux dl-dir <url> [options]");
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
            console.log("Usage: ghux dl-release <repo-url> [options]");
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
        // ghux <repo-url> [target-dir]
        const { cloneRepositoryFlow } = await import("./src/flows");
        const repoUrl = command;
        const targetDir = args[1]; // optional
        await cloneRepositoryFlow(repoUrl, targetDir);
        process.exit(0);
    }

    // CLI Shortcuts
    if (command === "switch" && args.length > 1) {
        // ghux switch <account-name>
        const { switchToAccount } = await import("./src/shortcuts");
        const accountName = args[1];
        if (accountName) {
            await switchToAccount(accountName);
        }
        process.exit(0);
    }

    if (command === "quick") {
        // ghux quick - quick switch menu
        const { quickSwitch } = await import("./src/shortcuts");
        await quickSwitch();
        process.exit(0);
    }

    if (command === "status") {
        // ghux status - show current repo status
        const { showStatus } = await import("./src/shortcuts");
        await showStatus();
        process.exit(0);
    }

    if (command === "list") {
        // ghux list - list all accounts
        const { listAccounts } = await import("./src/shortcuts");
        await listAccounts();
        process.exit(0);
    }

    if (command === "shove" && args.length > 1) {
        // ghux shove <message> - add, commit with message, confirm push
        const { shove } = await import("./src/shortcuts");
        const message = args.slice(1).join(" ");
        await shove(message);
        process.exit(0);
    }

    if (command === "shovenc") {
        // ghux shovenc - add, commit with empty message, confirm push
        const { shoveNoCommit } = await import("./src/shortcuts");
        await shoveNoCommit();
        process.exit(0);
    }

    if (command === "health") {
        // ghux health - check health of all accounts
        const { healthCheckFlow } = await import("./src/flows");
        await healthCheckFlow();
        process.exit(0);
    }

    if (command === "log") {
        // ghux log - show activity log
        const { showActivityLogFlow } = await import("./src/flows");
        await showActivityLogFlow();
        process.exit(0);
    }

    // Help and version are handled in main()
}

// Start interactive mode
main();
