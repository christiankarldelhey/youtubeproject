import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db/pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../db/migrations');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getPendingMigrations(): Promise<string[]> {
  const files = await readdir(migrationsDir);
  const sqlFiles = files.filter((file) => file.endsWith('.sql')).sort();

  const result = await pool.query<{ filename: string }>('SELECT filename FROM schema_migrations');
  const executed = new Set(result.rows.map((row) => row.filename));

  return sqlFiles.filter((file) => !executed.has(file));
}

async function runMigration(filename: string) {
  const fullPath = path.join(migrationsDir, filename);
  const sql = await readFile(fullPath, 'utf-8');

  await pool.query('BEGIN');

  try {
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    await pool.query('COMMIT');
    console.log(`Applied migration: ${filename}`);
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  try {
    await ensureMigrationsTable();
    const pending = await getPendingMigrations();

    if (pending.length === 0) {
      console.log('No pending migrations');
      process.exitCode = 0;
      return;
    }

    for (const migration of pending) {
      await runMigration(migration);
    }

    console.log(`Migrations complete (${pending.length} applied)`);
    process.exitCode = 0;
  } catch (error) {
    console.error('Migration run failed', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
