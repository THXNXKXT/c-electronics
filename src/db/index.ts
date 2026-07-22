import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// ponytail: neon() returns HTTP query fn, neon-http adapter wraps it
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
