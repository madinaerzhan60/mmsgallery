const db = require('./database');

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

function buildBaseUsername(user) {
  const emailLeft = String(user.email || '').split('@')[0] || '';
  const emailBase = normalizeUsername(emailLeft);
  if (emailBase.length >= 3) return emailBase.slice(0, 20);

  const idHex = Number(user.id || 0).toString(16).padStart(6, '0');
  return `user_${idHex}`;
}

function generateUniqueUsername(user) {
  const base = buildBaseUsername(user);
  let candidate = base;
  let i = 1;

  while (!candidate || candidate.length < 3 || usernameExists(candidate)) {
    candidate = `${base}_${i}`;
    i += 1;
  }

  return candidate.slice(0, 24);
}

function runBackfill() {
  const users = db.prepare(`
    SELECT id, email, username
    FROM users
    WHERE username IS NULL OR trim(username) = ''
    ORDER BY id ASC
  `).all();

  if (!users.length) {
    console.log('No users require username backfill.');
    return;
  }

  const updateStmt = db.prepare(`
    UPDATE users
    SET username = ?,
        handle = COALESCE(NULLIF(handle, ''), ?),
        last_username_change = COALESCE(last_username_change, CURRENT_TIMESTAMP)
    WHERE id = ?
  `);

  let updated = 0;
  for (const user of users) {
    const username = generateUniqueUsername(user);
    updateStmt.run(username, username, user.id);
    updated += 1;
    console.log(`Updated user #${user.id}: ${username}`);
  }

  console.log(`Backfill completed. Updated ${updated} user(s).`);
}

runBackfill();
