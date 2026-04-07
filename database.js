const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const bundledDbPath = path.join(__dirname, 'mmsgallery.sqlite');
const explicitDbPath = process.env.SQLITE_PATH || process.env.DB_PATH;
const isVercel = Boolean(process.env.VERCEL);
const dbPath = explicitDbPath || (isVercel ? '/tmp/mmsgallery.sqlite' : bundledDbPath);

if (dbPath !== bundledDbPath && !fs.existsSync(dbPath)) {
  try {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    if (fs.existsSync(bundledDbPath)) {
      fs.copyFileSync(bundledDbPath, dbPath);
    }
  } catch (error) {
    console.warn('[database] Failed to prepare writable DB path:', error.message);
  }
}

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');

function hasTable(name) {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
  return !!row;
}

function hasColumn(tableName, columnName) {
  const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return cols.some((col) => col.name === columnName);
}

function ensureColumn(tableName, columnName, definition) {
  if (!hasColumn(tableName, columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function hasIndex(indexName) {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name=?").get(indexName);
  return !!row;
}

function ensureIndex(indexName, sql) {
  if (!hasIndex(indexName)) {
    db.exec(sql);
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid              TEXT UNIQUE NOT NULL,
    name              TEXT NOT NULL,
    email             TEXT UNIQUE NOT NULL,
    password          TEXT NOT NULL,
    role              TEXT NOT NULL DEFAULT 'student',
    major             TEXT,
    year              TEXT,
    bio               TEXT,
    avatar_url        TEXT,
    profession        TEXT,
    handle            TEXT,
    username          TEXT,
    last_username_change DATETIME,
    email_verified    INTEGER NOT NULL DEFAULT 1,
    email_verified_at DATETIME,
    linkedin_url      TEXT,
    portfolio_url     TEXT,
    cover_url         TEXT,
    cover_gradient    TEXT NOT NULL DEFAULT 'preset_1',
    is_open_to_work   INTEGER NOT NULL DEFAULT 0,
    notify_followers  INTEGER NOT NULL DEFAULT 1,
    notify_likes      INTEGER NOT NULL DEFAULT 1,
    notify_comments   INTEGER NOT NULL DEFAULT 1,
    notify_approval   INTEGER NOT NULL DEFAULT 1,
    notify_rejection  INTEGER NOT NULL DEFAULT 1,
    notify_announcements INTEGER NOT NULL DEFAULT 1,
    privacy_show_email INTEGER NOT NULL DEFAULT 0,
    privacy_show_open_to_work INTEGER NOT NULL DEFAULT 1,
    privacy_allow_followers INTEGER NOT NULL DEFAULT 1,
    privacy_show_follower_count INTEGER NOT NULL DEFAULT 1,
    language_pref     TEXT NOT NULL DEFAULT 'en',
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS artworks (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid              TEXT UNIQUE NOT NULL,
    title             TEXT NOT NULL,
    description       TEXT,
    category          TEXT NOT NULL,
    tags              TEXT,
    image_url         TEXT,
    file_url          TEXT,
    thumbnail_url     TEXT,
    file_type         TEXT NOT NULL DEFAULT 'image',
    duration_seconds  INTEGER,
    status            TEXT NOT NULL DEFAULT 'pending',
    featured          INTEGER NOT NULL DEFAULT 0,
    views             INTEGER NOT NULL DEFAULT 0,
    likes_count       INTEGER NOT NULL DEFAULT 0,
    user_id           INTEGER NOT NULL,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS likes (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL,
    artwork_id        INTEGER NOT NULL,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, artwork_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    content           TEXT NOT NULL,
    user_id           INTEGER NOT NULL,
    artwork_id        INTEGER NOT NULL,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS follows (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id       INTEGER NOT NULL,
    following_id      INTEGER NOT NULL,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL,
    type              TEXT NOT NULL,
    from_user_id      INTEGER,
    artwork_id        INTEGER,
    is_read           INTEGER NOT NULL DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    name              TEXT NOT NULL,
    email             TEXT NOT NULL,
    subject           TEXT NOT NULL,
    message           TEXT NOT NULL,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profile_views (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    viewed_user_id    INTEGER NOT NULL,
    viewer_user_id    INTEGER,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (viewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (viewer_user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL,
    token             TEXT UNIQUE NOT NULL,
    expires_at        DATETIME NOT NULL,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at           DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Backward-compatible migrations for existing DBs.
ensureColumn('users', 'profession', 'TEXT');
ensureColumn('users', 'handle', 'TEXT');
ensureColumn('users', 'username', 'TEXT');
ensureColumn('users', 'last_username_change', 'DATETIME');
ensureColumn('users', 'email_verified', 'INTEGER NOT NULL DEFAULT 1');
ensureColumn('users', 'email_verified_at', 'DATETIME');
ensureColumn('users', 'linkedin_url', 'TEXT');
ensureColumn('users', 'portfolio_url', 'TEXT');
ensureColumn('users', 'cover_url', 'TEXT');
ensureColumn('users', 'cover_gradient', "TEXT NOT NULL DEFAULT 'preset_1'");
ensureColumn('users', 'is_open_to_work', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'notify_followers', 'INTEGER NOT NULL DEFAULT 1');
ensureColumn('users', 'notify_likes', 'INTEGER NOT NULL DEFAULT 1');
ensureColumn('users', 'notify_comments', 'INTEGER NOT NULL DEFAULT 1');
ensureColumn('users', 'notify_approval', 'INTEGER NOT NULL DEFAULT 1');
ensureColumn('users', 'notify_rejection', 'INTEGER NOT NULL DEFAULT 1');
ensureColumn('users', 'notify_announcements', 'INTEGER NOT NULL DEFAULT 1');
ensureColumn('users', 'privacy_show_email', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'privacy_show_open_to_work', 'INTEGER NOT NULL DEFAULT 1');
ensureColumn('users', 'privacy_allow_followers', 'INTEGER NOT NULL DEFAULT 1');
ensureColumn('users', 'privacy_show_follower_count', 'INTEGER NOT NULL DEFAULT 1');
ensureColumn('users', 'language_pref', "TEXT NOT NULL DEFAULT 'en'");

ensureColumn('artworks', 'thumbnail_url', 'TEXT');
ensureColumn('artworks', 'file_type', "TEXT NOT NULL DEFAULT 'image'");
ensureColumn('artworks', 'duration_seconds', 'INTEGER');
ensureColumn('artworks', 'likes_count', 'INTEGER NOT NULL DEFAULT 0');

ensureIndex(
  'idx_users_username_unique',
  "CREATE UNIQUE INDEX idx_users_username_unique ON users(username) WHERE username IS NOT NULL AND username <> ''"
);

function normalizeUsername(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function usernameExists(username) {
  const row = db.prepare('SELECT id FROM users WHERE lower(username)=lower(?) LIMIT 1').get(username);
  return !!row;
}

function backfillMissingUsernames() {
  const users = db.prepare(`
    SELECT id, email, username, handle
    FROM users
    WHERE username IS NULL OR trim(username) = ''
  `).all();

  if (!users.length) return;

  const updateStmt = db.prepare(`
    UPDATE users
    SET username=?,
        handle=COALESCE(NULLIF(handle, ''), ?),
        last_username_change=COALESCE(last_username_change, CURRENT_TIMESTAMP)
    WHERE id=?
  `);

  for (const user of users) {
    const emailBase = normalizeUsername(String(user.email || '').split('@')[0]);
    const base = emailBase && emailBase.length >= 3 ? emailBase.slice(0, 20) : `user_${Number(user.id || 0).toString(16).padStart(6, '0')}`;
    let candidate = base;
    let n = 1;
    while (!candidate || candidate.length < 3 || usernameExists(candidate)) {
      candidate = `${base}_${n}`;
      n += 1;
    }
    updateStmt.run(candidate.slice(0, 24), candidate.slice(0, 24), user.id);
  }
}

backfillMissingUsernames();

if (!hasTable('follows')) {
  db.exec(`
    CREATE TABLE follows (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id       INTEGER NOT NULL,
      following_id      INTEGER NOT NULL,
      created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

if (!hasTable('notifications')) {
  db.exec(`
    CREATE TABLE notifications (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id           INTEGER NOT NULL,
      type              TEXT NOT NULL,
      from_user_id      INTEGER,
      artwork_id        INTEGER,
      is_read           INTEGER NOT NULL DEFAULT 0,
      created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE SET NULL
    );
  `);
}

if (!hasTable('feedback')) {
  db.exec(`
    CREATE TABLE feedback (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      name              TEXT NOT NULL,
      email             TEXT NOT NULL,
      subject           TEXT NOT NULL,
      message           TEXT NOT NULL,
      created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

if (!hasTable('profile_views')) {
  db.exec(`
    CREATE TABLE profile_views (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      viewed_user_id    INTEGER NOT NULL,
      viewer_user_id    INTEGER,
      created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (viewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (viewer_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);
}

const adminExists = db.prepare('SELECT id FROM users WHERE role=?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (uuid, name, email, password, role, major, year, bio, profession, language_pref)
    VALUES (?, ?, ?, ?, 'admin', ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    'Admin',
    'admin@mmsgallery.edu',
    hash,
    'Administration',
    '',
    'Gallery administrator',
    'Administrator',
    'en'
  );
  console.log('Default admin created: admin@mmsgallery.edu / admin123');
}

module.exports = db;
