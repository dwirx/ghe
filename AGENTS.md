# Repository Guidelines

## Project Structure & Module Organization
The CLI entry point lives at `index.ts`, with core logic split across `src/`. Feature flows and prompts sit in `src/cli.ts` and `src/flows.ts`, while Git helpers, SSH utilities, and shared types live under `src/git.ts`, `src/ssh.ts`, and `src/types.ts`. Cross-cutting helpers are grouped in `src/utils/`. Build artifacts land in `build/` (gitignored). Release automation and installers (`build.sh`, `release.sh`, `publish-npm.sh`, `install.sh`, `install-curl.sh`, `ghe.sh`) live in the repository root. Runtime configuration is managed by `src/config.ts` and saved to `~/.config/ghe/config.json`.

## Build, Test, and Development Commands
- `bun install` — install dependencies (required before any local run).
- `bun run start` — execute the interactive CLI directly from source.
- `bun run build` — compile a native binary for the current platform into `build/ghe`.
- `bun run build:all` or `./build.sh` — produce binaries for all supported targets plus SHA256 checksums.
- `npm pack --dry-run` — verify the npm package contents before publishing.

## Coding Style & Naming Conventions
TypeScript code is authored as ECMAScript modules with two-space indentation and trailing newlines. Prefer named exports, keep identifiers in `camelCase`, and reserve `UPPER_SNAKE_CASE` for constants such as version strings. Centralize shared interfaces in `src/types.ts`, favor compact helpers in `src/utils/`, and lean on your editor’s TypeScript formatter—no project-level lint step ships yet.

## Testing Guidelines
The project has no automated test suite; lean on repeatable manual checks. After building, run `bash test-installation.sh` to cover the curl installer, local script, and npm pack flow, and confirm binaries answer `ghe --version`. When verifying new flows, prefer working inside a temporary Git repository so account detection and SSH prompts can be inspected safely. Capture manual steps or edge cases in the PR description until automated coverage exists.

## Commit & Pull Request Guidelines
Commit history uses imperative, Title-Case subject lines without trailing punctuation (e.g., `Enhance CLI with repository context display and account detection`). Keep commits scoped to a single concern and update `CHANGELOG.md` or `VERSION` when release-facing behavior changes. For pull requests, include: (1) a concise summary, (2) linked issues or release notes, (3) build/test commands with results, and (4) screenshots or terminal captures for new CLI output. Call out configuration impacts so reviewers can reproduce the scenario quickly.
