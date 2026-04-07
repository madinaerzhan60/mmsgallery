const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { DatabaseSync } = require('node:sqlite');

const sqlitePath = path.join(__dirname, '..', 'mmsgallery.sqlite');
const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
const supabaseDbUrl = process.env.DATABASE_URL;

if (!supabaseDbUrl) {
  console.error('Missing DATABASE_URL environment variable.');
  process.exit(1);
}

if (!fs.existsSync(sqlitePath)) {
  console.error(`SQLite file not found: ${sqlitePath}`);
  process.exit(1);
}

if (!fs.existsSync(schemaPath)) {
  console.error(`Schema file not found: ${schemaPath}`);
  process.exit(1);
}

const TABLES_IN_ORDER = [
  'users',
  'artworks',
  'likes',
  'comments',
  'follows',
  'notifications',
  'feedback',
  'profile_views',
  'email_verification_tokens',
  'password_reset_tokens'
];

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function toPgValue(value) {
  if (value === undefined) return null;
  return value;
}

async function upsertTable(pg, sqlite, tableName) {
  const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all();
  if (!rows.length) {
    console.log(`- ${tableName}: 0 rows`);
    return;
  }

  for (const row of rows) {
    const columns = Object.keys(row);
    const values = columns.map((c) => toPgValue(row[c]));
    const colSql = columns.map(quoteIdent).join(', ');
    const valSql = values.map((_, i) => `$${i + 1}`).join(', ');

    const updateCols = columns.filter((c) => c !== 'id');
    const updateSql = updateCols.length
      ? updateCols.map((c) => `${quoteIdent(c)} = EXCLUDED.${quoteIdent(c)}`).join(', ')
      : 'id = EXCLUDED.id';

    const sql = `
      INSERT INTO ${quoteIdent(tableName)} (${colSql})
      VALUES (${valSql})
      ON CONFLICT (id) DO UPDATE SET ${updateSql}
    `;

    await pg.query(sql, values);
  }

  console.log(`- ${tableName}: ${rows.length} rows`);
}

async function syncSequences(pg) {
  const identityTables = [
    'users',
    'artworks',
    'likes',
    'comments',
    'follows',
    'notifications',
    'feedback',
    'profile_views',
    'email_verification_tokens',
    'password_reset_tokens'
  ];

  for (const table of identityTables) {
    const seq = `${table}_id_seq`;
    await pg.query(`
      SELECT setval($1, COALESCE((SELECT MAX(id) FROM ${quoteIdent(table)}), 1), true)
    `, [seq]);
  }
}

async function main() {
  const sqlite = new DatabaseSync(sqlitePath);
  sqlite.exec('PRAGMA foreign_keys = ON');

  const pg = new Client({
    connectionString: supabaseDbUrl,
    ssl: { rejectUnauthorized: false }
  });

  await pg.connect();

  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await pg.query('BEGIN');
    await pg.query(schemaSql);

    for (const table of TABLES_IN_ORDER) {
      await upsertTable(pg, sqlite, table);
    }

    await syncSequences(pg);

    await pg.query('COMMIT');
    console.log('\nMigration completed successfully.');
  } catch (err) {
    await pg.query('ROLLBACK');
    console.error('\nMigration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pg.end();
  }
}

main();
