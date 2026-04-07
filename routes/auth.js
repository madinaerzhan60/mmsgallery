const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { auth, JWT_SECRET } = require('../middleware/auth');

const supabaseDbUrl = (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '').trim();
const usePg = Boolean(supabaseDbUrl);
const pgPool = usePg
  ? new Pool({
      connectionString: supabaseDbUrl,
      ssl: { rejectUnauthorized: false }
    })
  : null;

const isVercel = Boolean(process.env.VERCEL);
const avatarDir = path.join(__dirname, '../public/uploads/avatars');
if (!isVercel) {
  try {
    if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
  } catch (error) {
    console.warn('[avatar-upload] Failed to prepare avatar directory:', error.message);
  }
}

const avatarStorage = isVercel
  ? multer.memoryStorage()
  : multer.diskStorage({
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
const PASSWORD_RESET_TTL_HOURS = 1;

const SMTP_HOST = String(process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'true').trim().toLowerCase() !== 'false';
const SMTP_USER = String(process.env.SMTP_USER || '').trim();
const SMTP_PASS = String(process.env.SMTP_PASS || '').trim();
const SMTP_FROM = String(process.env.SMTP_FROM || SMTP_USER || '').trim();
const EMAIL_ENABLED = Boolean(SMTP_USER && SMTP_PASS && SMTP_FROM);
const emailVerificationEnv = String(process.env.EMAIL_VERIFICATION_REQUIRED || '').trim().toLowerCase();
const EMAIL_VERIFICATION_REQUIRED = emailVerificationEnv === 'true' || (emailVerificationEnv === '' && EMAIL_ENABLED);
let mailTransporter = null;

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

function issuePasswordResetToken(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('DELETE FROM password_reset_tokens WHERE user_id=? AND used_at IS NULL').run(userId);
  db.prepare(`
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (?, ?, datetime('now', ?))
  `).run(userId, token, `+${PASSWORD_RESET_TTL_HOURS} hour`);
  return token;
}

function buildVerificationLink(token) {
  const base = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

function buildResetPasswordLink(token) {
  const base = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${base}/auth?mode=reset&token=${encodeURIComponent(token)}`;
}

function getMailer() {
  if (!EMAIL_ENABLED) return null;
  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
  }
  return mailTransporter;
}

async function deliverMail({ to, subject, text, html }) {
  const transporter = getMailer();
  if (!transporter) return false;
  await transporter.sendMail({ from: SMTP_FROM, to, subject, text, html });
  return true;
}

async function sendVerificationEmail(email, name, token) {
  const link = buildVerificationLink(token);
  const sent = await deliverMail({
    to: email,
    subject: 'Confirm your MMS Gallery account',
    text: `Hi ${name || 'there'},\n\nConfirm your account: ${link}\n\nThis link expires in ${EMAIL_VERIFY_TTL_HOURS} hours.`,
    html: `<p>Hi ${name || 'there'},</p><p>Confirm your account:</p><p><a href="${link}">${link}</a></p><p>This link expires in ${EMAIL_VERIFY_TTL_HOURS} hours.</p>`
  }).catch(() => false);
  if (sent) return true;
  console.log(`[email-verification] To: ${email} (${name || 'User'})`);
  console.log(`[email-verification] Verify link: ${link}`);
  return false;
}

async function sendPasswordResetEmail(email, name, token) {
  const link = buildResetPasswordLink(token);
  const sent = await deliverMail({
    to: email,
    subject: 'Reset your MMS Gallery password',
    text: `Hi ${name || 'there'},\n\nReset your password: ${link}\n\nThis link expires in ${PASSWORD_RESET_TTL_HOURS} hour(s).`,
    html: `<p>Hi ${name || 'there'},</p><p>Reset your password:</p><p><a href="${link}">${link}</a></p><p>This link expires in ${PASSWORD_RESET_TTL_HOURS} hour(s).</p>`
  }).catch(() => false);
  if (sent) return true;
  console.log(`[password-reset] To: ${email} (${name || 'User'})`);
  console.log(`[password-reset] Reset link: ${link}`);
  return false;
}

async function syncUserToPg(user) {
  if (!usePg || !pgPool || !user) return;
  const exists = await pgPool.query('SELECT id FROM users WHERE uuid=$1 LIMIT 1', [user.uuid]);
  if (exists.rows[0]) return;
  await pgPool.query(
    `INSERT INTO users (uuid, name, email, password, role, major, profession, year, bio, language_pref, username, handle, last_username_change, email_verified, email_verified_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     ON CONFLICT (email) DO NOTHING`,
    [
      user.uuid,
      user.name,
      user.email,
      user.password,
      user.role || 'student',
      user.major || user.profession || '',
      user.profession || user.major || 'Other',
      user.year || '',
      user.bio || '',
      user.language_pref || 'en',
      user.username || null,
      user.handle || user.username || null,
      user.last_username_change || null,
      Number(!!user.email_verified),
      user.email_verified_at || null
    ]
  );
}

function createLocalUserFromPg(pgUser) {
  if (!pgUser) return null;
  const exists = db.prepare('SELECT * FROM users WHERE uuid=? LIMIT 1').get(pgUser.uuid);
  if (exists) return exists;
  db.prepare(`
    INSERT INTO users (uuid, name, email, password, role, major, profession, year, bio, language_pref, username, handle, last_username_change, email_verified, email_verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
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
    pgUser.language_pref || 'en',
    pgUser.username || normalizeUsername(pgUser.email?.split('@')[0] || `user_${Date.now()}`),
    pgUser.handle || pgUser.username || normalizeUsername(pgUser.email?.split('@')[0] || `user_${Date.now()}`),
    Number(pgUser.email_verified != null ? pgUser.email_verified : 1),
    pgUser.email_verified_at || null
  );
  return db.prepare('SELECT * FROM users WHERE uuid=? LIMIT 1').get(pgUser.uuid);
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
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

    if (!EMAIL_VERIFICATION_REQUIRED) {
      db.prepare('UPDATE users SET email_verified=1, email_verified_at=CURRENT_TIMESTAMP WHERE uuid=?').run(uuid);
      const created = db.prepare('SELECT * FROM users WHERE uuid = ?').get(uuid);
      await syncUserToPg(created).catch(() => {});
      return res.status(201).json({
        ok: true,
        requiresEmailVerification: false,
        message: 'Registration successful. You can log in now.'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(uuid);
    const verificationToken = issueEmailVerificationToken(user.id);
    await sendVerificationEmail(user.email, user.name, verificationToken);
    await syncUserToPg(user).catch(() => {});

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
router.post('/login', async (req, res) => {
  const { login, email, username, password } = req.body;
  const identifier = String(login || email || username || '').trim();
  if (!identifier || !password)
    return res.status(400).json({ error: 'Email/username and password are required' });

  const normalized = normalizeUsername(identifier);
  let user = db.prepare(`
    SELECT * FROM users
    WHERE lower(email) = lower(?) OR lower(username) = lower(?)
    LIMIT 1
  `).get(identifier, normalized);

  if (!user && usePg) {
    try {
      const fromPg = await pgPool.query(
        `SELECT *
         FROM users
         WHERE lower(email)=lower($1) OR lower(username)=lower($2)
         LIMIT 1`,
        [identifier, normalized]
      );
      if (fromPg.rows[0]) {
        user = createLocalUserFromPg(fromPg.rows[0]);
      }
    } catch {
      // Continue with local auth only when PG is unavailable.
    }
  }

  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });

  if (EMAIL_VERIFICATION_REQUIRED && !Number(user.email_verified)) {
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
  if (!EMAIL_VERIFICATION_REQUIRED) {
    return res.status(400).json({ error: 'Email verification is disabled for this environment' });
  }

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
  sendVerificationEmail(user.email, user.name, token)
    .then(() => res.json({ ok: true, message: 'Verification email sent' }))
    .catch((error) => res.status(500).json({ error: error.message || 'Failed to send verification email' }));
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const identifier = String(req.body.email || req.body.login || '').trim();
  if (!identifier) return res.status(400).json({ error: 'Email is required' });

  const normalized = normalizeUsername(identifier);
  const user = db.prepare(`
    SELECT id, email, name
    FROM users
    WHERE lower(email)=lower(?) OR lower(username)=lower(?)
    LIMIT 1
  `).get(identifier, normalized);

  if (!user) {
    return res.json({ ok: true, message: 'If this account exists, a reset email was sent.' });
  }

  const token = issuePasswordResetToken(user.id);
  await sendPasswordResetEmail(user.email, user.name, token);
  return res.json({ ok: true, message: 'If this account exists, a reset email was sent.' });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const token = String(req.body.token || '').trim();
  const newPassword = String(req.body.newPassword || '');
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const row = db.prepare(`
    SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at
    FROM password_reset_tokens prt
    WHERE prt.token = ?
    LIMIT 1
  `).get(token);

  if (!row) return res.status(400).json({ error: 'Invalid reset token' });
  if (row.used_at) return res.status(400).json({ error: 'This reset link was already used' });

  const expiry = new Date(row.expires_at).getTime();
  if (Number.isFinite(expiry) && expiry < Date.now()) {
    return res.status(400).json({ error: 'Reset link expired. Request a new one.' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password=? WHERE id=?').run(hash, row.user_id);
  db.prepare('UPDATE password_reset_tokens SET used_at=CURRENT_TIMESTAMP WHERE id=?').run(row.id);
  return res.json({ ok: true, message: 'Password updated successfully' });
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

  if (isVercel) {
    return res.status(501).json({
      error: 'Avatar upload to local filesystem is disabled on Vercel. Use Supabase Storage for uploads.'
    });
  }

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
