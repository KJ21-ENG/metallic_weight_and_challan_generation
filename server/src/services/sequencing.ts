import { withTransaction } from "../db";

export async function getNextSequence(key: string): Promise<number> {
  return withTransaction(async (client) => {
    const upsert = `
      insert into sequencing (key, value) values ($1, 0)
      on conflict (key) do nothing
    `;
    await client.query(upsert, [key]);

    const updated = await client.query(
      "update sequencing set value = value + 1 where key = $1 returning value",
      [key]
    );
    const nextVal: number = updated.rows[0].value;
    return nextVal;
  });
}

// Peek current sequence without increment
export async function peekSequence(key: string): Promise<number> {
  const res = await withTransaction(async (client) => {
    const row = await client.query("select value from sequencing where key=$1", [key]);
    if (row.rowCount === 0) return 0;
    return Number(row.rows[0].value);
  });
  return res;
}
