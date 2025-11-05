import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { platform, getConfigDirectory, ensureDirectory, setFilePermissions } from "./utils/platform";
import { showInfo, showSuccess, showError, colors } from "./utils/ui";
import ora from "ora";

const LAZYGIT_VERSION = "0.44.1"; // Latest stable version
const GITHUB_REPO = "jesseduffield/lazygit";

/**
 * Get platform-specific lazygit binary information
 */
function getLazygitBinaryInfo(): {
    filename: string;
    url: string;
    extractedName: string;
} {
    const baseUrl = `https://github.com/${GITHUB_REPO}/releases/download/v${LAZYGIT_VERSION}`;

    let filename: string;
    let extractedName: string;

    if (platform.isWindows) {
        if (platform.arch === "x64" || platform.arch === "x86_64") {
            filename = `lazygit_${LAZYGIT_VERSION}_Windows_x86_64.zip`;
            extractedName = "lazygit.exe";
        } else if (platform.arch === "arm64") {
            filename = `lazygit_${LAZYGIT_VERSION}_Windows_arm64.zip`;
            extractedName = "lazygit.exe";
        } else {
            filename = `lazygit_${LAZYGIT_VERSION}_Windows_x86_64.zip`;
            extractedName = "lazygit.exe";
        }
    } else if (platform.isLinux) {
        if (platform.arch === "x64" || platform.arch === "x86_64") {
            filename = `lazygit_${LAZYGIT_VERSION}_Linux_x86_64.tar.gz`;
            extractedName = "lazygit";
        } else if (platform.arch === "arm64" || platform.arch === "aarch64") {
            filename = `lazygit_${LAZYGIT_VERSION}_Linux_arm64.tar.gz`;
            extractedName = "lazygit";
        } else {
            filename = `lazygit_${LAZYGIT_VERSION}_Linux_x86_64.tar.gz`;
            extractedName = "lazygit";
        }
    } else if (platform.isMacOS) {
        if (platform.arch === "arm64") {
            filename = `lazygit_${LAZYGIT_VERSION}_Darwin_arm64.tar.gz`;
            extractedName = "lazygit";
        } else {
            filename = `lazygit_${LAZYGIT_VERSION}_Darwin_x86_64.tar.gz`;
            extractedName = "lazygit";
        }
    } else {
        throw new Error(`Unsupported platform: ${platform.type} ${platform.arch}`);
    }

    return {
        filename,
        url: `${baseUrl}/${filename}`,
        extractedName,
    };
}

/**
 * Get path to cached lazygit binary
 */
export function getLazygitBinaryPath(): string {
    const binDir = path.join(getConfigDirectory("ghe"), "bin");
    const binaryInfo = getLazygitBinaryInfo();
    return path.join(binDir, binaryInfo.extractedName);
}

/**
 * Check if lazygit binary is already cached
 */
export function isLazygitCached(): boolean {
    const binaryPath = getLazygitBinaryPath();
    return fs.existsSync(binaryPath);
}

/**
 * Download file with progress
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const spinner = ora({
            text: "Downloading lazygit...",
            color: "cyan",
        }).start();

        const httpModule = url.startsWith("https") ? https : http;

        const request = httpModule.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    spinner.text = "Following redirect...";
                    downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
                    return;
                }
            }

            if (response.statusCode !== 200) {
                spinner.fail(`Download failed: HTTP ${response.statusCode}`);
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }

            const totalSize = parseInt(response.headers["content-length"] || "0", 10);
            let downloadedSize = 0;

            const fileStream = fs.createWriteStream(destPath);

            response.on("data", (chunk) => {
                downloadedSize += chunk.length;
                if (totalSize > 0) {
                    const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
                    const downloadedMB = (downloadedSize / 1024 / 1024).toFixed(2);
                    const totalMB = (totalSize / 1024 / 1024).toFixed(2);
                    spinner.text = `Downloading lazygit... ${percent}% (${downloadedMB}MB / ${totalMB}MB)`;
                }
            });

            response.pipe(fileStream);

            fileStream.on("finish", () => {
                fileStream.close();
                spinner.succeed("Download completed");
                resolve();
            });

            fileStream.on("error", (err) => {
                fs.unlinkSync(destPath);
                spinner.fail("Download failed");
                reject(err);
            });
        });

        request.on("error", (err) => {
            spinner.fail("Download failed");
            reject(err);
        });

        request.setTimeout(60000, () => {
            request.destroy();
            spinner.fail("Download timeout");
            reject(new Error("Download timeout"));
        });
    });
}

/**
 * Extract tar.gz archive
 */
async function extractTarGz(archivePath: string, destDir: string, filename: string): Promise<void> {
    const spinner = ora({
        text: "Extracting archive...",
        color: "cyan",
    }).start();

    try {
        const { exec } = await import("./utils/shell");

        // Use tar command for extraction
        const result = await exec(["tar", "-xzf", archivePath, "-C", destDir, filename], {});

        if (result.code !== 0) {
            throw new Error(result.stderr || "Extraction failed");
        }

        spinner.succeed("Extraction completed");
    } catch (error) {
        spinner.fail("Extraction failed");
        throw error;
    }
}

/**
 * Extract zip archive with multiple fallback methods for Windows
 */
async function extractZip(archivePath: string, destDir: string, filename: string): Promise<void> {
    const spinner = ora({
        text: "Extracting archive...",
        color: "cyan",
    }).start();

    try {
        if (platform.isWindows) {
            const { exec } = await import("./utils/shell");
            let extracted = false;

            // Method 1: Try tar (from Git Bash - commonly available on Windows)
            try {
                spinner.text = "Extracting with tar...";
                const tarResult = await exec(["tar", "-xf", archivePath, "-C", destDir], {});
                if (tarResult.code === 0) {
                    extracted = true;
                }
            } catch (e) {
                // tar not available, try next method
            }

            // Method 2: Try PowerShell with ExecutionPolicy Bypass
            if (!extracted) {
                try {
                    spinner.text = "Extracting with PowerShell...";
                    const psCommand = `Expand-Archive -Path "${archivePath}" -DestinationPath "${destDir}" -Force`;
                    const psResult = await exec([
                        "powershell",
                        "-ExecutionPolicy",
                        "Bypass",
                        "-NoProfile",
                        "-Command",
                        psCommand
                    ], {});

                    if (psResult.code === 0) {
                        extracted = true;
                    }
                } catch (e) {
                    // PowerShell failed, try next method
                }
            }

            // Method 3: Try using tar from Windows path (Windows 10+ has tar built-in)
            if (!extracted) {
                try {
                    spinner.text = "Extracting with Windows tar...";
                    const winTarResult = await exec([
                        "C:\\Windows\\System32\\tar.exe",
                        "-xf",
                        archivePath,
                        "-C",
                        destDir
                    ], {});

                    if (winTarResult.code === 0) {
                        extracted = true;
                    }
                } catch (e) {
                    // Windows tar not available
                }
            }

            if (!extracted) {
                throw new Error(
                    "All extraction methods failed.\n" +
                    "Please install one of the following:\n" +
                    "  - Git for Windows (includes tar): https://git-scm.com/download/win\n" +
                    "  - 7-Zip: https://www.7-zip.org/\n" +
                    "  - Or install lazygit manually: scoop install lazygit"
                );
            }
        } else {
            // Unix systems - use unzip command
            const { exec } = await import("./utils/shell");
            const result = await exec(["unzip", "-o", archivePath, "-d", destDir], {});

            if (result.code !== 0) {
                throw new Error(result.stderr || "Unzip extraction failed");
            }
        }

        spinner.succeed("Extraction completed");
    } catch (error) {
        spinner.fail("Extraction failed");
        throw error;
    }
}

/**
 * Download and setup lazygit binary
 */
export async function downloadLazygit(): Promise<string> {
    const binDir = path.join(getConfigDirectory("ghe"), "bin");
    const tempDir = path.join(getConfigDirectory("ghe"), "tmp");

    // Ensure directories exist
    ensureDirectory(binDir);
    ensureDirectory(tempDir);

    const binaryInfo = getLazygitBinaryInfo();
    const archivePath = path.join(tempDir, binaryInfo.filename);
    const finalBinaryPath = path.join(binDir, binaryInfo.extractedName);

    console.log("");
    showInfo(`Installing lazygit v${LAZYGIT_VERSION} for ${platform.type} ${platform.arch}...`);
    console.log("");

    try {
        // Download archive
        await downloadFile(binaryInfo.url, archivePath);

        // Extract based on archive type
        if (binaryInfo.filename.endsWith(".tar.gz")) {
            await extractTarGz(archivePath, binDir, binaryInfo.extractedName);
        } else if (binaryInfo.filename.endsWith(".zip")) {
            await extractZip(archivePath, binDir, binaryInfo.extractedName);
        }

        // Make binary executable on Unix systems
        if (!platform.isWindows) {
            setFilePermissions(finalBinaryPath, 0o755);
        }

        // Clean up archive
        if (fs.existsSync(archivePath)) {
            fs.unlinkSync(archivePath);
        }

        // Verify binary exists
        if (!fs.existsSync(finalBinaryPath)) {
            throw new Error("Binary not found after extraction");
        }

        console.log("");
        showSuccess(`lazygit installed successfully to: ${finalBinaryPath}`);
        console.log("");

        return finalBinaryPath;
    } catch (error: any) {
        showError(`Failed to install lazygit: ${error?.message || String(error)}`);
        console.log("");
        showInfo("Manual installation options:");
        console.log("");

        if (platform.isWindows) {
            console.log("  Windows:");
            console.log("    scoop install lazygit");
            console.log("    choco install lazygit");
            console.log("    winget install lazygit");
            console.log("");
            console.log("  Or install Git for Windows (includes tar command):");
            console.log("    https://git-scm.com/download/win");
        } else if (platform.isMacOS) {
            console.log("  macOS:");
            console.log("    brew install lazygit");
        } else if (platform.isLinux) {
            console.log("  Linux:");
            console.log("    Ubuntu/Debian: sudo apt install lazygit");
            console.log("    Arch:          sudo pacman -S lazygit");
            console.log("    Fedora:        sudo dnf install lazygit");
        }

        console.log("");
        console.log("Or download manually from:");
        console.log("  https://github.com/jesseduffield/lazygit/releases");
        console.log("");
        throw error;
    }
}

/**
 * Get or download lazygit binary
 */
export async function ensureLazygit(): Promise<string> {
    // Check if already cached
    if (isLazygitCached()) {
        return getLazygitBinaryPath();
    }

    // Check if lazygit is in PATH
    const { exec } = await import("./utils/shell");
    const whichCmd = platform.isWindows ? "where" : "which";
    const result = await exec([whichCmd, "lazygit"]);

    if (result.code === 0) {
        // Use system lazygit
        const systemPath = result.stdout.trim().split("\n")[0];
        if (systemPath) {
            return systemPath;
        }
    }

    // Download and install
    return await downloadLazygit();
}

/**
 * Get lazygit version
 */
export async function getLazygitVersion(binaryPath: string): Promise<string> {
    try {
        const { exec } = await import("./utils/shell");
        const { stdout } = await exec([binaryPath, "--version"], {});

        // Parse version from output
        const match = stdout.match(/version=([\d.]+)/);
        if (match && match[1]) {
            return match[1];
        }

        return "unknown";
    } catch {
        return "unknown";
    }
}
