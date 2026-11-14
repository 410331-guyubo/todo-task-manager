import Database from "better-sqlite3";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

const dbUrl = process.env.DATABASE_URL || "sqlite:./data.db";
const isPg = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");

let pgPool: Pool | null = null;
let sqlite: any = null;

export function getDb() {
  if (isPg) {
    if (!pgPool) pgPool = new Pool({ connectionString: dbUrl });
    return { type: "pg" as const, pool: pgPool };
  } else {
    if (!sqlite) {
      const file = dbUrl.replace(/^sqlite:/, "") || "./data.db";
      const abs = path.resolve(process.cwd(), file);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      sqlite = new (Database as any)(abs);
      sqlite.pragma("journal_mode = WAL");
      sqlite.pragma("foreign_keys = ON");
    }
    return { type: "sqlite" as const, db: sqlite };
  }
}

export function initDb() {
  const c = getDb();
  if (c.type === "sqlite") {
    c.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    c.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL CHECK(length(title) > 0 AND length(title) <= 200),
        description TEXT NOT NULL DEFAULT '',
        completed INTEGER NOT NULL DEFAULT 0,
        due_date TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    c.db.exec("CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);");
  }
}

export async function initDbPg() {
  const c = getDb();
  if (c.type !== "pg") return;
  await c.pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  await c.pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL CHECK(char_length(title) > 0 AND char_length(title) <= 200),
      description TEXT NOT NULL DEFAULT '',
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      due_date DATE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  await c.pool.query("CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);");
}
