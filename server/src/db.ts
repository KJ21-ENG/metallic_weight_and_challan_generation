import { Pool, type PoolConfig } from "pg";

function buildPoolConfig(): PoolConfig | { connectionString: string } {
  const url = (process.env.DATABASE_URL || "").trim();
  if (url) {
    return { connectionString: url };
  }

  const host = process.env.PGHOST || "localhost";
  const port = parseInt(process.env.PGPORT || "5432", 10);
  const user = process.env.PGUSER || "postgres";
  // Coerce password to a string or undefined to avoid pg auth errors
  const password = process.env.PGPASSWORD;
  // const password = rawPassword === undefined || rawPassword === null ? undefined : String(rawPassword);
  const database = process.env.PGDATABASE;
  const ssl = process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined;

  // Helpful debug when packaged: don't log secrets, only types/length
  try {
    // eslint-disable-next-line no-console
    console.log(`PG config -> host=${host} port=${port} user=${user} passwordType=${typeof password} passwordPresent=${password !== undefined} database=${database}`);
  } catch (e) {}

  return { host, port, user, password, database, ssl };
}

export const pool = new Pool(buildPoolConfig());

export async function withTransaction<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
