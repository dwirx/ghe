/**
 * Downloader Utility
 * Handles file downloads with progress tracking
 */

import * as fs from "fs";
import * as path from "path";
import ora from "ora";
import { colors } from "./ui";
import { ensureDirectory } from "./platform";

export type DownloadOptions = {
    outputPath?: string;
    outputDir?: string;
    preservePath?: boolean;
    showProgress?: boolean;
    overwrite?: boolean;
};

export type DownloadResult = {
    success: boolean;
    filePath?: string;
    size?: number;
    error?: string;
};

export type FileInfo = {
    filename: string;
    size: number;
    url: string;
    lastModified?: string;
};

/**
 * Download file from URL with progress tracking
 */
export async function downloadFile(
    url: string,
    filename: string,
    options: DownloadOptions = {},
): Promise<DownloadResult> {
    const spinner = options.showProgress !== false ? ora() : null;

    try {
        spinner?.start(`Downloading ${colors.accent(filename)}...`);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Determine output path
        let outputPath: string;
        if (options.outputPath) {
            outputPath = options.outputPath;
        } else if (options.outputDir) {
            outputPath = path.join(options.outputDir, filename);
        } else {
            outputPath = filename;
        }

        // Check if file exists
        if (!options.overwrite && fs.existsSync(outputPath)) {
            spinner?.fail();
            return {
                success: false,
                error: `File already exists: ${outputPath}`,
            };
        }

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        ensureDirectory(dir);

        // Download file
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Write to file
        fs.writeFileSync(outputPath, buffer);

        const sizeKB = (buffer.length / 1024).toFixed(2);
        spinner?.succeed(
            `Downloaded ${colors.success(filename)} (${colors.muted(sizeKB + " KB")})`,
        );

        return {
            success: true,
            filePath: outputPath,
            size: buffer.length,
        };
    } catch (error: any) {
        spinner?.fail();
        return {
            success: false,
            error: error?.message || String(error),
        };
    }
}

/**
 * Download multiple files concurrently
 */
export async function downloadMultiple(
    files: Array<{ url: string; filename: string }>,
    options: DownloadOptions = {},
): Promise<DownloadResult[]> {
    const spinner = options.showProgress !== false ? ora() : null;

    spinner?.start(`Downloading ${files.length} files...`);

    try {
        const results = await Promise.all(
            files.map((file) =>
                downloadFile(file.url, file.filename, {
                    ...options,
                    showProgress: false,
                }),
            ),
        );

        const successful = results.filter((r) => r.success).length;
        const failed = results.length - successful;

        if (failed > 0) {
            spinner?.warn(
                `Downloaded ${colors.success(String(successful))} files, ${colors.error(String(failed))} failed`,
            );
        } else {
            spinner?.succeed(
                `Successfully downloaded ${colors.success(String(successful))} files`,
            );
        }

        return results;
    } catch (error) {
        spinner?.fail();
        throw error;
    }
}

/**
 * Get file info without downloading
 */
export async function getFileInfo(url: string): Promise<FileInfo | null> {
    try {
        const response = await fetch(url, { method: "HEAD" });

        if (!response.ok) {
            return null;
        }

        const contentLength = response.headers.get("content-length");
        const lastModified = response.headers.get("last-modified");
        const filename = getFilenameFromUrl(url);

        return {
            filename,
            size: contentLength ? parseInt(contentLength, 10) : 0,
            url,
            lastModified: lastModified || undefined,
        };
    } catch (error) {
        return null;
    }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    if (bytes < 1024 * 1024 * 1024)
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

/**
 * Extract filename from URL
 */
function getFilenameFromUrl(url: string): string {
    const parts = url.split("/");
    let filename = parts[parts.length - 1] || "download";

    // Remove query string
    const queryIndex = filename.indexOf("?");
    if (queryIndex !== -1) {
        filename = filename.substring(0, queryIndex);
    }

    return filename || "download";
}

/**
 * Sanitize filename for safe file system usage
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[<>:"|?*]/g, "_") // Replace invalid chars
        .replace(/\.\./g, "_") // Prevent directory traversal
        .replace(/^\./, "_"); // Prevent hidden files
}

/**
 * Check if path is a directory
 */
export function isDirectory(dirPath: string): boolean {
    try {
        return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    } catch {
        return false;
    }
}

/**
 * Get unique filename if file already exists
 */
export function getUniqueFilename(filePath: string): string {
    if (!fs.existsSync(filePath)) {
        return filePath;
    }

    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);

    let counter = 1;
    let newPath: string;

    do {
        newPath = path.join(dir, `${name} (${counter})${ext}`);
        counter++;
    } while (fs.existsSync(newPath));

    return newPath;
}

/**
 * Download with retry logic
 */
export async function downloadWithRetry(
    url: string,
    filename: string,
    options: DownloadOptions = {},
    maxRetries: number = 3,
): Promise<DownloadResult> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const result = await downloadFile(url, filename, {
            ...options,
            showProgress: attempt === 1,
        });

        if (result.success) {
            return result;
        }

        lastError = result.error;

        if (attempt < maxRetries) {
            // Wait before retry (exponential backoff)
            await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, attempt) * 1000),
            );
        }
    }

    return {
        success: false,
        error: lastError || "Download failed after retries",
    };
}
