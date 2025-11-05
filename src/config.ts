import * as fs from "fs";
import * as path from "path";
import type { AppConfig } from "./types";
import { getConfigDirectory, ensureDirectory } from "./utils/platform";

const PRIMARY_CONFIG_DIR = getConfigDirectory("ghe");
const LEGACY_CONFIG_DIR = getConfigDirectory("github-switch");

const PRIMARY_CONFIG_PATH = path.join(PRIMARY_CONFIG_DIR, "config.json");
const LEGACY_CONFIG_PATH = path.join(LEGACY_CONFIG_DIR, "config.json");

export const CONFIG_DIR = PRIMARY_CONFIG_DIR;
export const CONFIG_PATH = PRIMARY_CONFIG_PATH;

export function loadConfig(): AppConfig {
    const readPaths = [PRIMARY_CONFIG_PATH, LEGACY_CONFIG_PATH];

    for (const candidate of readPaths) {
        try {
            const raw = fs.readFileSync(candidate, "utf8");
            const parsed = JSON.parse(raw) as AppConfig;
            if (!parsed.accounts) return { accounts: [] };

            // If loaded from legacy path, migrate to new location on first save
            if (
                candidate === LEGACY_CONFIG_PATH &&
                !fs.existsSync(PRIMARY_CONFIG_PATH)
            ) {
                try {
                    ensureDirectory(PRIMARY_CONFIG_DIR);
                    fs.writeFileSync(
                        PRIMARY_CONFIG_PATH,
                        JSON.stringify(parsed, null, 2) + "\n",
                        "utf8",
                    );
                } catch {
                    // ignore migration errors; will retry on save
                }
            }

            return parsed;
        } catch {
            continue;
        }
    }

    return { accounts: [] };
}

export function saveConfig(cfg: AppConfig) {
    ensureDirectory(PRIMARY_CONFIG_DIR);
    fs.writeFileSync(
        PRIMARY_CONFIG_PATH,
        JSON.stringify(cfg, null, 2) + "\n",
        "utf8",
    );
}
