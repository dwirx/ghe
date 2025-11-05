/**
 * Download Module
 * Handles file downloads from Git hosting platforms AND any URL
 */

import * as fs from "fs";
import * as path from "path";
import prompts from "prompts";
import {
    parseGitUrl,
    toRawUrl,
    getFilename,
    toWebUrl,
    toApiUrl,
    type ParsedUrl,
} from "./urlParser";
import {
    downloadFile,
    downloadMultiple,
    getFileInfo,
    formatFileSize,
    getUniqueFilename,
    downloadWithRetry,
    type DownloadOptions,
} from "./utils/downloader";
import {
    colors,
    showSuccess,
    showError,
    showWarning,
    showBox,
    showSection,
} from "./utils/ui";
import { downloadFromUrl as universalDownloadFromUrl } from "./universalDownload";

export type DownloadCommandOptions = {
    output?: string;
    outputDir?: string;
    preservePath?: boolean;
    pattern?: string;
    exclude?: string;
    branch?: string;
    tag?: string;
    commit?: string;
    depth?: number;
    showInfo?: boolean;
    showProgress?: boolean;
    overwrite?: boolean;
    fileList?: string;
    followRedirects?: boolean;
    userAgent?: string;
    headers?: Record<string, string>;
};

/**
 * Check if URL is a git repository URL
 */
function isGitRepositoryUrl(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return (
        lowerUrl.includes("github.com") ||
        lowerUrl.includes("gitlab.com") ||
        lowerUrl.includes("gitlab.") ||
        lowerUrl.includes("bitbucket.org") ||
        lowerUrl.includes("bitbucket.") ||
        lowerUrl.includes("/blob/") ||
        lowerUrl.includes("/tree/") ||
        lowerUrl.includes("/-/blob/") ||
        lowerUrl.includes("/-/tree/") ||
        lowerUrl.includes("/src/")
    );
}

/**
 * Main download flow - single file (UNIVERSAL - handles both git repos and any URL)
 */
export async function downloadSingleFile(
    url: string,
    options: DownloadCommandOptions = {},
): Promise<void> {
    try {
        // Try to detect if this is a git repository URL
        const isGitUrl = isGitRepositoryUrl(url);

        // If not a git URL or parsing fails, use universal downloader
        if (!isGitUrl) {
            await universalDownloadFromUrl(url, {
                output: options.output,
                outputDir: options.outputDir,
                showProgress: options.showProgress !== false,
                overwrite: options.overwrite,
                showInfo: options.showInfo,
                followRedirects: true,
            });
            return;
        }

        // Parse as git URL
        const parsed = parseGitUrl(url);
        if (!parsed) {
            // If git URL parsing fails, fallback to universal download
            await universalDownloadFromUrl(url, {
                output: options.output,
                outputDir: options.outputDir,
                showProgress: options.showProgress !== false,
                overwrite: options.overwrite,
                showInfo: options.showInfo,
                followRedirects: true,
            });
            return;
        }

        // Override branch/tag/commit if specified
        if (options.branch) parsed.branch = options.branch;
        if (options.tag) parsed.branch = options.tag;
        if (options.commit) parsed.branch = options.commit;

        // Check if it's a directory
        if (parsed.isDirectory) {
            showWarning(
                "This appears to be a directory. Use directory download instead.",
            );
            const { proceed } = await prompts({
                type: "confirm",
                name: "proceed",
                message: "Download entire directory?",
                initial: true,
            });

            if (proceed) {
                await downloadDirectory(url, options);
            }
            return;
        }

        // Get raw download URL
        const rawUrl = toRawUrl(parsed);
        const filename = options.output || getFilename(parsed);

        // Show file info if requested
        if (options.showInfo) {
            await showFileInfo(rawUrl, parsed);
            const { proceed } = await prompts({
                type: "confirm",
                name: "proceed",
                message: "Proceed with download?",
                initial: true,
            });

            if (!proceed) {
                return;
            }
        }

        showSection("Downloading File");
        console.log(`URL: ${colors.muted(toWebUrl(parsed))}`);
        console.log(`File: ${colors.accent(filename)}`);
        console.log();

        // Download file
        const result = await downloadWithRetry(rawUrl, filename, {
            outputPath: options.output,
            outputDir: options.outputDir,
            preservePath: options.preservePath,
            showProgress: true,
            overwrite: options.overwrite,
        });

        if (result.success) {
            showSuccess(
                `File saved to: ${colors.accent(result.filePath || filename)}`,
            );
        } else {
            showError(`Download failed: ${result.error}`);
        }
    } catch (error: any) {
        showError(`Download error: ${error?.message || String(error)}`);
    }
}

/**
 * Download multiple files from a list (UNIVERSAL - handles both git repos and any URL)
 */
export async function downloadMultipleFiles(
    urls: string[],
    options: DownloadCommandOptions = {},
): Promise<void> {
    try {
        showSection(`Downloading ${urls.length} Files`);

        const files: Array<{ url: string; filename: string; isGit: boolean }> =
            [];

        for (const url of urls) {
            const isGitUrl = isGitRepositoryUrl(url);

            if (isGitUrl) {
                const parsed = parseGitUrl(url);
                if (!parsed) {
                    // Treat as universal URL
                    const filename = extractFilenameFromAnyUrl(url);
                    files.push({ url, filename, isGit: false });
                    continue;
                }

                // Override branch if specified
                if (options.branch) parsed.branch = options.branch;
                if (options.tag) parsed.branch = options.tag;
                if (options.commit) parsed.branch = options.commit;

                const rawUrl = toRawUrl(parsed);
                const filename = getFilename(parsed);

                files.push({ url: rawUrl, filename, isGit: true });
            } else {
                // Universal URL
                const filename = extractFilenameFromAnyUrl(url);
                files.push({ url, filename, isGit: false });
            }
        }

        if (files.length === 0) {
            showError("No valid URLs to download");
            return;
        }

        const results = await downloadMultiple(
            files.map((f) => ({ url: f.url, filename: f.filename })),
            {
                outputDir: options.outputDir,
                preservePath: options.preservePath,
                showProgress: true,
                overwrite: options.overwrite,
            },
        );

        // Show summary
        const successful = results.filter((r) => r.success).length;
        const failed = results.length - successful;

        console.log();
        if (failed > 0) {
            showWarning(`Downloaded: ${successful}/${results.length} files`);
        } else {
            showSuccess(`Successfully downloaded all ${successful} files`);
        }
    } catch (error: any) {
        showError(`Download error: ${error?.message || String(error)}`);
    }
}

/**
 * Extract filename from any URL
 */
function extractFilenameFromAnyUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const segments = pathname.split("/").filter((s) => s);
        let filename = segments[segments.length - 1] || "download";
        filename = filename.split("?")[0] || "download";
        return decodeURIComponent(filename);
    } catch {
        return "download";
    }
}

/**
 * Download files from a file list
 */
export async function downloadFromFileList(
    fileListPath: string,
    options: DownloadCommandOptions = {},
): Promise<void> {
    try {
        if (!fs.existsSync(fileListPath)) {
            showError(`File list not found: ${fileListPath}`);
            return;
        }

        const content = fs.readFileSync(fileListPath, "utf-8");
        const urls = content
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("#"));

        if (urls.length === 0) {
            showError("No URLs found in file list");
            return;
        }

        await downloadMultipleFiles(urls, options);
    } catch (error: any) {
        showError(
            `Error reading file list: ${error?.message || String(error)}`,
        );
    }
}

/**
 * Download entire directory
 */
export async function downloadDirectory(
    url: string,
    options: DownloadCommandOptions = {},
): Promise<void> {
    try {
        const parsed = parseGitUrl(url);
        if (!parsed) {
            showError(`Invalid URL format: ${url}`);
            return;
        }

        // Override branch if specified
        if (options.branch) parsed.branch = options.branch;
        if (options.tag) parsed.branch = options.tag;
        if (options.commit) parsed.branch = options.commit;

        showSection("Downloading Directory");
        console.log(
            `Repository: ${colors.accent(`${parsed.owner}/${parsed.repo}`)}`,
        );
        console.log(`Branch: ${colors.accent(parsed.branch || "main")}`);
        console.log(`Path: ${colors.accent(parsed.filePath || "/")}`);
        console.log();

        // Fetch directory contents using API
        const files = await fetchDirectoryContents(parsed, options);

        if (files.length === 0) {
            showWarning("No files found in directory");
            return;
        }

        console.log(`Found ${colors.accent(String(files.length))} files`);
        console.log();

        const { proceed } = await prompts({
            type: "confirm",
            name: "proceed",
            message: `Download ${files.length} files?`,
            initial: true,
        });

        if (!proceed) {
            return;
        }

        const results = await downloadMultiple(
            files.map((f) => ({ url: f.url, filename: f.path })),
            {
                outputDir: options.outputDir || parsed.repo,
                preservePath: true,
                showProgress: true,
                overwrite: options.overwrite,
            },
        );

        // Show summary
        const successful = results.filter((r) => r.success).length;
        console.log();
        showSuccess(`Downloaded ${successful}/${files.length} files`);
    } catch (error: any) {
        showError(`Download error: ${error?.message || String(error)}`);
    }
}

/**
 * Download files matching a pattern
 */
export async function downloadWithPattern(
    repoUrl: string,
    pattern: string,
    options: DownloadCommandOptions = {},
): Promise<void> {
    try {
        const parsed = parseGitUrl(repoUrl);
        if (!parsed) {
            showError(`Invalid URL format: ${repoUrl}`);
            return;
        }

        // Override branch if specified
        if (options.branch) parsed.branch = options.branch;
        if (options.tag) parsed.branch = options.tag;
        if (options.commit) parsed.branch = options.commit;

        showSection("Downloading Files with Pattern");
        console.log(
            `Repository: ${colors.accent(`${parsed.owner}/${parsed.repo}`)}`,
        );
        console.log(`Pattern: ${colors.accent(pattern)}`);
        console.log();

        // Fetch all files
        const allFiles = await fetchDirectoryContents(parsed, {
            ...options,
            depth: 999,
        });

        // Filter by pattern
        const matchingFiles = filterFilesByPattern(
            allFiles,
            pattern,
            options.exclude,
        );

        if (matchingFiles.length === 0) {
            showWarning(`No files found matching pattern: ${pattern}`);
            return;
        }

        console.log(
            `Found ${colors.accent(String(matchingFiles.length))} matching files`,
        );
        console.log();

        const { proceed } = await prompts({
            type: "confirm",
            name: "proceed",
            message: `Download ${matchingFiles.length} files?`,
            initial: true,
        });

        if (!proceed) {
            return;
        }

        const results = await downloadMultiple(
            matchingFiles.map((f) => ({ url: f.url, filename: f.path })),
            {
                outputDir: options.outputDir || parsed.repo,
                preservePath: true,
                showProgress: true,
                overwrite: options.overwrite,
            },
        );

        const successful = results.filter((r) => r.success).length;
        console.log();
        showSuccess(`Downloaded ${successful}/${matchingFiles.length} files`);
    } catch (error: any) {
        showError(`Download error: ${error?.message || String(error)}`);
    }
}

/**
 * Download latest release assets
 */
export async function downloadRelease(
    repoUrl: string,
    options: DownloadCommandOptions & { asset?: string; version?: string } = {},
): Promise<void> {
    try {
        const parsed = parseGitUrl(repoUrl);
        if (!parsed || parsed.platform !== "github") {
            showError(
                "Release downloads are only supported for GitHub repositories",
            );
            return;
        }

        showSection("Downloading Release");
        console.log(
            `Repository: ${colors.accent(`${parsed.owner}/${parsed.repo}`)}`,
        );

        // Fetch release info
        const apiUrl = options.version
            ? `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/releases/tags/${options.version}`
            : `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/releases/latest`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
            showError(`Failed to fetch release: ${response.statusText}`);
            return;
        }

        const release: any = await response.json();

        console.log(`Version: ${colors.accent(release.tag_name)}`);
        console.log(
            `Published: ${colors.muted(new Date(release.published_at).toLocaleDateString())}`,
        );
        console.log();

        if (!release.assets || release.assets.length === 0) {
            showWarning("No assets found in this release");
            return;
        }

        let assets = release.assets;

        // Filter by asset name if specified
        if (options.asset) {
            assets = assets.filter((a: any) =>
                a.name.toLowerCase().includes(options.asset!.toLowerCase()),
            );
        }

        if (assets.length === 0) {
            showWarning(`No assets found matching: ${options.asset}`);
            return;
        }

        // Show available assets
        console.log(`Available assets (${assets.length}):`);
        assets.forEach((asset: any) => {
            console.log(
                `  • ${colors.accent(asset.name)} (${formatFileSize(asset.size)})`,
            );
        });
        console.log();

        // Let user select asset(s)
        const { selectedAssets } = await prompts({
            type: "multiselect",
            name: "selectedAssets",
            message: "Select assets to download",
            choices: assets.map((asset: any) => ({
                title: `${asset.name} (${formatFileSize(asset.size)})`,
                value: asset,
            })),
            min: 1,
        });

        if (!selectedAssets || selectedAssets.length === 0) {
            return;
        }

        // Download selected assets
        const files = selectedAssets.map((asset: any) => ({
            url: asset.browser_download_url,
            filename: asset.name,
        }));

        const results = await downloadMultiple(files, {
            outputDir: options.outputDir,
            showProgress: true,
            overwrite: options.overwrite,
        });

        const successful = results.filter((r) => r.success).length;
        console.log();
        showSuccess(`Downloaded ${successful}/${files.length} assets`);
    } catch (error: any) {
        showError(`Download error: ${error?.message || String(error)}`);
    }
}

/**
 * Show file information
 */
async function showFileInfo(url: string, parsed: ParsedUrl): Promise<void> {
    const info = await getFileInfo(url);

    if (!info) {
        showWarning("Could not fetch file information");
        return;
    }

    const lines: string[] = [];
    lines.push(`File: ${colors.accent(info.filename)}`);
    lines.push(`Size: ${colors.text(formatFileSize(info.size))}`);

    if (info.lastModified) {
        lines.push(
            `Last Modified: ${colors.muted(new Date(info.lastModified).toLocaleString())}`,
        );
    }

    lines.push(`Platform: ${colors.text(parsed.platform)}`);
    lines.push(`Repository: ${colors.text(`${parsed.owner}/${parsed.repo}`)}`);
    lines.push(`Branch: ${colors.text(parsed.branch || "main")}`);
    lines.push(`URL: ${colors.muted(url)}`);

    showBox(lines.join("\n"), { title: "File Information", type: "info" });
    console.log();
}

/**
 * Fetch directory contents recursively
 */
async function fetchDirectoryContents(
    parsed: ParsedUrl,
    options: DownloadCommandOptions = {},
): Promise<Array<{ path: string; url: string }>> {
    const files: Array<{ path: string; url: string }> = [];
    const maxDepth = options.depth || 10;

    async function fetchRecursive(
        currentPath: string,
        currentDepth: number,
    ): Promise<void> {
        if (currentDepth > maxDepth) {
            return;
        }

        try {
            const apiUrl = getApiUrlForPath(parsed, currentPath);
            const response = await fetch(apiUrl);

            if (!response.ok) {
                return;
            }

            const contents = await response.json();

            if (!Array.isArray(contents)) {
                return;
            }

            for (const item of contents) {
                if (item.type === "file") {
                    files.push({
                        path: item.path,
                        url:
                            item.download_url ||
                            toRawUrl({ ...parsed, filePath: item.path }),
                    });
                } else if (item.type === "dir" && currentDepth < maxDepth) {
                    await fetchRecursive(item.path, currentDepth + 1);
                }
            }
        } catch (error) {
            // Silently skip errors
        }
    }

    await fetchRecursive(parsed.filePath || "", 0);
    return files;
}

/**
 * Get API URL for specific path
 */
function getApiUrlForPath(parsed: ParsedUrl, filePath: string): string {
    const branch = parsed.branch || "main";

    switch (parsed.platform) {
        case "github":
            return `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${filePath}?ref=${branch}`;
        default:
            throw new Error(
                `API not supported for platform: ${parsed.platform}`,
            );
    }
}

/**
 * Filter files by glob pattern
 */
function filterFilesByPattern(
    files: Array<{ path: string; url: string }>,
    pattern: string,
    excludePattern?: string,
): Array<{ path: string; url: string }> {
    const regexPattern = globToRegex(pattern);
    const excludeRegex = excludePattern ? globToRegex(excludePattern) : null;

    return files.filter((file) => {
        const matches = regexPattern.test(file.path);
        const excluded = excludeRegex ? excludeRegex.test(file.path) : false;
        return matches && !excluded;
    });
}

/**
 * Convert glob pattern to regex
 */
function globToRegex(pattern: string): RegExp {
    let regex = pattern
        .replace(/\./g, "\\.")
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".");

    // Handle ** for any directory depth
    regex = regex.replace(/\*\*\//g, "(?:.+/)?");

    return new RegExp("^" + regex + "$");
}
