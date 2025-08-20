import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Support ESM: derive __dirname from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine dotenv path and project root in a way that works for both ESM and CommonJS output.
const envProjectRoot = process.env.PROJECT_ROOT;
const defaultProjectRoot = path.resolve(__dirname, "../../");
const dotenvPath = envProjectRoot ? path.resolve(envProjectRoot, ".env") : path.resolve(__dirname, "../.env");

dotenv.config({ path: dotenvPath });

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  projectRoot: process.env.PROJECT_ROOT || defaultProjectRoot,
};

// No hard warning if DATABASE_URL absent; we support discrete PG* vars now.
