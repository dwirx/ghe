import prompts from "prompts";
import * as fs from "fs";
import { spawn } from "node:child_process";

import { commandExists, platform, getShellCommand } from "./platform";
import { createSpinner, showBox, showError, showInfo, showSuccess, showWarning, stylePrompt, colors } from "./ui";
import { exec } from "./shell";

interface LinuxDistribution {
  family: "debian" | "rhel" | "suse" | "arch" | "alpine" | "unknown";
  name: string;
}

interface AutomaticPlan {
  type: "automatic";
  label: string;
  commands: string[];
}

interface ManualPlan {
  type: "manual";
  label: string;
  instructions: string[];
}

type InstallPlan = AutomaticPlan | ManualPlan;

interface EnsureGithubCliOptions {
  promptInstall?: boolean;
  promptLogin?: boolean;
}

interface CommandReferenceEntry {
  command: string;
  description: string;
}

interface CommandReferenceCategory {
  id: string;
  title: string;
  icon: string;
  commands: CommandReferenceEntry[];
}

interface GhRepoSummary {
  nameWithOwner: string;
  description?: string;
  visibility?: string;
  isPrivate?: boolean;
  updatedAt?: string;
  url?: string;
}

interface GhGistSummary {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  public?: boolean | null;
  isPublic?: boolean | null;
  updatedAt?: string | null;
  url?: string | null;
  html_url?: string | null;
  files?: Array<{ name?: string | null }> | string[] | Record<string, any>;
}

const COMMAND_REFERENCE: CommandReferenceCategory[] = [
  {
    id: "general",
    title: "Perintah Umum",
    icon: "🧭",
    commands: [
      { command: "gh help", description: "Melihat daftar semua perintah & bantuan lengkap" },
      { command: "gh --version", description: "Cek versi GitHub CLI" },
      { command: "gh auth login", description: "Login ke GitHub" },
      { command: "gh auth status", description: "Lihat status login" },
      { command: "gh browse", description: "Buka halaman repo di browser" },
      { command: "gh api", description: "Akses GitHub API langsung dari CLI" },
    ],
  },
  {
    id: "repo",
    title: "Repository",
    icon: "📦",
    commands: [
      { command: "gh repo create", description: "Membuat repository baru (lokal & remote)" },
      { command: "gh repo clone <owner>/<repo>", description: "Clone repo dari GitHub" },
      { command: "gh repo view", description: "Melihat detail repo" },
      { command: "gh repo edit", description: "Edit info repo" },
      { command: "gh repo delete", description: "Hapus repo" },
      { command: "gh repo fork", description: "Fork repo orang lain" },
      { command: "gh repo sync", description: "Sinkronkan fork dengan repo asli" },
    ],
  },
  {
    id: "issue",
    title: "Issue",
    icon: "🐞",
    commands: [
      { command: "gh issue list", description: "Lihat daftar issue" },
      { command: "gh issue view <number>", description: "Lihat detail issue tertentu" },
      { command: "gh issue create", description: "Membuat issue baru" },
      { command: "gh issue comment <number>", description: "Menambahkan komentar ke issue" },
      { command: "gh issue close <number>", description: "Menutup issue" },
      { command: "gh issue reopen <number>", description: "Membuka kembali issue" },
      { command: "gh issue edit <number>", description: "Edit judul/deskripsi issue" },
      { command: "gh issue lock / unlock", description: "Mengunci / membuka kunci issue" },
    ],
  },
  {
    id: "pr",
    title: "Pull Request",
    icon: "🔃",
    commands: [
      { command: "gh pr create", description: "Membuat pull request" },
      { command: "gh pr list", description: "Lihat daftar PR" },
      { command: "gh pr view <number>", description: "Lihat detail PR" },
      { command: "gh pr checkout <number>", description: "Checkout PR ke branch lokal" },
      { command: "gh pr merge <number>", description: "Merge PR" },
      { command: "gh pr close <number>", description: "Tutup PR tanpa merge" },
      { command: "gh pr reopen <number>", description: "Buka kembali PR" },
      { command: "gh pr review <number>", description: "Review PR" },
      { command: "gh pr checks <number>", description: "Lihat status check CI/CD di PR" },
      { command: "gh pr update-branch <number>", description: "Update branch PR dengan branch target" },
    ],
  },
  {
    id: "release",
    title: "Release",
    icon: "🚀",
    commands: [
      { command: "gh release list", description: "Lihat daftar rilis" },
      { command: "gh release view <tag>", description: "Lihat detail rilis" },
      { command: "gh release create <tag>", description: "Membuat rilis baru" },
      { command: "gh release edit <tag>", description: "Edit rilis" },
      { command: "gh release upload <tag> <file>", description: "Upload asset ke rilis" },
      { command: "gh release delete <tag>", description: "Hapus rilis" },
    ],
  },
  {
    id: "gist",
    title: "Gist",
    icon: "📝",
    commands: [
      { command: "gh gist create", description: "Membuat gist baru" },
      { command: "gh gist list", description: "Lihat daftar gist" },
      { command: "gh gist view <id>", description: "Lihat isi gist" },
      { command: "gh gist edit <id>", description: "Edit gist" },
      { command: "gh gist delete <id>", description: "Hapus gist" },
    ],
  },
  {
    id: "workflow",
    title: "Workflow & Actions",
    icon: "⚙️",
    commands: [
      { command: "gh workflow list", description: "Daftar workflow (CI/CD)" },
      { command: "gh workflow view <name>", description: "Detail workflow" },
      { command: "gh workflow run <name>", description: "Jalankan workflow" },
      { command: "gh run list", description: "Lihat daftar run" },
      { command: "gh run view <id>", description: "Lihat detail run" },
      { command: "gh run watch", description: "Memantau run secara real-time" },
      { command: "gh run rerun <id>", description: "Menjalankan ulang workflow" },
    ],
  },
  {
    id: "other",
    title: "Utilitas Lainnya",
    icon: "🧰",
    commands: [
      { command: "gh alias", description: "Mengatur alias untuk perintah panjang" },
      { command: "gh config", description: "Mengatur konfigurasi CLI" },
      { command: "gh extension", description: "Install/kelola ekstensi CLI" },
      { command: "gh secret", description: "Mengelola secret di repo" },
      { command: "gh ssh-key", description: "Tambah/hapus/list SSH key" },
      { command: "gh variable", description: "Mengatur variabel environment GitHub" },
    ],
  },
];

function isGithubCliInstalled(): boolean {
  return commandExists("gh");
}

function parseOsRelease(): Record<string, string> | null {
  try {
    const contents = fs.readFileSync("/etc/os-release", "utf8");
    const map: Record<string, string> = {};
    for (const line of contents.split("\n")) {
      const idx = line.indexOf("=");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim().toUpperCase();
      let value = line.slice(idx + 1).trim();
      value = value.replace(/^"|"$/g, "");
      map[key] = value;
    }
    return map;
  } catch {
    return null;
  }
}

function detectLinuxDistribution(): LinuxDistribution {
  const info = parseOsRelease();
  const pretty = info?.PRETTY_NAME || "Linux";
  const id = (info?.ID || "").toLowerCase();
  const idLike = (info?.ID_LIKE || "")
    .split(/\s+/)
    .map((s) => s.toLowerCase())
    .filter(Boolean);
  const tokens = [id, ...idLike];

  const includes = (values: string[]) => tokens.some((token) => values.includes(token));

  if (includes(["debian", "ubuntu", "linuxmint", "pop", "elementary", "zorin", "kali", "raspbian"])) {
    return { family: "debian", name: pretty };
  }
  if (includes(["fedora", "rhel", "centos", "rocky", "alma", "amzn"])) {
    return { family: "rhel", name: pretty };
  }
  if (includes(["opensuse", "sles", "suse"])) {
    return { family: "suse", name: pretty };
  }
  if (includes(["arch", "manjaro", "endeavouros", "garuda"])) {
    return { family: "arch", name: pretty };
  }
  if (includes(["alpine"])) {
    return { family: "alpine", name: pretty };
  }

  return { family: "unknown", name: pretty };
}

function getMacPlan(): InstallPlan {
  if (commandExists("brew")) {
    return {
      type: "automatic",
      label: "macOS via Homebrew",
      commands: [
        "brew update",
        "brew install gh",
      ],
    };
  }

  return {
    type: "manual",
    label: "macOS manual installation",
    instructions: [
      "Install Homebrew first: https://brew.sh",
      "Then run: brew install gh",
      "Alternatively download the PKG installer from https://cli.github.com",
    ],
  };
}

function getWindowsPlan(): InstallPlan {
  if (commandExists("winget")) {
    return {
      type: "automatic",
      label: "Windows via winget",
      commands: [
        "winget install --id GitHub.cli -e --source winget",
      ],
    };
  }

  if (commandExists("choco")) {
    return {
      type: "automatic",
      label: "Windows via Chocolatey",
      commands: [
        "choco install gh -y",
      ],
    };
  }

  return {
    type: "manual",
    label: "Windows manual installation",
    instructions: [
      "Install winget (available on recent Windows 10/11) or Chocolatey",
      "With winget: winget install --id GitHub.cli -e --source winget",
      "Or download the MSI installer from https://cli.github.com",
    ],
  };
}

function getLinuxPlan(): InstallPlan {
  const distro = detectLinuxDistribution();
  const label = `${distro.name} (${distro.family})`;

  switch (distro.family) {
    case "debian":
      return {
        type: "automatic",
        label,
        commands: [
          "sudo mkdir -p -m 755 /etc/apt/keyrings",
          "curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null",
          "sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg",
          "echo \"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main\" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null",
          "sudo apt update",
          "sudo apt install gh -y",
        ],
      };
    case "rhel":
      return {
        type: "automatic",
        label,
        commands: [
          "sudo dnf install -y 'dnf-command(config-manager)'",
          "sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo",
          "sudo dnf install -y gh",
        ],
      };
    case "suse":
      return {
        type: "automatic",
        label,
        commands: [
          "sudo zypper -n addrepo https://cli.github.com/packages/rpm/gh-cli.repo",
          "sudo zypper -n refresh",
          "sudo zypper -n install gh",
        ],
      };
    case "arch":
      return {
        type: "automatic",
        label,
        commands: [
          "sudo pacman -Sy --noconfirm github-cli",
        ],
      };
    case "alpine":
      return {
        type: "automatic",
        label,
        commands: [
          "sudo apk add github-cli",
        ],
      };
    default:
      return {
        type: "manual",
        label,
        instructions: [
          "Distribution not recognised for automatic install.",
          "Please follow the official instructions: https://cli.github.com/manual/installation",
        ],
      };
  }
}

function getInstallPlan(): InstallPlan {
  if (platform.isMacOS) return getMacPlan();
  if (platform.isWindows) return getWindowsPlan();
  if (platform.isLinux) return getLinuxPlan();
  return {
    type: "manual",
    label: `${platform.name} manual installation`,
    instructions: [
      "Automatic installation is not supported on this platform.",
      "Please follow the official instructions: https://cli.github.com/manual/installation",
    ],
  };
}

async function runCommand(command: string): Promise<boolean> {
  const spinner = createSpinner(`$ ${command}`);
  spinner.start();
  const result = await exec(["bash", "-lc", command]);
  if (result.code === 0) {
    spinner.succeed(colors.success(`$ ${command}`));
    return true;
  }
  spinner.fail(colors.error(`$ ${command}`));
  const stderr = result.stderr?.trim() || result.stdout?.trim() || "Unknown error";
  showError(stderr);
  return false;
}

async function runInteractiveGh(args: string[], options: { input?: string } = {}): Promise<boolean> {
  const { command, args: resolvedArgs } = getShellCommand("gh", args);
  const spawnOpts = options.input
    ? { stdio: ["pipe", "inherit", "inherit"] }
    : { stdio: "inherit" };
  try {
    const child = spawn(command, resolvedArgs, spawnOpts);
    if (options.input && child.stdin) {
      child.stdin.write(options.input);
      child.stdin.end();
    }
    return await new Promise<boolean>((resolve) => {
      child.on("close", (code: number) => resolve(code === 0));
      child.on("error", () => resolve(false));
    });
  } catch (error) {
    showError(`Failed to run gh command: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function installGithubCli(): Promise<boolean> {
  const plan = getInstallPlan();

  if (plan.type === "manual") {
    showBox(plan.instructions.join("\n"), { title: plan.label, type: "warning" });
    return false;
  }

  showBox(plan.commands.map((cmd) => colors.text(`$ ${cmd}`)).join("\n"), {
    title: `Instalasi GitHub CLI – ${plan.label}`,
    type: "info",
  });

  const { proceed } = await prompts({
    type: "confirm",
    name: "proceed",
    message: stylePrompt("Jalankan perintah instalasi sekarang?", "confirm"),
    initial: true,
  });

  if (!proceed) {
    showWarning("Melewati instalasi GitHub CLI.");
    return false;
  }

  for (const command of plan.commands) {
    const success = await runCommand(command);
    if (!success) {
      showError("Instalasi GitHub CLI gagal. Silakan jalankan perintah di atas secara manual.");
      return false;
    }
  }

  if (isGithubCliInstalled()) {
    showSuccess("GitHub CLI berhasil terpasang.");
    return true;
  }

  showWarning("Tidak dapat memverifikasi instalasi GitHub CLI. Mohon cek secara manual.");
  return false;
}

function getLoginInstructions(): string[] {
  return [
    "Jalankan: gh auth login",
    "Pilih GitHub.com lalu metode autentikasi (browser atau token)",
    "Ikuti petunjuk di terminal hingga status login berhasil",
  ];
}

function formatCommandReference(entries: CommandReferenceEntry[]): string {
  const maxLength = entries.reduce((max, entry) => Math.max(max, entry.command.length), 0) + 2;
  return entries
    .map((entry) => `${colors.accent(entry.command.padEnd(maxLength))}${colors.text(entry.description)}`)
    .join("\n");
}

function showCommandReferenceCategory(category: CommandReferenceCategory) {
  const content = [
    formatCommandReference(category.commands),
    "",
    colors.muted("Tips:"),
    colors.muted("  • Tambahkan --help setelah perintah untuk melihat opsi lengkap."),
    colors.muted("  • Gunakan --json + --jq untuk skrip otomatis."),
  ].join("\n");

  showBox(content, {
    title: `${category.icon} ${category.title}`,
    type: "info",
  });
}

function ensureGhPrefix(command: string): string {
  const trimmed = command.trim();
  if (!trimmed.startsWith("gh")) {
    return `gh ${trimmed}`.trim();
  }
  return trimmed;
}

function appendHelpFlag(command: string): string {
  if (/\s(-h|--help)(\s|$)/.test(command)) {
    return command;
  }
  return `${command} --help`;
}

function formatDateLocal(iso?: string): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatRepoVisibility(repo: GhRepoSummary): string {
  if (typeof repo.isPrivate === "boolean") {
    return repo.isPrivate ? "Private" : "Public";
  }
  if (repo.visibility) return repo.visibility;
  return "Unknown";
}

function formatGistFiles(files?: GhGistSummary["files"]): string {
  if (!files) return "-";
  if (Array.isArray(files)) {
    if (!files.length) return "-";
    const names = files
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "name" in item) {
          return item.name || "(tanpa nama)";
        }
        return String(item);
      })
      .filter(Boolean);
    if (!names.length) return "-";
    return names.slice(0, 3).join(", ") + (names.length > 3 ? " …" : "");
  }
  const names = Object.keys(files);
  if (!names.length) return "-";
  return names.slice(0, 3).join(", ") + (names.length > 3 ? " …" : "");
}

async function runShellCommandInteractive(commandLine: string): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const child = spawn("bash", ["-lc", commandLine], { stdio: "inherit" });
    child.on("close", (code: number) => resolve(code === 0));
    child.on("error", () => resolve(false));
  });
}

async function promptAndExecuteGhCommand(baseCommand: string, options: { appendHelp?: boolean } = {}) {
  let suggestion = ensureGhPrefix(baseCommand);
  if (options.appendHelp) {
    suggestion = appendHelpFlag(suggestion);
  }

  const { commandLine } = await prompts({
    type: "text",
    name: "commandLine",
    message: stylePrompt("Perintah gh yang akan dijalankan", "input"),
    initial: suggestion,
    validate: (value) => {
      if (!value?.trim()) return "Perintah tidak boleh kosong";
      return value.trim().startsWith("gh") ? true : "Perintah harus dimulai dengan 'gh'";
    },
  });

  if (!commandLine) {
    showWarning("Eksekusi perintah dibatalkan.");
    return;
  }

  const trimmed = commandLine.trim();

  if (/<[^>]+>/.test(trimmed)) {
    showWarning("Perintah masih mengandung placeholder <>. Isi terlebih dahulu sebelum menjalankan.");
    const { proceed } = await prompts({
      type: "confirm",
      name: "proceed",
      message: stylePrompt("Lanjutkan menjalankan perintah ini?", "confirm"),
      initial: false,
    });
    if (!proceed) {
      showWarning("Eksekusi perintah dibatalkan.");
      return;
    }
  }

  showInfo("Menjalankan perintah...");
  const success = await runShellCommandInteractive(trimmed);
  if (success) {
    showSuccess("Perintah selesai.");
  } else {
    showWarning("Perintah gagal atau dihentikan.");
  }
}

async function handleCommandEntry(entry: CommandReferenceEntry) {
  showBox(
    [colors.accent(entry.command), colors.muted(entry.description)].join("\n"),
    { title: "Detail Perintah", type: "info", padding: 1 }
  );

  while (true) {
    const { action } = await prompts({
      type: "select",
      name: "action",
      message: stylePrompt("Pilih aksi"),
      choices: [
        { title: colors.success("▶ Jalankan perintah"), value: "run" },
        { title: colors.secondary("ℹ Tampilkan --help"), value: "help" },
        { title: colors.muted("↩ Kembali"), value: "back" },
      ],
      initial: 0,
    });

    if (!action || action === "back") {
      return;
    }

    if (action === "run") {
      await promptAndExecuteGhCommand(entry.command);
      continue;
    }

    if (action === "help") {
      await promptAndExecuteGhCommand(entry.command, { appendHelp: true });
      continue;
    }
  }
}

async function handleCommandReferenceCategory(category: CommandReferenceCategory) {
  showCommandReferenceCategory(category);

  while (true) {
    const { commandIdx } = await prompts({
      type: "select",
      name: "commandIdx",
      message: stylePrompt("Pilih perintah untuk detail atau eksekusi"),
      choices: [
        ...category.commands.map((cmd, idx) => ({
          title: colors.text(cmd.command),
          value: idx,
          description: cmd.description,
        })),
        { title: colors.muted("↩ Kembali"), value: -1 },
      ],
      initial: 0,
    });

    if (commandIdx === undefined || commandIdx < 0) {
      return;
    }

    const entry = category.commands[commandIdx];
    if (entry) {
      await handleCommandEntry(entry);
    }
  }
}

async function showGithubCliCommandReference(): Promise<void> {
  while (true) {
    const { categoryId } = await prompts({
      type: "select",
      name: "categoryId",
      message: stylePrompt("Pilih kategori perintah GitHub CLI"),
      choices: [
        ...COMMAND_REFERENCE.map((category) => ({
          title: colors.text(`${category.icon} ${category.title}`),
          value: category.id,
        })),
        { title: colors.muted("↩ Kembali"), value: "back" },
      ],
      initial: 0,
    });

    if (!categoryId || categoryId === "back") {
      return;
    }

    const category = COMMAND_REFERENCE.find((item) => item.id === categoryId);
    if (category) {
      await handleCommandReferenceCategory(category);
    }
  }
}

async function listGithubRepos(): Promise<void> {
  if (!isGithubCliInstalled()) {
    showWarning("GitHub CLI belum terpasang.");
    return;
  }

  const authed = await ensureGithubCliAuth({ promptLogin: true, quietOnSuccess: true });
  if (!authed) return;

  const spinner = createSpinner("Mengambil daftar repository...");
  spinner.start();
  const result = await exec([
    "gh",
    "repo",
    "list",
    "--json",
    "nameWithOwner,description,isPrivate,visibility,updatedAt,url",
    "--limit",
    "20",
  ]);

  if (result.code !== 0) {
    spinner.fail(colors.error("Gagal mengambil daftar repository."));
    showError(result.stderr?.trim() || result.stdout?.trim() || "Unknown error");
    return;
  }

  spinner.succeed(colors.success("Daftar repository berhasil diambil."));

  let repos: GhRepoSummary[] = [];
  try {
    repos = JSON.parse(result.stdout || "[]");
  } catch (error) {
    showError(`Gagal parsing data repository: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  if (!repos.length) {
    showWarning("Tidak ada repository ditemukan. Gunakan --public/--private saat perlu.");
    return;
  }

  const sections = repos.map((repo, idx) => {
    const header = colors.primary(`${idx + 1}. ${repo.nameWithOwner}`);
    const desc = repo.description ? colors.text(`   ${repo.description}`) : colors.muted("   (tidak ada deskripsi)");
    const meta = colors.muted(`   ${formatRepoVisibility(repo)} • Update terakhir ${formatDateLocal(repo.updatedAt)}`);
    const url = repo.url ? colors.accent(`   ${repo.url}`) : "";
    return [header, desc, meta, url].filter(Boolean).join("\n");
  });

  showBox(sections.join("\n\n"), { title: "Daftar Repository", type: "info", padding: 1 });
}

async function listGithubGists(): Promise<void> {
  if (!isGithubCliInstalled()) {
    showWarning("GitHub CLI belum terpasang.");
    return;
  }

  const authed = await ensureGithubCliAuth({ promptLogin: true, quietOnSuccess: true });
  if (!authed) return;

  const spinner = createSpinner("Mengambil daftar gist...");
  spinner.start();
  const result = await exec([
    "gh",
    "api",
    "/gists?per_page=20",
  ]);

  if (result.code !== 0) {
    spinner.fail(colors.error("Gagal mengambil daftar gist."));
    showError(result.stderr?.trim() || result.stdout?.trim() || "Unknown error");
    return;
  }

  spinner.succeed(colors.success("Daftar gist berhasil diambil."));

  let gists: GhGistSummary[] = [];
  try {
    gists = JSON.parse(result.stdout || "[]");
  } catch (error) {
    showError(`Gagal parsing data gist: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  if (!gists.length) {
    showWarning("Tidak ada gist ditemukan.");
    return;
  }

  const sections = gists.map((gist, idx) => {
    const title = gist.name || gist.url || gist.id || `Gist ${idx + 1}`;
    const header = colors.secondary(`${idx + 1}. ${title}`);
    const desc = gist.description ? colors.text(`   ${gist.description}`) : colors.muted("   (tidak ada deskripsi)");
    const isPublic = typeof gist.isPublic === "boolean" ? gist.isPublic : !!gist.public;
    const visibility = isPublic ? "Public" : "Secret";
    const meta = colors.muted(`   ${visibility} • Update terakhir ${formatDateLocal(gist.updatedAt || (gist as any).updated_at)}`);
    const files = formatGistFiles(gist.files);
    const filesLine = files ? colors.muted(`   Files: ${files}`) : "";
    const url = (gist.url || (gist as any).html_url) ? colors.accent(`   ${(gist.url || (gist as any).html_url)}`) : "";
    return [header, desc, meta, filesLine, url].filter(Boolean).join("\n");
  });

  showBox(sections.join("\n\n"), { title: "Daftar Gist", type: "info", padding: 1 });
}

async function showGithubCliVersion(): Promise<void> {
  const result = await exec(["gh", "--version"]);
  if (result.code === 0) {
    const lines = result.stdout.trim().split(/\r?\n/);
    showBox(lines.join("\n"), { title: "GitHub CLI Version", type: "info" });
  } else {
    showWarning("Gagal membaca versi GitHub CLI.");
    if (result.stderr) showError(result.stderr.trim());
  }
}

async function getGithubCliAuthStatus(): Promise<{ authenticated: boolean; message: string }> {
  const result = await exec(["gh", "auth", "status"]);
  if (result.code === 0) {
    return { authenticated: true, message: result.stdout.trim() };
  }
  const message = (result.stderr || result.stdout || "Belum login").trim();
  return { authenticated: false, message };
}

interface EnsureGithubCliAuthOptions {
  promptLogin: boolean;
  quietOnSuccess?: boolean;
}

async function ensureGithubCliAuth(options: EnsureGithubCliAuthOptions): Promise<boolean> {
  const { promptLogin, quietOnSuccess = false } = options;
  const status = await getGithubCliAuthStatus();
  if (status.authenticated) {
    if (!quietOnSuccess) {
      showSuccess("GitHub CLI sudah login.");
      showInfo(status.message.split(/\r?\n/).join("\n"));
    }
    return true;
  }

  showWarning("GitHub CLI belum login.");
  showBox(status.message, { title: "gh auth status", type: "warning" });

  if (!promptLogin) {
    showInfo("Gunakan menu 'Kelola GitHub CLI' untuk menjalankan proses login.");
    return false;
  }

  const { login } = await prompts({
    type: "confirm",
    name: "login",
    message: stylePrompt("Ingin login menggunakan GitHub CLI sekarang?", "confirm"),
    initial: true,
  });

  if (!login) {
    showWarning("Login GitHub CLI dilewati.");
    showBox(getLoginInstructions().join("\n"), { title: "Panduan Login GitHub CLI", type: "info" });
    return false;
  }

  await promptGithubCliLogin();
  const after = await getGithubCliAuthStatus();
  if (after.authenticated) {
    showSuccess("Login GitHub CLI berhasil.");
    return true;
  }

  showWarning("Status login GitHub CLI belum aktif. Silakan coba lagi secara manual.");
  return false;
}

async function promptGithubCliLogin(): Promise<boolean> {
  if (!isGithubCliInstalled()) {
    showWarning("GitHub CLI belum terpasang. Instal terlebih dahulu.");
    return false;
  }

  const { gitProtocol } = await prompts({
    type: "select",
    name: "gitProtocol",
    message: stylePrompt("Pilih Git protocol default untuk gh"),
    choices: [
      { title: colors.accent("HTTPS"), value: "https" },
      { title: colors.primary("SSH"), value: "ssh" },
    ],
    initial: 0,
  });

  if (!gitProtocol) {
    showWarning("Pemilihan Git protocol dibatalkan.");
    return false;
  }

  const { method } = await prompts({
    type: "select",
    name: "method",
    message: stylePrompt("Pilih metode login GitHub CLI"),
    choices: [
      { title: colors.primary("🌐 Login via browser"), value: "browser" },
      { title: colors.accent("🔐 Login via device code"), value: "device" },
      { title: colors.secondary("🔑 Login menggunakan token"), value: "token" },
      { title: colors.muted("Batal"), value: "cancel" },
    ],
    initial: 0,
  });

  if (!method || method === "cancel") {
    showWarning("Login GitHub CLI dibatalkan.");
    return false;
  }

  if (method === "browser") {
    const args = [
      "auth",
      "login",
      "--hostname",
      "github.com",
      "--web",
      "--git-protocol",
      gitProtocol,
      "--skip-ssh-key",
    ];
    showInfo("Menjalankan gh auth login dalam mode browser.");
    const success = await runInteractiveGh(args);
    if (success) {
      showSuccess("Proses login selesai.");
    } else {
      showWarning("Login via browser tidak berhasil. Silakan coba lagi atau gunakan metode lain.");
    }
    return success;
  }

  if (method === "device") {
    const args = [
      "auth",
      "login",
      "--hostname",
      "github.com",
      "--device",
      "--git-protocol",
      gitProtocol,
      "--skip-ssh-key",
    ];
    showInfo("Menjalankan gh auth login mode device code. Ikuti instruksi pada terminal.");
    const success = await runInteractiveGh(args);
    if (success) {
      showSuccess("Proses login selesai.");
    } else {
      showWarning("Login via device code tidak berhasil. Silakan coba lagi atau gunakan metode lain.");
    }
    return success;
  }

  const { token } = await prompts({
    type: "password",
    name: "token",
    message: stylePrompt("Masukkan GitHub Personal Access Token"),
    validate: (value) => (!!value ? true : "Token diperlukan"),
  });

  if (!token) {
    showWarning("Token tidak diberikan. Login dibatalkan.");
    return false;
  }

  showInfo("Mengirim token ke gh auth login --with-token ...");
  const success = await runInteractiveGh(["auth", "login", "--with-token"], { input: `${token}\n` });
  if (success) {
    showSuccess("Token diterima. Cek status login...");
  } else {
    showWarning("Login dengan token gagal. Pastikan token valid dan memiliki scope yang diperlukan.");
  }
  return success;
}

async function showGithubCliSummary(): Promise<void> {
  if (!isGithubCliInstalled()) {
    showWarning("GitHub CLI belum terpasang.");
    return;
  }
  await showGithubCliVersion();
  const status = await getGithubCliAuthStatus();
  const type = status.authenticated ? "success" : "warning";
  showBox(status.message, { title: "gh auth status", type });
}

export async function ensureGithubCli(options: EnsureGithubCliOptions = {}): Promise<boolean> {
  const { promptInstall = true, promptLogin = true } = options;

  if (isGithubCliInstalled()) {
    if (promptLogin) {
      await ensureGithubCliAuth({ promptLogin: true, quietOnSuccess: true });
    }
    return true;
  }

  showWarning("GitHub CLI (gh) tidak terdeteksi di sistem Anda.");
  showInfo("Beberapa fitur GhUp dapat memanfaatkan GitHub CLI untuk operasi lanjutan.");

  if (!promptInstall) {
    showInfo("Lewati instalasi GitHub CLI untuk sekarang. Gunakan menu 'Kelola GitHub CLI' bila dibutuhkan.");
    return false;
  }

  const installed = await installGithubCli();
  if (installed && promptLogin) {
    await ensureGithubCliAuth({ promptLogin: true });
  }
  return installed;
}

export async function manageGithubCliFlow(): Promise<void> {
  await showGithubCliSummary();

  while (true) {
    const installed = isGithubCliInstalled();
    const { action } = await prompts({
      type: "select",
      name: "action",
      message: stylePrompt("Kelola GitHub CLI"),
      choices: [
        { title: colors.accent("🔎 Cek status GitHub CLI"), value: "status" },
        { title: colors.success(installed ? "⬆️  Perbarui / reinstall GitHub CLI" : "⬇️  Instal GitHub CLI"), value: "install" },
        { title: colors.primary("🔐 Login GitHub CLI"), value: "login" },
        { title: colors.accent("📁 Daftar repository saya"), value: "repolist" },
        { title: colors.accent("🗒️  Daftar gist saya"), value: "gistlist" },
        { title: colors.secondary("📚 Panduan perintah GitHub CLI"), value: "reference" },
        { title: colors.muted("↩ Kembali"), value: "back" },
      ],
      initial: 0,
    });

    if (!action || action === "back") {
      showInfo("Kembali ke menu utama.");
      return;
    }

    if (action === "status") {
      await showGithubCliSummary();
      continue;
    }

    if (action === "install") {
      const installedNow = await installGithubCli();
      if (installedNow) {
        await ensureGithubCliAuth({ promptLogin: true });
      }
      await showGithubCliSummary();
      continue;
    }

    if (action === "login") {
      const success = await promptGithubCliLogin();
      if (success) {
        await ensureGithubCliAuth({ promptLogin: false, quietOnSuccess: false });
      } else {
        showBox(getLoginInstructions().join("\n"), { title: "Panduan Login GitHub CLI", type: "info" });
      }
      await showGithubCliSummary();
      continue;
    }

    if (action === "repolist") {
      await listGithubRepos();
      continue;
    }

    if (action === "gistlist") {
      await listGithubGists();
      continue;
    }

    if (action === "reference") {
      await showGithubCliCommandReference();
      continue;
    }
  }
}

export default {
  ensureGithubCli,
  manageGithubCliFlow,
};
