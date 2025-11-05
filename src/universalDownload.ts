/**
 * Universal Download Module
 * Download any file from any URL (like curl/wget)
 */

import * as fs from "fs";
import * as path from "path";
import ora from "ora";
import {
    colors,
    showSuccess,
    showError,
    showWarning,
    showBox,
} from "./utils/ui";
import { ensureDirectory } from "./utils/platform";

export type UniversalDownloadOptions = {
    output?: string;
    outputDir?: string;
    showProgress?: boolean;
    overwrite?: boolean;
    showInfo?: boolean;
    resume?: boolean;
    followRedirects?: boolean;
    maxRedirects?: number;
    userAgent?: string;
    headers?: Record<string, string>;
    timeout?: number;
};

export type DownloadProgress = {
    downloaded: number;
    total: number;
    percentage: number;
    speed: number;
};

/**
 * Download file from any URL (universal downloader)
 */
export async function downloadFromUrl(
    url: string,
    options: UniversalDownloadOptions = {},
): Promise<boolean> {
    const spinner = options.showProgress !== false ? ora() : null;

    try {
        // Validate URL
        if (!isValidUrl(url)) {
            showError(`Invalid URL: ${url}`);
            return false;
        }

        // Show info if requested
        if (options.showInfo) {
            const info = await getUrlInfo(url, options);
            if (info) {
                displayFileInfo(info, url);
                const { default: prompts } = await import("prompts");
                const { proceed } = await prompts({
                    type: "confirm",
                    name: "proceed",
                    message: "Proceed with download?",
                    initial: true,
                });

                if (!proceed) {
                    return false;
                }
            }
        }

        // Determine output filename
        const filename = options.output || extractFilenameFromUrl(url);
        const outputPath = options.outputDir
            ? path.join(options.outputDir, filename)
            : filename;

        // Check if file exists
        if (!options.overwrite && fs.existsSync(outputPath)) {
            showWarning(`File already exists: ${outputPath}`);
            const { default: prompts } = await import("prompts");
            const { overwrite } = await prompts({
                type: "confirm",
                name: "overwrite",
                message: "Overwrite existing file?",
                initial: false,
            });

            if (!overwrite) {
                return false;
            }
        }

        // Ensure output directory exists
        const dir = path.dirname(outputPath);
        ensureDirectory(dir);

        spinner?.start(`Downloading ${colors.accent(filename)}...`);

        // Download with progress tracking
        const result = await downloadWithProgress(
            url,
            outputPath,
            options,
            (progress) => {
                if (spinner && options.showProgress !== false) {
                    const percent = progress.percentage.toFixed(1);
                    const downloaded = formatBytes(progress.downloaded);
                    const total =
                        progress.total > 0
                            ? formatBytes(progress.total)
                            : "unknown";
                    const speed = formatBytes(progress.speed) + "/s";

                    spinner.text = `Downloading ${colors.accent(filename)} - ${percent}% (${downloaded}/${total}) @ ${speed}`;
                }
            },
        );

        if (result.success) {
            const size = fs.statSync(outputPath).size;
            spinner?.succeed(
                `Downloaded ${colors.success(filename)} (${colors.muted(formatBytes(size))})`,
            );
            console.log(`Saved to: ${colors.accent(outputPath)}`);
            return true;
        } else {
            spinner?.fail(`Download failed: ${result.error}`);
            return false;
        }
    } catch (error: any) {
        spinner?.fail();
        showError(`Download error: ${error?.message || String(error)}`);
        return false;
    }
}

/**
 * Download file with progress tracking
 */
async function downloadWithProgress(
    url: string,
    outputPath: string,
    options: UniversalDownloadOptions,
    onProgress?: (progress: DownloadProgress) => void,
): Promise<{ success: boolean; error?: string }> {
    try {
        const headers: Record<string, string> = {
            "User-Agent":
                options.userAgent || "GhUx/1.0.5 (Universal Downloader)",
            ...options.headers,
        };

        // Fetch with custom options
        const response = await fetch(url, {
            method: "GET",
            headers,
            redirect: options.followRedirects !== false ? "follow" : "manual",
        });

        if (!response.ok) {
            return {
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        // Get content length
        const contentLength = response.headers.get("content-length");
        const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

        // Read response body as stream
        const reader = response.body?.getReader();
        if (!reader) {
            return { success: false, error: "Failed to get response body" };
        }

        const chunks: Uint8Array[] = [];
        let downloadedBytes = 0;
        let lastTime = Date.now();
        let lastBytes = 0;

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            if (value) {
                chunks.push(value);
                downloadedBytes += value.length;

                // Calculate progress
                const now = Date.now();
                const timeDiff = (now - lastTime) / 1000; // seconds
                const bytesDiff = downloadedBytes - lastBytes;
                const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;

                if (
                    onProgress &&
                    (timeDiff > 0.5 || downloadedBytes === totalBytes)
                ) {
                    onProgress({
                        downloaded: downloadedBytes,
                        total: totalBytes,
                        percentage:
                            totalBytes > 0
                                ? (downloadedBytes / totalBytes) * 100
                                : 0,
                        speed,
                    });
                    lastTime = now;
                    lastBytes = downloadedBytes;
                }
            }
        }

        // Combine chunks and write to file
        const totalLength = chunks.reduce(
            (acc, chunk) => acc + chunk.length,
            0,
        );
        const buffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            buffer.set(chunk, offset);
            offset += chunk.length;
        }

        fs.writeFileSync(outputPath, buffer);

        return { success: true };
    } catch (error: any) {
        return {
            success: false,
            error: error?.message || String(error),
        };
    }
}

/**
 * Get file info from URL
 */
async function getUrlInfo(
    url: string,
    options: UniversalDownloadOptions,
): Promise<{
    filename: string;
    size: number;
    contentType?: string;
    lastModified?: string;
} | null> {
    try {
        const headers: Record<string, string> = {
            "User-Agent":
                options.userAgent || "GhUx/1.0.5 (Universal Downloader)",
            ...options.headers,
        };

        const response = await fetch(url, {
            method: "HEAD",
            headers,
            redirect: options.followRedirects !== false ? "follow" : "manual",
        });

        if (!response.ok) {
            return null;
        }

        const contentLength = response.headers.get("content-length");
        const contentType = response.headers.get("content-type");
        const lastModified = response.headers.get("last-modified");
        const filename =
            extractFilenameFromUrl(url) ||
            extractFilenameFromHeaders(response.headers) ||
            "download";

        return {
            filename,
            size: contentLength ? parseInt(contentLength, 10) : 0,
            contentType: contentType || undefined,
            lastModified: lastModified || undefined,
        };
    } catch (error) {
        return null;
    }
}

/**
 * Display file information
 */
function displayFileInfo(
    info: {
        filename: string;
        size: number;
        contentType?: string;
        lastModified?: string;
    },
    url: string,
): void {
    const lines: string[] = [];
    lines.push(`File: ${colors.accent(info.filename)}`);
    lines.push(`Size: ${colors.text(formatBytes(info.size))}`);

    if (info.contentType) {
        lines.push(`Type: ${colors.text(info.contentType)}`);
    }

    if (info.lastModified) {
        lines.push(
            `Last Modified: ${colors.muted(new Date(info.lastModified).toLocaleString())}`,
        );
    }

    lines.push(`URL: ${colors.muted(url)}`);

    showBox(lines.join("\n"), { title: "File Information", type: "info" });
    console.log();
}

/**
 * Extract filename from URL
 */
function extractFilenameFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;

        // Get last segment of path
        const segments = pathname.split("/").filter((s) => s);
        let filename = segments[segments.length - 1] || "download";

        // Remove query parameters
        filename = filename.split("?")[0] || "download";

        // Decode URI component
        filename = decodeURIComponent(filename);

        // If no extension, try to guess from content-type or URL
        if (!filename.includes(".")) {
            // Try to get extension from URL
            const urlPath = urlObj.pathname;
            const ext = path.extname(urlPath);
            if (ext) {
                filename += ext;
            }
        }

        return sanitizeFilename(filename);
    } catch {
        return "download";
    }
}

/**
 * Extract filename from Content-Disposition header
 */
function extractFilenameFromHeaders(headers: Headers): string | null {
    const disposition = headers.get("content-disposition");
    if (!disposition) return null;

    const filenameMatch = disposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
    );
    if (filenameMatch && filenameMatch[1]) {
        let filename = filenameMatch[1].replace(/['"]/g, "");
        return sanitizeFilename(filename);
    }

    return null;
}

/**
 * Sanitize filename for safe file system usage
 */
function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[<>:"|?*]/g, "_") // Replace invalid chars
        .replace(/\.\./g, "_") // Prevent directory traversal
        .replace(/^\./, "_") // Prevent hidden files
        .replace(/\s+/g, "_") // Replace spaces
        .trim();
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    if (bytes < 1024 * 1024 * 1024)
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

/**
 * Validate URL
 */
function isValidUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return (
            urlObj.protocol === "http:" ||
            urlObj.protocol === "https:" ||
            urlObj.protocol === "ftp:"
        );
    } catch {
        return false;
    }
}

/**
 * Download multiple URLs
 */
export async function downloadMultipleUrls(
    urls: string[],
    options: UniversalDownloadOptions = {},
): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    console.log(
        `\nDownloading ${colors.accent(String(urls.length))} files...\n`,
    );

    for (const url of urls) {
        console.log(`\n${colors.muted("━".repeat(50))}`);
        const result = await downloadFromUrl(url, {
            ...options,
            showProgress: true,
        });

        if (result) {
            success++;
        } else {
            failed++;
        }
    }

    console.log(`\n${colors.muted("━".repeat(50))}`);
    console.log();

    if (failed > 0) {
        showWarning(
            `Downloaded: ${success}/${urls.length} files (${failed} failed)`,
        );
    } else {
        showSuccess(`Successfully downloaded all ${success} files`);
    }

    return { success, failed };
}

/**
 * Download from file list
 */
export async function downloadFromFileList(
    fileListPath: string,
    options: UniversalDownloadOptions = {},
): Promise<boolean> {
    try {
        if (!fs.existsSync(fileListPath)) {
            showError(`File list not found: ${fileListPath}`);
            return false;
        }

        const content = fs.readFileSync(fileListPath, "utf-8");
        const urls = content
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("#"));

        if (urls.length === 0) {
            showError("No URLs found in file list");
            return false;
        }

        const result = await downloadMultipleUrls(urls, options);
        return result.failed === 0;
    } catch (error: any) {
        showError(
            `Error reading file list: ${error?.message || String(error)}`,
        );
        return false;
    }
}
