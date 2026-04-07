const jwt = require('jsonwebtoken');
const { pgPool, usePg } = require('../pg');
const JWT_SECRET = process.env.JWT_SECRET || 'lumina_secret_2025_change_in_production';

async function getPgUserByPayload(payload) {
  if (!usePg || !pgPool) return null;

  const queries = [];
  if (payload.uuid) queries.push(['SELECT * FROM users WHERE uuid=$1 LIMIT 1', [payload.uuid]]);
  if (payload.id != null) queries.push(['SELECT * FROM users WHERE id=$1 LIMIT 1', [payload.id]]);
  if (payload.username) {
    queries.push(['SELECT * FROM users WHERE lower(username)=lower($1) LIMIT 1', [payload.username]]);
    queries.push(['SELECT * FROM users WHERE lower(handle)=lower($1) LIMIT 1', [payload.username]]);
  }
  if (payload.handle) queries.push(['SELECT * FROM users WHERE lower(handle)=lower($1) LIMIT 1', [payload.handle]]);

  for (const [query, values] of queries) {
    try {
      const result = await pgPool.query(query, values);
      if (result.rows[0]) return result.rows[0];
    } catch {
      // Try the next identity hint.
    }
  }

  return null;
}

function matchesTokenIdentity(user, payload) {
  if (!user) return false;
  if (payload.uuid) return user.uuid === payload.uuid;
  if (payload.username) {
    const username = normalizeIdentity(payload.username);
    return normalizeIdentity(user.username) === username || normalizeIdentity(user.handle) === username;
  }
  if (payload.handle) {
    const handle = normalizeIdentity(payload.handle);
    return normalizeIdentity(user.handle) === handle || normalizeIdentity(user.username) === handle;
  }
  if (payload.id != null) return Number(user.id) === Number(payload.id);
  return true;
}

function normalizeIdentity(value = '') {
  return String(value).trim().toLowerCase();
}

async function auth(req, res, next) {
  if (!usePg || !pgPool) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' });
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const user = await getPgUserByPayload(payload);

    if (!matchesTokenIdentity(user, payload)) {
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
