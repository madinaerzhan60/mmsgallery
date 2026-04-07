const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const db = require('../database');
const JWT_SECRET = process.env.JWT_SECRET || 'lumina_secret_2025_change_in_production';
const supabaseDbUrl = (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '').trim();
const usePg = Boolean(supabaseDbUrl);
const pgPool = usePg
  ? new Pool({
      connectionString: supabaseDbUrl,
      ssl: { rejectUnauthorized: false }
    })
  : null;

function backfillLocalUser(pgUser) {
  if (!pgUser) return null;
  const existing = db.prepare('SELECT id, uuid, role, name, email_verified FROM users WHERE uuid=? LIMIT 1').get(pgUser.uuid);
  if (existing) return existing;

  db.prepare(`
    INSERT INTO users (uuid, name, email, password, role, major, profession, year, bio, avatar_url, handle, username, last_username_change, email_verified, email_verified_at, linkedin_url, portfolio_url, cover_url, cover_gradient, is_open_to_work, notify_followers, notify_likes, notify_comments, notify_approval, notify_rejection, notify_announcements, privacy_show_email, privacy_show_open_to_work, privacy_allow_followers, privacy_show_follower_count, language_pref)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    pgUser.uuid,
    pgUser.name,
    pgUser.email,
    pgUser.password,
    pgUser.role || 'student',
    pgUser.major || pgUser.profession || '',
    pgUser.profession || pgUser.major || 'Other',
    pgUser.year || '',
    pgUser.bio || '',
    pgUser.avatar_url || null,
    pgUser.handle || pgUser.username || null,
    pgUser.username || pgUser.handle || null,
    pgUser.last_username_change || null,
    Number(!!pgUser.email_verified),
    pgUser.email_verified_at || null,
    pgUser.linkedin_url || null,
    pgUser.portfolio_url || null,
    pgUser.cover_url || null,
    pgUser.cover_gradient || 'preset_1',
    Number(!!pgUser.is_open_to_work),
    Number(!!pgUser.notify_followers),
    Number(!!pgUser.notify_likes),
    Number(!!pgUser.notify_comments),
    Number(!!pgUser.notify_approval),
    Number(!!pgUser.notify_rejection),
    Number(!!pgUser.notify_announcements),
    Number(!!pgUser.privacy_show_email),
    Number(!!pgUser.privacy_show_open_to_work),
    Number(!!pgUser.privacy_allow_followers),
    Number(!!pgUser.privacy_show_follower_count),
    pgUser.language_pref || 'en'
  );

  return db.prepare('SELECT id, uuid, role, name, email_verified FROM users WHERE uuid=? LIMIT 1').get(pgUser.uuid);
}

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    // UUID is the stable identity across data migrations; IDs may drift.
    let user = db.prepare('SELECT id, uuid, role, name, email_verified FROM users WHERE uuid=?').get(payload.uuid)
      || db.prepare('SELECT id, uuid, role, name, email_verified FROM users WHERE id=?').get(payload.id);

    if (!user && usePg && pgPool) {
      try {
        const pgUser = (await pgPool.query('SELECT * FROM users WHERE uuid=$1 LIMIT 1', [payload.uuid])).rows[0]
          || (await pgPool.query('SELECT * FROM users WHERE id=$1 LIMIT 1', [payload.id])).rows[0];
        if (pgUser) {
          user = backfillLocalUser(pgUser);
        }
      } catch {
        // Continue with local auth failure handling.
      }
    }

    if (!user || user.uuid !== payload.uuid) {
      return res.status(401).json({ error: 'Session expired. Please log in again' });
    }
    if (user.role !== 'admin' && !Number(user.email_verified)) {
      return res.status(403).json({ error: 'Please verify your email before using this feature' });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Admin access required' });
    next();
  });
}

module.exports = { auth, adminOnly, JWT_SECRET };
