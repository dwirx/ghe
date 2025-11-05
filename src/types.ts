export type SshConfig = {
    keyPath: string;
    hostAlias?: string; // default: github-<accountName>
};

export type TokenConfig = {
    username: string;
    token: string;
};

export type GitPlatform = "github" | "gitlab" | "bitbucket" | "gitea" | "other";

export type PlatformConfig = {
    type: GitPlatform;
    domain?: string; // for custom domains (e.g., gitlab.company.com)
    apiUrl?: string; // custom API endpoint
};

export type Account = {
    name: string; // short label
    gitUserName?: string;
    gitEmail?: string;
    ssh?: SshConfig;
    token?: TokenConfig;
    platform?: PlatformConfig; // default: github
};

export type HealthStatus = {
    accountName: string;
    sshValid?: boolean;
    sshError?: string;
    tokenValid?: boolean;
    tokenError?: string;
    tokenExpiry?: string; // ISO date string if detectable
    lastChecked: string; // ISO date string
};

export type ActivityLogEntry = {
    timestamp: string; // ISO date string
    action: "switch" | "add" | "remove" | "edit" | "test";
    accountName: string;
    repoPath?: string;
    method?: "ssh" | "token";
    platform?: GitPlatform;
    success: boolean;
    error?: string;
};

export type AppConfig = {
    accounts: Account[];
    activityLog?: ActivityLogEntry[];
    healthChecks?: HealthStatus[];
    lastHealthCheck?: string; // ISO date string
};
