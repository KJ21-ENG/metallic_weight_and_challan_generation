import fs from "fs";
import path from "path";
import { pool } from "../db";

async function ensureMigrationsTable() {
  await pool.query(`
    create table if not exists _migrations (
      name text primary key,
      run_on timestamptz not null default now()
    )
  `);
}

async function getRanMigrations(): Promise<Set<string>> {
  const res = await pool.query("select name from _migrations");
  return new Set(res.rows.map((r: any) => r.name));
}

async function run() {
  await ensureMigrationsTable();
  const dir = path.resolve(__dirname, "../../migrations");
  const files = (await fs.promises.readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const ran = await getRanMigrations();

  for (const file of files) {
    if (ran.has(file)) {
      // eslint-disable-next-line no-console
      console.log(`Skipping already applied migration: ${file}`);
      continue;
    }
    const filepath = path.join(dir, file);
    const sql = await fs.promises.readFile(filepath, "utf8");
    // eslint-disable-next-line no-console
    console.log(`Applying migration: ${file}`);
    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query("insert into _migrations (name) values ($1)", [file]);
      await pool.query("COMMIT");
    } catch (err) {
      await pool.query("ROLLBACK");
      // eslint-disable-next-line no-console
      console.error(`Failed migration ${file}:`, err);
      process.exitCode = 1;
      throw err;
    }
  }
  // eslint-disable-next-line no-console
  console.log("Migrations complete.");
  await pool.end();
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
