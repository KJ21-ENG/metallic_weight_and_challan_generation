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
