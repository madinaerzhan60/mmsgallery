const { Pool } = require('pg');
const db = require('./database.js');
require('dotenv').config();

const databaseUrl = String(process.env.DATABASE_URL || '').trim();
if (!databaseUrl) {
    console.log('No DATABASE_URL');
    process.exit(1);
}

const pgPool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    // Get all artworks from SQLite
    const sqliteArtworks = db.prepare('SELECT id, uuid FROM artworks').all();
    let deletedCount = 0;
    
    for (const art of sqliteArtworks) {
        // Check if exists in PG
        const pgArt = await pgPool.query('SELECT uuid FROM artworks WHERE uuid = $1', [art.uuid]);
        if (pgArt.rows.length === 0) {
            console.log(`Artwork ${art.uuid} missing in PG. Deleting from SQLite.`);
            db.prepare('DELETE FROM artworks WHERE uuid = ?').run(art.uuid);
            deletedCount++;
        }
    }
    
    console.log(`Deleted ${deletedCount} orphaned artworks from SQLite.`);
    process.exit(0);
}

run();
