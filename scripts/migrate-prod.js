const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@libsql/client');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const root = process.cwd();
  loadEnvFile(path.join(root, '.env.local'));
  loadEnvFile(path.join(root, '.env'));

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

  if (!url) {
    throw new Error('TURSO_DATABASE_URL is missing. Set it in .env.local or environment variables.');
  }

  const db = createClient({ url, authToken });

  await db.execute(`
    CREATE TABLE IF NOT EXISTS __migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
    )
  `);

  const migrationDir = path.join(root, 'migrations');
  const files = fs
    .readdirSync(migrationDir)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  for (const file of files) {
    const fullPath = path.join(migrationDir, file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    const checksum = crypto.createHash('sha256').update(sql).digest('hex');

    const existing = await db.execute({
      sql: 'SELECT checksum FROM __migrations WHERE name = ?',
      args: [file],
    });

    if (existing.rows.length > 0) {
      const prev = existing.rows[0].checksum;
      if (prev !== checksum) {
        throw new Error(`Migration checksum mismatch for ${file}. Create a new migration instead of editing applied ones.`);
      }
      console.log(`Skipping ${file} (already applied)`);
      continue;
    }

    console.log(`Applying ${file}...`);
    const statements = splitSqlStatements(sql);

    for (const statement of statements) {
      await db.execute(statement);
    }
    await db.execute({
      sql: 'INSERT INTO __migrations (name, checksum) VALUES (?, ?)',
      args: [file, checksum],
    });
    console.log(`Applied ${file}`);
  }

  console.log('Migration completed successfully.');
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
