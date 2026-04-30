require('dotenv').config();
const { pgPool, usePg } = require('../pg');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

async function start() {
  console.log('🔍 Checking for orphaned artworks...');
  console.log('usePg:', usePg);

  if (usePg) {
    console.log('--- PostgreSQL (Supabase) ---');
    const result = await pgPool.query(`
      SELECT id, title, user_id FROM artworks 
      WHERE user_id NOT IN (SELECT id FROM users)
    `);
    console.log(`Found ${result.rows.length} orphaned artworks in PostgreSQL.`);
    
    if (result.rows.length > 0) {
      await pgPool.query(`
        DELETE FROM artworks 
        WHERE user_id NOT IN (SELECT id FROM users)
      `);
      console.log('✅ Deleted orphaned artworks from PostgreSQL.');
    }
  }

  // Also check local SQLite just in case
  const dbPath = path.join(__dirname, '..', 'mmsgallery.sqlite');
  const db = new DatabaseSync(dbPath);
  const sqliteOrphans = db.prepare(`
    SELECT id FROM artworks 
    WHERE user_id NOT IN (SELECT id FROM users)
  `).all();
  
  console.log('--- local SQLite ---');
  console.log(`Found ${sqliteOrphans.length} orphaned artworks in SQLite.`);
  
  if (sqliteOrphans.length > 0) {
    db.exec(`
      DELETE FROM artworks 
      WHERE user_id NOT IN (SELECT id FROM users)
    `);
    console.log('✅ Deleted orphaned artworks from SQLite.');
  }

  console.log('Done.');
  process.exit(0);
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
