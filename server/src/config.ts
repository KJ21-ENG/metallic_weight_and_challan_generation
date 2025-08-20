import path from "path";
import dotenv from "dotenv";

// Determine dotenv path and project root in a way that works for CommonJS output.
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
