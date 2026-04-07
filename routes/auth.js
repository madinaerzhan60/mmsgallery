const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { auth, JWT_SECRET } = require('../middleware/auth');

const avatarDir = path.join(__dirname, '../public/uploads/avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${uuidv4()}${ext}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype))
});

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
const EMAIL_VERIFY_TTL_HOURS = 24;

function normalizeUsername(input = '') {
  return String(input).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

function isValidUsername(input = '') {
  return USERNAME_RE.test(String(input));
}

function issueEmailVerificationToken(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('DELETE FROM email_verification_tokens WHERE user_id=? AND used_at IS NULL').run(userId);
  db.prepare(`
    INSERT INTO email_verification_tokens (user_id, token, expires_at)
    VALUES (?, ?, datetime('now', ?))
  `).run(userId, token, `+${EMAIL_VERIFY_TTL_HOURS} hour`);
  return token;
}

function buildVerificationLink(token) {
  const base = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

function sendVerificationEmail(email, name, token) {
  const link = buildVerificationLink(token);
  console.log(`[email-verification] To: ${email} (${name || 'User'})`);
  console.log(`[email-verification] Verify link: ${link}`);
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, username, major, profession, year, bio, language_pref } = req.body;
  if (!name || !email || !password || !username)
    return res.status(400).json({ error: 'Name, username, email and password are required' });

  const cleanUsername = normalizeUsername(username);
  if (!isValidUsername(cleanUsername)) {
    return res.status(400).json({ error: 'Username must be 3-24 chars and use only letters, numbers, and underscores' });
  }

  const exists = db.prepare('SELECT id FROM users WHERE lower(email) = lower(?)').get(email);
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const usernameExists = db.prepare('SELECT id FROM users WHERE lower(username)=lower(?)').get(cleanUsername);
  if (usernameExists) return res.status(409).json({ error: 'Username is already taken' });

  const hash = bcrypt.hashSync(password, 10);
  const uuid = uuidv4();
  try {
    db.prepare(`
      INSERT INTO users (uuid, name, email, password, role, major, profession, year, bio, language_pref, username, handle, last_username_change, email_verified)
      VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0)
    `).run(
      uuid,
      name,
      email,
      hash,
      major || profession || '',
      profession || major || 'Other',
      year || '',
      bio || '',
      language_pref || 'en',
      cleanUsername,
      cleanUsername
    );

    const user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(uuid);
    const verificationToken = issueEmailVerificationToken(user.id);
    sendVerificationEmail(user.email, user.name, verificationToken);

    res.status(201).json({
      ok: true,
      requiresEmailVerification: true,
      message: 'Registration successful. Please verify your email before logging in.'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { login, email, username, password } = req.body;
  const identifier = String(login || email || username || '').trim();
  if (!identifier || !password)
    return res.status(400).json({ error: 'Email/username and password are required' });

  const normalized = normalizeUsername(identifier);
  const user = db.prepare(`
    SELECT * FROM users
    WHERE lower(email) = lower(?) OR lower(username) = lower(?)
    LIMIT 1
  `).get(identifier, normalized);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });

  if (!Number(user.email_verified)) {
    return res.status(403).json({
      error: 'Please verify your email before logging in',
      requiresEmailVerification: true
    });
  }

  const token = jwt.sign({ id: user.id, uuid: user.uuid, role: user.role, name: user.name, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: safeUser(user) });
});

// GET /api/auth/verify-email?token=...
router.get('/verify-email', (req, res) => {
  const token = String(req.query.token || '').trim();
  if (!token) return res.status(400).send('Missing verification token');

  const row = db.prepare(`
    SELECT evt.id, evt.user_id, evt.expires_at, evt.used_at, u.email_verified
    FROM email_verification_tokens evt
    JOIN users u ON u.id = evt.user_id
    WHERE evt.token = ?
    LIMIT 1
  `).get(token);

  if (!row) return res.status(400).send('Invalid verification token');
  if (row.used_at) return res.status(400).send('This verification link was already used');
  if (Number(row.email_verified)) return res.status(200).send('Email already verified. You can log in now.');

  const expiry = new Date(row.expires_at).getTime();
  if (Number.isFinite(expiry) && expiry < Date.now()) {
    return res.status(400).send('Verification link expired. Request a new one.');
  }

  db.prepare('UPDATE users SET email_verified=1, email_verified_at=CURRENT_TIMESTAMP WHERE id=?').run(row.user_id);
  db.prepare('UPDATE email_verification_tokens SET used_at=CURRENT_TIMESTAMP WHERE id=?').run(row.id);
  return res.redirect('/auth?verified=1');
});

// POST /api/auth/resend-verification
router.post('/resend-verification', (req, res) => {
  const identifier = String(req.body.email || req.body.login || '').trim();
  if (!identifier) return res.status(400).json({ error: 'Email is required' });

  const normalized = normalizeUsername(identifier);
  const user = db.prepare(`
    SELECT id, email, name, email_verified
    FROM users
    WHERE lower(email)=lower(?) OR lower(username)=lower(?)
    LIMIT 1
  `).get(identifier, normalized);

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (Number(user.email_verified)) {
    return res.status(400).json({ error: 'Email is already verified' });
  }

  const token = issueEmailVerificationToken(user.id);
  sendVerificationEmail(user.email, user.name, token);
  return res.json({ ok: true, message: 'Verification email sent' });
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(safeUser(user));
});

// PUT /api/auth/profile
router.put('/profile', auth, (req, res) => {
  const { name, major, profession, year, bio } = req.body;
  db.prepare('UPDATE users SET name=?, major=?, profession=?, year=?, bio=? WHERE id=?')
    .run(name, major || profession, profession || major, year, bio, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  res.json({ user: safeUser(user) });
});

// PATCH /api/auth/profile (compatibility for dashboard page)
router.patch('/profile', auth, (req, res) => {
  const { name, major, profession, year, bio } = req.body;
  db.prepare('UPDATE users SET name=?, major=?, profession=?, year=?, bio=? WHERE id=?')
    .run(name, major || profession, profession || major, year, bio, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  res.json({ user: safeUser(user) });
});

// PATCH /api/auth/settings
router.patch('/settings', auth, (req, res) => {
  const {
    name,
    year,
    profession,
    bio,
    linkedin_url,
    portfolio_url,
    is_open_to_work,
    language_pref
  } = req.body;

  db.prepare(`
    UPDATE users
    SET name=?, major=?, profession=?, year=?, bio=?, linkedin_url=?, portfolio_url=?,
        is_open_to_work=?, language_pref=?
    WHERE id=?
  `).run(
    name,
    profession,
    profession,
    year,
    bio,
    linkedin_url || null,
    portfolio_url || null,
    Number(!!is_open_to_work),
    language_pref || 'en',
    req.user.id
  );

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  res.json({ user: safeUser(user) });
});

// POST /api/auth/password
router.post('/password', auth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  const nextHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password=? WHERE id=?').run(nextHash, req.user.id);
  res.json({ ok: true });
});

// POST /api/auth/avatar
router.post('/avatar', auth, avatarUpload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Avatar file is required' });
  const avatarPath = `/uploads/avatars/${req.file.filename}`;
  db.prepare('UPDATE users SET avatar_url=? WHERE id=?').run(avatarPath, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  res.json({ user: safeUser(user) });
});

function safeUser(u) {
  const { password, ...safe } = u;
  return safe;
}

module.exports = router;
