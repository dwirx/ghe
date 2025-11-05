import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { run, exec } from "./utils/shell";
import {
    getSshDirectory,
    expandPath,
    normalizePath,
    platform,
    setFilePermissions,
    ensureDirectory,
} from "./utils/platform";

export const SSH_DIR = getSshDirectory();
export const SSH_CONFIG_PATH = path.join(SSH_DIR, "config");

export function ensureSshConfigBlock(
    alias: string,
    keyPath: string,
    hostname: string = "github.com",
) {
    // Ensure SSH directory exists with proper permissions
    ensureDirectory(SSH_DIR, 0o700);

    let content = "";
    try {
        content = fs.readFileSync(SSH_CONFIG_PATH, "utf8");
    } catch {
        content = "";
    }
    const header = `Host ${alias}`;
    const block = [
        `Host ${alias}`,
        `  HostName ${hostname}`,
        `  User git`,
        `  IdentityFile ${keyPath}`,
        `  IdentitiesOnly yes`,
    ].join("\n");

    if (content.split(/\r?\n/).some((line) => line.trim() === header)) {
        const lines = content.split(/\r?\n/);
        const out: string[] = [];
        for (let i = 0; i < lines.length; i++) {
            const currentLine = lines[i];
            if (currentLine && currentLine.trim() === header) {
                out.push(block);
                i++;
                while (
                    i < lines.length &&
                    lines[i] &&
                    !/^Host\s+/.test(lines[i]!)
                )
                    i++;
                i--;
            } else if (currentLine !== undefined) {
                out.push(currentLine);
            }
        }
        fs.writeFileSync(SSH_CONFIG_PATH, out.join("\n").trim() + "\n", "utf8");
    } else {
        const sep =
            content && !content.endsWith("\n") ? "\n\n" : content ? "\n" : "";
        fs.writeFileSync(SSH_CONFIG_PATH, `${content}${sep}${block}\n`, "utf8");
    }
    ensureSshDirAndConfigPermissions();
}

export async function generateSshKey(keyPath: string, comment: string) {
    const dir = path.dirname(keyPath);
    ensureDirectory(dir, 0o700);

    await run([
        "ssh-keygen",
        "-t",
        "ed25519",
        "-f",
        keyPath,
        "-C",
        comment,
        "-N",
        "",
    ]);

    // Set permissions for private key
    setFilePermissions(keyPath, 0o600);

    // Set permissions for public key
    const pub = keyPath + ".pub";
    if (fs.existsSync(pub)) {
        setFilePermissions(pub, 0o644);
    }

    ensureSshDirAndConfigPermissions();
}

export function expandHome(p: string) {
    if (!p) return p;
    return p.replace(/^~(?=$|\/+)/, os.homedir());
}

export function importPrivateKey(srcPath: string, destPath: string) {
    const from = expandHome(srcPath);
    const to = expandHome(destPath);
    const dir = path.dirname(to);
    if (!fs.existsSync(from)) throw new Error(`Source key not found: ${from}`);

    ensureDirectory(dir, 0o700);
    fs.copyFileSync(from, to);
    setFilePermissions(to, 0o600);
    ensureSshDirAndConfigPermissions();
    return to;
}

export async function ensurePublicKey(privateKeyPath: string) {
    const pubPath = privateKeyPath + ".pub";
    if (fs.existsSync(pubPath)) return pubPath;
    const pub = await run(["ssh-keygen", "-y", "-f", privateKeyPath]);
    fs.writeFileSync(pubPath, pub.trim() + "\n", "utf8");
    setFilePermissions(pubPath, 0o644);
    return pubPath;
}

export async function testSshConnection(hostAlias?: string, hostname?: string) {
    // Default to github.com if no hostname provided
    const host = hostname || hostAlias || "github.com";

    if (!host) {
        return { ok: false, message: "Host is required" };
    }

    try {
        const { code, stdout, stderr } = await exec([
            "ssh",
            "-T",
            "-o",
            "StrictHostKeyChecking=no",
            "-o",
            "ConnectTimeout=10",
            "-o",
            "BatchMode=yes",
            `git@${host}`,
        ]);

        const out = (stdout + "\n" + stderr).trim();

        // Platform-aware success patterns
        // GitHub: "Hi username! You've successfully authenticated"
        // GitLab: "Welcome to GitLab, @username!"
        // Bitbucket: "authenticated via ssh key" or "You can use git"
        // Gitea: "Hi there, username!" or "successfully authenticated"
        const ok =
            /successfully authenticated|Hi\s+.+! You've successfully authenticated|Welcome to GitLab|logged in as|authenticated via|You can use git|Hi there,/i.test(
                out,
            );

        if (ok) {
            // Extract username from response (GitHub, GitLab, Gitea, Bitbucket)
            const userMatch = out.match(
                /Hi\s+([^!,]+)[!,]|logged in as\s+(\S+)|@(\S+)|Hi there,?\s+([^!]+)!/i,
            );
            const username = userMatch
                ? userMatch[1] ||
                  userMatch[2] ||
                  userMatch[3] ||
                  userMatch[4] ||
                  "user"
                : "user";
            return {
                ok: true,
                message: `Successfully authenticated as ${username}`,
            };
        }

        // Provide more detailed error information
        if (code === 255) {
            return {
                ok: false,
                message:
                    "Connection failed. Check if SSH key is added to the Git service.",
            };
        }

        return { ok: false, message: out || `SSH exit code: ${code}` };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return { ok: false, message: `SSH test error: ${errorMsg}` };
    }
}

export function ensureKeyPermissions(privateKeyPath: string) {
    setFilePermissions(privateKeyPath, 0o600);
    const pub = privateKeyPath + ".pub";
    if (fs.existsSync(pub)) {
        setFilePermissions(pub, 0o644);
    }
    ensureSshDirAndConfigPermissions();
}

export function ensureSshDirAndConfigPermissions() {
    setFilePermissions(SSH_DIR, 0o700);
    if (fs.existsSync(SSH_CONFIG_PATH)) {
        setFilePermissions(SSH_CONFIG_PATH, 0o600);
    }
}

export function listSshPrivateKeys() {
    try {
        const entries = fs.readdirSync(SSH_DIR, { withFileTypes: true });
        return entries
            .filter((e) => e.isFile())
            .map((e) => path.join(SSH_DIR, e.name))
            .filter((p) => !p.endsWith(".pub"))
            .filter(
                (p) =>
                    !/\b(known_hosts|config|authorized_keys|authorized_keys2)\b/.test(
                        path.basename(p),
                    ),
            );
    } catch {
        return [];
    }
}

export function suggestDestFilenames(username?: string, label?: string) {
    const base = username || label || "github";
    const candidates = [
        `id_ed25519_${base}`,
        `id_ecdsa_${base}`,
        `id_rsa_${base}`,
        `id_ed25519_${(base + "").replace(/[^a-zA-Z0-9_-]+/g, "").toLowerCase()}`,
        `id_ed25519_github`,
    ];
    // de-dup
    return Array.from(new Set(candidates));
}
