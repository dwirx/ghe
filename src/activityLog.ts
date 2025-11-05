import * as fs from "fs";
import * as path from "path";
import type { ActivityLogEntry, GitPlatform } from "./types";
import { getConfigDirectory, ensureDirectory } from "./utils/platform";

const LOG_DIR = getConfigDirectory("ghe");
const LOG_FILE = path.join(LOG_DIR, "activity.log");
const MAX_LOG_ENTRIES = 1000; // Keep last 1000 entries

/**
 * Add entry to activity log
 */
export function logActivity(entry: Omit<ActivityLogEntry, "timestamp">): void {
    try {
        const fullEntry: ActivityLogEntry = {
            ...entry,
            timestamp: new Date().toISOString(),
        };

        // Read existing log
        let entries: ActivityLogEntry[] = [];
        if (fs.existsSync(LOG_FILE)) {
            try {
                const content = fs.readFileSync(LOG_FILE, "utf8");
                entries = JSON.parse(content);
            } catch {
                entries = [];
            }
        }

        // Add new entry
        entries.push(fullEntry);

        // Keep only last MAX_LOG_ENTRIES
        if (entries.length > MAX_LOG_ENTRIES) {
            entries = entries.slice(-MAX_LOG_ENTRIES);
        }

        // Write back
        ensureDirectory(LOG_DIR);
        fs.writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2), "utf8");
    } catch (e) {
        // Silently fail - logging shouldn't break the app
        console.error("Failed to write activity log:", e);
    }
}

/**
 * Read activity log
 */
export function readActivityLog(): ActivityLogEntry[] {
    try {
        if (!fs.existsSync(LOG_FILE)) {
            return [];
        }

        const content = fs.readFileSync(LOG_FILE, "utf8");
        return JSON.parse(content);
    } catch {
        return [];
    }
}

/**
 * Get recent activity (last N entries)
 */
export function getRecentActivity(limit: number = 20): ActivityLogEntry[] {
    const entries = readActivityLog();
    return entries.slice(-limit).reverse();
}

/**
 * Get activity for specific account
 */
export function getAccountActivity(
    accountName: string,
    limit?: number,
): ActivityLogEntry[] {
    const entries = readActivityLog();
    const filtered = entries.filter((e) => e.accountName === accountName);
    const result = limit ? filtered.slice(-limit) : filtered;
    return result.reverse();
}

/**
 * Get activity for specific repository
 */
export function getRepoActivity(
    repoPath: string,
    limit?: number,
): ActivityLogEntry[] {
    const entries = readActivityLog();
    const filtered = entries.filter((e) => e.repoPath === repoPath);
    const result = limit ? filtered.slice(-limit) : filtered;
    return result.reverse();
}

/**
 * Get statistics from activity log
 */
export function getActivityStats(): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    accountUsage: Record<string, number>;
    repoUsage: Record<string, number>;
    methodUsage: Record<string, number>;
    platformUsage: Record<string, number>;
    lastActivity?: string;
} {
    const entries = readActivityLog();

    const stats = {
        totalOperations: entries.length,
        successfulOperations: 0,
        failedOperations: 0,
        accountUsage: {} as Record<string, number>,
        repoUsage: {} as Record<string, number>,
        methodUsage: {} as Record<string, number>,
        platformUsage: {} as Record<string, number>,
        lastActivity:
            entries.length > 0
                ? entries[entries.length - 1]?.timestamp
                : undefined,
    };

    for (const entry of entries) {
        // Success/failure count
        if (entry.success) {
            stats.successfulOperations++;
        } else {
            stats.failedOperations++;
        }

        // Account usage
        stats.accountUsage[entry.accountName] =
            (stats.accountUsage[entry.accountName] || 0) + 1;

        // Repo usage
        if (entry.repoPath) {
            stats.repoUsage[entry.repoPath] =
                (stats.repoUsage[entry.repoPath] || 0) + 1;
        }

        // Method usage
        if (entry.method) {
            stats.methodUsage[entry.method] =
                (stats.methodUsage[entry.method] || 0) + 1;
        }

        // Platform usage
        if (entry.platform) {
            stats.platformUsage[entry.platform] =
                (stats.platformUsage[entry.platform] || 0) + 1;
        }
    }

    return stats;
}

/**
 * Export activity log to CSV
 */
export function exportToCSV(): string {
    const entries = readActivityLog();

    const headers = [
        "Timestamp",
        "Action",
        "Account",
        "Repository",
        "Method",
        "Platform",
        "Success",
        "Error",
    ];

    const rows = entries.map((e) => [
        e.timestamp,
        e.action,
        e.accountName,
        e.repoPath || "",
        e.method || "",
        e.platform || "",
        e.success ? "Yes" : "No",
        e.error || "",
    ]);

    const csv = [
        headers.join(","),
        ...rows.map((row) =>
            row
                .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                .join(","),
        ),
    ].join("\n");

    return csv;
}

/**
 * Clear activity log
 */
export function clearActivityLog(): void {
    try {
        if (fs.existsSync(LOG_FILE)) {
            fs.unlinkSync(LOG_FILE);
        }
    } catch (e) {
        throw new Error(`Failed to clear activity log: ${e}`);
    }
}

/**
 * Get activity log file path
 */
export function getLogFilePath(): string {
    return LOG_FILE;
}
