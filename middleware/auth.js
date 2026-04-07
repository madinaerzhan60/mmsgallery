const jwt = require('jsonwebtoken');
const db = require('../database');
const JWT_SECRET = process.env.JWT_SECRET || 'lumina_secret_2025_change_in_production';

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    // UUID is the stable identity across data migrations; IDs may drift.
    const user = db.prepare('SELECT id, uuid, role, name, email_verified FROM users WHERE uuid=?').get(payload.uuid)
      || db.prepare('SELECT id, uuid, role, name, email_verified FROM users WHERE id=?').get(payload.id);
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
