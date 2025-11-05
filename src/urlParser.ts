/**
 * URL Parser for Git Hosting Platforms
 * Supports GitHub, GitLab, Bitbucket, and custom domains
 */

export type ParsedUrl = {
    platform: "github" | "gitlab" | "bitbucket" | "gitea" | "other";
    domain: string;
    owner: string;
    repo: string;
    branch?: string;
    filePath?: string;
    isDirectory?: boolean;
    commit?: string;
    tag?: string;
    rawUrl?: string;
};

/**
 * Parse various Git hosting URL formats
 * Supports:
 * - github.com/user/repo/blob/main/file.md
 * - raw.githubusercontent.com/user/repo/main/file.md
 * - gitlab.com/user/repo/-/blob/main/file.md
 * - bitbucket.org/user/repo/src/main/file.md
 * - user/repo/file.md (assumes GitHub and main branch)
 * - user/repo:branch/file.md
 */
export function parseGitUrl(url: string): ParsedUrl | null {
    try {
        // Normalize URL
        let normalized = url.trim();

        // Handle short format: user/repo/file.md or user/repo:branch/file.md
        if (!normalized.startsWith("http") && !normalized.includes("://")) {
            return parseShortFormat(normalized);
        }

        // Remove protocol if present
        normalized = normalized.replace(/^(https?:\/\/|git@|ssh:\/\/)/, "");

        // Parse GitHub URLs
        if (normalized.includes("github.com")) {
            return parseGitHubUrl(normalized);
        }

        // Parse raw.githubusercontent.com
        if (normalized.includes("raw.githubusercontent.com")) {
            return parseGitHubRawUrl(normalized);
        }

        // Parse GitLab URLs
        if (
            normalized.includes("gitlab.com") ||
            normalized.includes("gitlab.")
        ) {
            return parseGitLabUrl(normalized);
        }

        // Parse Bitbucket URLs
        if (
            normalized.includes("bitbucket.org") ||
            normalized.includes("bitbucket.")
        ) {
            return parseBitbucketUrl(normalized);
        }

        // Parse Gitea or other platforms
        return parseGenericUrl(normalized);
    } catch (error) {
        return null;
    }
}

function parseShortFormat(url: string): ParsedUrl | null {
    // Format: user/repo/file.md or user/repo:branch/file.md
    const colonSplit = url.split(":");
    let branch = "main";
    let pathPart = url;

    if (colonSplit.length === 2 && colonSplit[0] && colonSplit[1]) {
        pathPart = colonSplit[0] + "/" + colonSplit[1];
        const branchMatch = colonSplit[1].match(/^([^\/]+)\/(.*)/);
        if (branchMatch && branchMatch[1] && branchMatch[2]) {
            branch = branchMatch[1];
            pathPart = colonSplit[0] + "/" + branchMatch[2];
        }
    }

    const parts = pathPart.split("/");
    if (parts.length < 3 || !parts[0] || !parts[1]) {
        return null; // Need at least user/repo/file
    }

    return {
        platform: "github",
        domain: "github.com",
        owner: parts[0],
        repo: parts[1],
        branch,
        filePath: parts.slice(2).join("/"),
        rawUrl: `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${branch}/${parts.slice(2).join("/")}`,
    };
}

function parseGitHubUrl(url: string): ParsedUrl | null {
    // github.com/user/repo/blob/branch/path/to/file
    // github.com/user/repo/tree/branch/path/to/dir
    const match = url.match(
        /github\.com\/([^\/]+)\/([^\/]+)(?:\/(blob|tree)\/([^\/]+)\/(.+))?/,
    );

    if (!match) return null;

    const [, owner, repo, type, branch, path] = match;

    if (!owner || !repo) return null;

    const result: ParsedUrl = {
        platform: "github",
        domain: "github.com",
        owner: owner.replace(/\.git$/, ""),
        repo: repo.replace(/\.git$/, ""),
        branch: branch || "main",
        isDirectory: type === "tree",
    };

    if (path) {
        result.filePath = path;
        if (type === "blob") {
            result.rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch || "main"}/${path}`;
        }
    }

    return result;
}

function parseGitHubRawUrl(url: string): ParsedUrl | null {
    // raw.githubusercontent.com/user/repo/branch/path/to/file
    const match = url.match(
        /raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)/,
    );

    if (!match) return null;

    const [, owner, repo, branch, path] = match;

    if (!owner || !repo || !branch || !path) return null;

    return {
        platform: "github",
        domain: "github.com",
        owner,
        repo,
        branch,
        filePath: path,
        rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
    };
}

function parseGitLabUrl(url: string): ParsedUrl | null {
    // gitlab.com/user/repo/-/blob/branch/path/to/file
    // gitlab.com/user/repo/-/tree/branch/path/to/dir
    const match = url.match(
        /([^\/]+gitlab[^\/]*)\/([^\/]+)\/([^\/]+)(?:\/-\/(blob|tree)\/([^\/]+)\/(.+))?/,
    );

    if (!match) return null;

    const [, domain, owner, repo, type, branch, path] = match;

    if (!domain || !owner || !repo) return null;

    const result: ParsedUrl = {
        platform: "gitlab",
        domain,
        owner,
        repo: repo.replace(/\.git$/, ""),
        branch: branch || "main",
        isDirectory: type === "tree",
    };

    if (path) {
        result.filePath = path;
        if (type === "blob") {
            result.rawUrl = `https://${domain}/${owner}/${repo}/-/raw/${branch || "main"}/${path}`;
        }
    }

    return result;
}

function parseBitbucketUrl(url: string): ParsedUrl | null {
    // bitbucket.org/user/repo/src/branch/path/to/file
    const match = url.match(
        /([^\/]*bitbucket[^\/]*)\/([^\/]+)\/([^\/]+)(?:\/src\/([^\/]+)\/(.+))?/,
    );

    if (!match) return null;

    const [, domain, owner, repo, branch, path] = match;

    if (!domain || !owner || !repo) return null;

    const result: ParsedUrl = {
        platform: "bitbucket",
        domain,
        owner,
        repo: repo.replace(/\.git$/, ""),
        branch: branch || "main",
    };

    if (path) {
        result.filePath = path;
        result.rawUrl = `https://${domain}/${owner}/${repo}/raw/${branch || "main"}/${path}`;
    }

    return result;
}

function parseGenericUrl(url: string): ParsedUrl | null {
    // Try to parse generic git hosting URL
    // domain/user/repo/...
    const parts = url.split("/");
    if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) return null;

    return {
        platform: "other",
        domain: parts[0],
        owner: parts[1],
        repo: parts[2].replace(/\.git$/, ""),
        branch: "main",
    };
}

/**
 * Convert parsed URL to raw download URL
 */
export function toRawUrl(parsed: ParsedUrl): string {
    if (parsed.rawUrl) {
        return parsed.rawUrl;
    }

    if (!parsed.filePath) {
        throw new Error("No file path specified");
    }

    const branch = parsed.branch || "main";

    switch (parsed.platform) {
        case "github":
            return `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${parsed.filePath}`;

        case "gitlab":
            return `https://${parsed.domain}/${parsed.owner}/${parsed.repo}/-/raw/${branch}/${parsed.filePath}`;

        case "bitbucket":
            return `https://${parsed.domain}/${parsed.owner}/${parsed.repo}/raw/${branch}/${parsed.filePath}`;

        case "gitea":
            return `https://${parsed.domain}/${parsed.owner}/${parsed.repo}/raw/branch/${branch}/${parsed.filePath}`;

        default:
            // Generic fallback
            return `https://${parsed.domain}/${parsed.owner}/${parsed.repo}/raw/${branch}/${parsed.filePath}`;
    }
}

/**
 * Get API URL for fetching file info or directory contents
 */
export function toApiUrl(parsed: ParsedUrl): string {
    const branch = parsed.branch || "main";

    switch (parsed.platform) {
        case "github":
            if (parsed.isDirectory) {
                return `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${parsed.filePath || ""}?ref=${branch}`;
            }
            return `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${parsed.filePath}?ref=${branch}`;

        case "gitlab":
            const projectPath = encodeURIComponent(
                `${parsed.owner}/${parsed.repo}`,
            );
            const filePath = encodeURIComponent(parsed.filePath || "");
            return `https://${parsed.domain}/api/v4/projects/${projectPath}/repository/tree?path=${filePath}&ref=${branch}`;

        case "bitbucket":
            return `https://api.bitbucket.org/2.0/repositories/${parsed.owner}/${parsed.repo}/src/${branch}/${parsed.filePath || ""}`;

        default:
            throw new Error(
                `API not supported for platform: ${parsed.platform}`,
            );
    }
}

/**
 * Extract filename from URL or path
 */
export function getFilename(parsed: ParsedUrl): string {
    if (!parsed.filePath) {
        return parsed.repo;
    }

    const parts = parsed.filePath.split("/");
    const filename = parts[parts.length - 1];
    return filename || parsed.repo;
}

/**
 * Build web URL from parsed URL
 */
export function toWebUrl(parsed: ParsedUrl): string {
    const branch = parsed.branch || "main";
    const type = parsed.isDirectory ? "tree" : "blob";

    switch (parsed.platform) {
        case "github":
            if (parsed.filePath) {
                return `https://${parsed.domain}/${parsed.owner}/${parsed.repo}/${type}/${branch}/${parsed.filePath}`;
            }
            return `https://${parsed.domain}/${parsed.owner}/${parsed.repo}`;

        case "gitlab":
            if (parsed.filePath) {
                return `https://${parsed.domain}/${parsed.owner}/${parsed.repo}/-/${type}/${branch}/${parsed.filePath}`;
            }
            return `https://${parsed.domain}/${parsed.owner}/${parsed.repo}`;

        case "bitbucket":
            if (parsed.filePath) {
                return `https://${parsed.domain}/${parsed.owner}/${parsed.repo}/src/${branch}/${parsed.filePath}`;
            }
            return `https://${parsed.domain}/${parsed.owner}/${parsed.repo}`;

        default:
            return `https://${parsed.domain}/${parsed.owner}/${parsed.repo}`;
    }
}
