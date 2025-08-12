import path from "path";
import dotenv from "dotenv";

// Load .env from server root regardless of CWD or build dir
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  projectRoot: process.env.PROJECT_ROOT || path.resolve(__dirname, "../../"),
};

if (!config.databaseUrl) {
  // eslint-disable-next-line no-console
  console.warn("DATABASE_URL is not set. Configure server/.env before running.");
}
