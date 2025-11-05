import type { GitPlatform, PlatformConfig } from "./types";

/**
 * Platform patterns for URL detection
 */
const PLATFORM_PATTERNS: Record<
    GitPlatform,
    { hosts: RegExp[]; urlPatterns: RegExp[] }
> = {
    github: {
        hosts: [/^github\.com$/i, /^.*\.github\.com$/i],
        urlPatterns: [
            /github\.com[/:]/i,
            /^git@github\.com:/i,
            /^https?:\/\/github\.com\//i,
        ],
    },
    gitlab: {
        hosts: [/^gitlab\.com$/i, /^.*\.gitlab\.com$/i, /gitlab/i],
        urlPatterns: [
            /gitlab\.com[/:]/i,
            /^git@gitlab\./i,
            /^https?:\/\/gitlab\./i,
            /gitlab/i,
        ],
    },
    bitbucket: {
        hosts: [/^bitbucket\.org$/i, /^.*\.bitbucket\.org$/i],
        urlPatterns: [
            /bitbucket\.org[/:]/i,
            /^git@bitbucket\.org:/i,
            /^https?:\/\/bitbucket\.org\//i,
        ],
    },
    gitea: {
        hosts: [/^gitea\.com$/i, /^.*\.gitea\.com$/i, /gitea/i],
        urlPatterns: [
            /gitea\.com[/:]/i,
            /^git@gitea\./i,
            /^https?:\/\/gitea\./i,
            /gitea/i,
        ],
    },
    other: {
        hosts: [],
        urlPatterns: [],
    },
};

/**
 * Platform display names
 */
const PLATFORM_NAMES: Record<GitPlatform, string> = {
    github: "GitHub",
    gitlab: "GitLab",
    bitbucket: "Bitbucket",
    gitea: "Gitea",
    other: "Other",
};

/**
 * Platform default domains
 */
const PLATFORM_DOMAINS: Record<GitPlatform, string> = {
    github: "github.com",
    gitlab: "gitlab.com",
    bitbucket: "bitbucket.org",
    gitea: "gitea.com",
    other: "",
};

/**
 * Platform API endpoints
 */
const PLATFORM_API_URLS: Record<GitPlatform, string> = {
    github: "https://api.github.com",
    gitlab: "https://gitlab.com/api/v4",
    bitbucket: "https://api.bitbucket.org/2.0",
    gitea: "https://gitea.com/api/v1",
    other: "",
};

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
    try {
        // Handle SSH URLs: git@domain:path
        const sshMatch = url.match(/^git@([^:]+):/);
        if (sshMatch && sshMatch[1]) {
            return sshMatch[1];
        }

        // Handle HTTPS URLs
        const httpsMatch = url.match(/^https?:\/\/([^/]+)/);
        if (httpsMatch && httpsMatch[1]) {
            return httpsMatch[1];
        }

        // Handle SSH protocol URLs: ssh://git@domain/path
        const sshProtocolMatch = url.match(/^ssh:\/\/git@([^/]+)/);
        if (sshProtocolMatch && sshProtocolMatch[1]) {
            return sshProtocolMatch[1];
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Detect platform from remote URL
 */
export function detectPlatformFromUrl(url: string | null): PlatformConfig {
    if (!url) {
        return { type: "github" }; // Default to GitHub
    }

    // Check each platform's patterns
    for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
        for (const pattern of patterns.urlPatterns) {
            if (pattern.test(url)) {
                const domain = extractDomain(url);
                const defaultDomain = PLATFORM_DOMAINS[platform as GitPlatform];

                // If domain is not the default one, include it in config
                if (domain && domain !== defaultDomain) {
                    return {
                        type: platform as GitPlatform,
                        domain: domain,
                    };
                }

                return { type: platform as GitPlatform };
            }
        }
    }

    // If no match, try to extract domain for custom platform
    const domain = extractDomain(url);
    if (domain) {
        return {
            type: "other",
            domain: domain,
        };
    }

    return { type: "github" }; // Fallback to GitHub
}

/**
 * Detect platform from domain
 */
export function detectPlatformFromDomain(domain: string): GitPlatform {
    for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
        for (const hostPattern of patterns.hosts) {
            if (hostPattern.test(domain)) {
                return platform as GitPlatform;
            }
        }
    }
    return "other";
}

/**
 * Get platform display name
 */
export function getPlatformName(platform: GitPlatform): string {
    return PLATFORM_NAMES[platform] || platform;
}

/**
 * Get platform default domain
 */
export function getPlatformDomain(platform: GitPlatform): string {
    return PLATFORM_DOMAINS[platform] || "";
}

/**
 * Get platform API URL
 */
export function getPlatformApiUrl(
    platform: GitPlatform,
    customApiUrl?: string,
): string {
    if (customApiUrl) return customApiUrl;

    // For custom domains, try to construct API URL
    if (platform === "gitlab" || platform === "gitea") {
        return PLATFORM_API_URLS[platform];
    }

    return PLATFORM_API_URLS[platform] || "";
}

/**
 * Get SSH host for platform
 */
export function getPlatformSshHost(config: PlatformConfig): string {
    if (config.domain) {
        return config.domain;
    }
    return getPlatformDomain(config.type);
}

/**
 * Build remote URL for platform
 */
export function buildRemoteUrl(
    platform: PlatformConfig,
    repoPath: string,
    useSSH: boolean = true,
): string {
    const host = getPlatformSshHost(platform);

    if (useSSH) {
        return `git@${host}:${repoPath}`;
    } else {
        return `https://${host}/${repoPath}`;
    }
}

/**
 * Validate platform configuration
 */
export function validatePlatformConfig(config: PlatformConfig): {
    valid: boolean;
    error?: string;
} {
    if (!config.type) {
        return { valid: false, error: "Platform type is required" };
    }

    const validPlatforms: GitPlatform[] = [
        "github",
        "gitlab",
        "bitbucket",
        "gitea",
        "other",
    ];
    if (!validPlatforms.includes(config.type)) {
        return { valid: false, error: `Invalid platform type: ${config.type}` };
    }

    if (config.type === "other" && !config.domain) {
        return {
            valid: false,
            error: "Domain is required for custom platforms",
        };
    }

    return { valid: true };
}

/**
 * Get platform icon/emoji
 */
export function getPlatformIcon(platform: GitPlatform): string {
    const icons: Record<GitPlatform, string> = {
        github: "🐙",
        gitlab: "🦊",
        bitbucket: "🪣",
        gitea: "🍵",
        other: "🔧",
    };
    return icons[platform] || "📦";
}

/**
 * Get platform SSH success message patterns
 */
export function getPlatformSshSuccessPattern(platform: GitPlatform): RegExp {
    const patterns: Record<GitPlatform, RegExp> = {
        github: /successfully authenticated/i,
        gitlab: /Welcome to GitLab/i,
        bitbucket: /authenticated via|logged in as/i,
        gitea: /Hi there|successfully authenticated/i,
        other: /authenticated|welcome|hi/i,
    };
    return patterns[platform] || patterns.other;
}

/**
 * Get platform-specific instructions
 */
export function getPlatformInstructions(
    platform: GitPlatform,
    domain?: string,
): {
    sshKeyUrl: string;
    tokenUrl: string;
    sshTestCommand: string;
} {
    const host = domain || getPlatformDomain(platform);

    const urls: Record<GitPlatform, { sshKeyUrl: string; tokenUrl: string }> = {
        github: {
            sshKeyUrl: "https://github.com/settings/keys",
            tokenUrl: "https://github.com/settings/tokens",
        },
        gitlab: {
            sshKeyUrl: `https://${host}/-/profile/keys`,
            tokenUrl: `https://${host}/-/profile/personal_access_tokens`,
        },
        bitbucket: {
            sshKeyUrl: `https://${host}/account/settings/ssh-keys/`,
            tokenUrl: `https://${host}/account/settings/app-passwords/`,
        },
        gitea: {
            sshKeyUrl: `https://${host}/user/settings/keys`,
            tokenUrl: `https://${host}/user/settings/applications`,
        },
        other: {
            sshKeyUrl: `https://${host}/settings/ssh`,
            tokenUrl: `https://${host}/settings/tokens`,
        },
    };

    return {
        sshKeyUrl: urls[platform]?.sshKeyUrl || urls.other.sshKeyUrl,
        tokenUrl: urls[platform]?.tokenUrl || urls.other.tokenUrl,
        sshTestCommand: `ssh -T git@${host}`,
    };
}

/**
 * Check if platform supports specific features
 */
export function platformSupportsFeature(
    platform: GitPlatform,
    feature: "ssh" | "token" | "api" | "webhooks",
): boolean {
    // All platforms support SSH and tokens
    if (feature === "ssh" || feature === "token") {
        return true;
    }

    // API support varies
    if (feature === "api") {
        return platform !== "other";
    }

    // Webhooks support
    if (feature === "webhooks") {
        return ["github", "gitlab", "bitbucket", "gitea"].includes(platform);
    }

    return false;
}

/**
 * Auto-detect and enhance platform config from current repo
 */
export async function autoDetectPlatform(
    remoteUrl: string | null,
): Promise<PlatformConfig> {
    const detected = detectPlatformFromUrl(remoteUrl);

    // If domain is detected, validate it's reachable (optional enhancement)
    // For now, just return the detected config
    return detected;
}
