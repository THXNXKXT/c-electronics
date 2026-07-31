import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

function createDatabase(pool: Pool) {
  return drizzle(pool, { schema });
}

type TransactionalDatabase = ReturnType<typeof createDatabase>;
export type DatabaseTransaction = Parameters<
  Parameters<TransactionalDatabase["transaction"]>[0]
>[0];

export async function withDatabaseTransaction<T>(
  operation: (tx: DatabaseTransaction) => Promise<T>,
): Promise<T> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const transactionDb = createDatabase(pool);

  try {
    return await transactionDb.transaction(operation);
  } finally {
    await pool.end();
  }
}
