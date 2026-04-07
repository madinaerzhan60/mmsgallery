const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const databaseUrl = String(process.env.DATABASE_URL || '').trim();
const usePg = Boolean(databaseUrl);

const pgPool = usePg
  ? new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    })
  : null;

const pgSchemaPath = path.join(__dirname, 'supabase', 'schema.sql');
let schemaState = 'unknown';

async function ensurePgSchema() {
  if (!usePg || !pgPool) return false;
  if (schemaState === 'ready') return true;

  try {
    const exists = await pgPool.query(
      `SELECT 1
       FROM information_schema.tables
       WHERE table_schema='public' AND table_name='users'
       LIMIT 1`
    );

    if (exists.rows[0]) {
      schemaState = 'ready';
      return true;
    }

    const schemaSql = fs.readFileSync(pgSchemaPath, 'utf8');
    await pgPool.query(schemaSql);

    const recheck = await pgPool.query(
      `SELECT 1
       FROM information_schema.tables
       WHERE table_schema='public' AND table_name='users'
       LIMIT 1`
    );

    schemaState = recheck.rows[0] ? 'ready' : 'failed';
  } catch (error) {
    schemaState = 'failed';
    console.warn('[pg-schema] Failed to ensure schema:', error.message);
  }

  return schemaState === 'ready';
}

module.exports = {
  pgPool,
  usePg,
  ensurePgSchema
};
