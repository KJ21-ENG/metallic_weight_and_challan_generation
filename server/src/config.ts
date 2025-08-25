import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Support ESM: derive __dirname from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine dotenv path and project root in a way that works for both packaged and dev.
const envProjectRoot = process.env.PROJECT_ROOT;
const defaultProjectRoot = path.resolve(__dirname, "../../");

// Priority:
// 1) PROJECT_ROOT/.env (writable location for packaged app)
// 2) RESOURCES_ENV_PATH from Electron (packaged .env in resources)
// 3) server local ../.env (development)
const candidateEnvPaths: string[] = [];
try {
  if (envProjectRoot) candidateEnvPaths.push(path.resolve(envProjectRoot, ".env"));
  if (process.env.RESOURCES_ENV_PATH) candidateEnvPaths.push(String(process.env.RESOURCES_ENV_PATH));
} catch {}
candidateEnvPaths.push(path.resolve(__dirname, "../.env"));

let loadedEnv = false;
for (const p of candidateEnvPaths) {
  try {
    if (fs.existsSync(p)) {
      const res = dotenv.config({ path: p });
      if (!res.error) {
        try { console.log(`[config] Loaded .env from ${p}`); } catch {}
        loadedEnv = true;
        break;
      }
    }
  } catch {}
}
if (!loadedEnv) {
  // Final fallback: attempt default .env resolution (likely no-op in production)
  try { dotenv.config(); } catch {}
}

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  projectRoot: process.env.PROJECT_ROOT || defaultProjectRoot,
};

// No hard warning if DATABASE_URL absent; we support discrete PG* vars now.
