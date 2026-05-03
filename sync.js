const { Pool } = require('pg');
const db = require('./database.js');
require('dotenv').config();

const databaseUrl = String(process.env.DATABASE_URL || '').trim();
if (!databaseUrl) {
    console.error('❌ No DATABASE_URL found in environment.');
    process.exit(1);
}

const pgPool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    console.log('🔄 Starting database synchronization...');

    try {
        // 1. Sync Users
        console.log('👥 Syncing users...');
        const pgUsersResult = await pgPool.query('SELECT uuid FROM users');
        const pgUserUuids = new Set(pgUsersResult.rows.map(r => r.uuid));
        
        const sqliteUsers = db.prepare('SELECT id, uuid, role, email FROM users').all();
        let usersDeleted = 0;

        for (const user of sqliteUsers) {
            // Keep the admin user even if not in PG (standard local admin)
            if (user.role === 'admin' || user.email === 'admin@mmsgallery.edu') continue;

            if (!pgUserUuids.has(user.uuid)) {
                console.log(`🗑️ User ${user.uuid} (${user.email}) missing in PG. Deleting from SQLite...`);
                // This will also delete their artworks due to ON DELETE CASCADE
                db.prepare('DELETE FROM users WHERE uuid = ?').run(user.uuid);
                usersDeleted++;
            }
        }
        console.log(`✅ Deleted ${usersDeleted} orphaned users from SQLite.`);

        // 2. Sync Artworks (for artworks that might have been deleted but their users remain)
        console.log('🖼️ Syncing artworks...');
        const pgArtworksResult = await pgPool.query('SELECT uuid FROM artworks');
        const pgArtworkUuids = new Set(pgArtworksResult.rows.map(r => r.uuid));

        const sqliteArtworks = db.prepare('SELECT id, uuid, title FROM artworks').all();
        let artworksDeleted = 0;

        for (const art of sqliteArtworks) {
            if (!pgArtworkUuids.has(art.uuid)) {
                console.log(`🗑️ Artwork ${art.uuid} ("${art.title}") missing in PG. Deleting from SQLite...`);
                db.prepare('DELETE FROM artworks WHERE uuid = ?').run(art.uuid);
                artworksDeleted++;
            }
        }
        console.log(`✅ Deleted ${artworksDeleted} orphaned artworks from SQLite.`);

        console.log('\n✨ Synchronization complete.');
    } catch (error) {
        console.error('❌ Synchronization failed:', error.message);
    } finally {
        await pgPool.end();
        process.exit(0);
    }
}

run();
