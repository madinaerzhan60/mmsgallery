const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const db = require('../database');
const { auth } = require('../middleware/auth');

const supabaseDbUrl = String(process.env.DATABASE_URL || '').trim();
const usePg = Boolean(supabaseDbUrl);
const pgPool = usePg
  ? new Pool({
      connectionString: supabaseDbUrl,
      ssl: { rejectUnauthorized: false }
    })
  : null;

const isVercel = Boolean(process.env.VERCEL);
const avatarDir = path.join(__dirname, '../public/uploads/avatars');
const coverDir = path.join(__dirname, '../public/uploads/covers');
if (!isVercel) {
  try {
    if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
    if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir, { recursive: true });
  } catch (error) {
    console.warn('[user-upload] Failed to prepare upload directories:', error.message);
  }
}

function imageFileFilter(req, file, cb) {
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.mimetype)) {
    cb(new Error('Only jpg, png, and webp are allowed'));
    return;
  }
  cb(null, true);
}

const avatarUpload = multer({
  storage: isVercel
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => cb(null, avatarDir),
        filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname) || '.png'}`)
      }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

const coverUpload = multer({
  storage: isVercel
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => cb(null, coverDir),
        filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname) || '.jpg'}`)
      }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

function safeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

function mergeUserRows(primary, fallback) {
  if (!primary && !fallback) return null;
  return {
    ...(fallback || {}),
    ...(primary || {}),
    username: primary?.username || fallback?.username || primary?.handle || fallback?.handle || '',
    handle: primary?.handle || fallback?.handle || primary?.username || fallback?.username || '',
    major: primary?.major || fallback?.major || primary?.profession || fallback?.profession || '',
    profession: primary?.profession || fallback?.profession || primary?.major || fallback?.major || ''
  };
}

async function syncUserToPg(user) {
  if (!usePg || !pgPool || !user) return;
  const exists = await pgPool.query('SELECT id FROM users WHERE uuid=$1 LIMIT 1', [user.uuid]);
  if (exists.rows[0]) {
    await pgPool.query(
      `UPDATE users
       SET name=$1, email=$2, password=$3, role=$4, major=$5, profession=$6, year=$7, bio=$8,
           avatar_url=$9, handle=$10, username=$11, last_username_change=$12, email_verified=$13,
           email_verified_at=$14, linkedin_url=$15, portfolio_url=$16, cover_url=$17, cover_gradient=$18,
           is_open_to_work=$19, notify_followers=$20, notify_likes=$21, notify_comments=$22,
           notify_approval=$23, notify_rejection=$24, notify_announcements=$25,
           privacy_show_email=$26, privacy_show_open_to_work=$27, privacy_allow_followers=$28,
           privacy_show_follower_count=$29, language_pref=$30
       WHERE uuid=$31`,
      [
        user.name, user.email, user.password, user.role, user.major, user.profession, user.year, user.bio,
        user.avatar_url, user.handle, user.username, user.last_username_change, Number(!!user.email_verified), user.email_verified_at,
        user.linkedin_url, user.portfolio_url, user.cover_url, user.cover_gradient,
        Number(!!user.is_open_to_work), Number(!!user.notify_followers), Number(!!user.notify_likes), Number(!!user.notify_comments),
        Number(!!user.notify_approval), Number(!!user.notify_rejection), Number(!!user.notify_announcements),
        Number(!!user.privacy_show_email), Number(!!user.privacy_show_open_to_work), Number(!!user.privacy_allow_followers),
        Number(!!user.privacy_show_follower_count), user.language_pref || 'en', user.uuid
      ]
    );
    return;
  }
  await pgPool.query(
    `INSERT INTO users (uuid, name, email, password, role, major, profession, year, bio, avatar_url, handle, username, last_username_change, email_verified, email_verified_at, linkedin_url, portfolio_url, cover_url, cover_gradient, is_open_to_work, notify_followers, notify_likes, notify_comments, notify_approval, notify_rejection, notify_announcements, privacy_show_email, privacy_show_open_to_work, privacy_allow_followers, privacy_show_follower_count, language_pref)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)
     ON CONFLICT (email) DO NOTHING`,
    [
      user.uuid, user.name, user.email, user.password, user.role, user.major, user.profession, user.year, user.bio, user.avatar_url,
      user.handle, user.username, user.last_username_change, Number(!!user.email_verified), user.email_verified_at, user.linkedin_url,
      user.portfolio_url, user.cover_url, user.cover_gradient, Number(!!user.is_open_to_work), Number(!!user.notify_followers),
      Number(!!user.notify_likes), Number(!!user.notify_comments), Number(!!user.notify_approval), Number(!!user.notify_rejection),
      Number(!!user.notify_announcements), Number(!!user.privacy_show_email), Number(!!user.privacy_show_open_to_work),
      Number(!!user.privacy_allow_followers), Number(!!user.privacy_show_follower_count), user.language_pref || 'en'
    ]
  );
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
const USERNAME_COOLDOWN_DAYS = 10;

function normalizeUsername(input = '') {
  return String(input).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

router.get('/me', auth, (req, res) => {
  (async () => {
    const localUser = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
    let user = localUser;

    if (usePg && pgPool) {
      try {
        const pgUser = await pgPool.query('SELECT * FROM users WHERE uuid=$1 LIMIT 1', [req.user.uuid]);
        if (pgUser.rows[0]) {
          user = mergeUserRows(pgUser.rows[0], localUser);
          if (!localUser || !localUser.username || !localUser.name || !localUser.email) {
            try { db.prepare('UPDATE users SET name=?, email=?, username=?, handle=?, major=?, profession=?, year=?, bio=?, avatar_url=?, linkedin_url=?, portfolio_url=?, cover_url=?, cover_gradient=?, is_open_to_work=?, notify_followers=?, notify_likes=?, notify_comments=?, notify_approval=?, notify_rejection=?, notify_announcements=?, privacy_show_email=?, privacy_show_open_to_work=?, privacy_allow_followers=?, privacy_show_follower_count=?, language_pref=? WHERE uuid=?')
              .run(
                user.name, user.email, user.username, user.handle, user.major, user.profession, user.year, user.bio, user.avatar_url,
                user.linkedin_url, user.portfolio_url, user.cover_url, user.cover_gradient, Number(!!user.is_open_to_work), Number(!!user.notify_followers),
                Number(!!user.notify_likes), Number(!!user.notify_comments), Number(!!user.notify_approval), Number(!!user.notify_rejection),
                Number(!!user.notify_announcements), Number(!!user.privacy_show_email), Number(!!user.privacy_show_open_to_work),
                Number(!!user.privacy_allow_followers), Number(!!user.privacy_show_follower_count), user.language_pref || 'en', req.user.uuid
              ); } catch {}
          }
        }
      } catch {
        // Fall back to local SQLite data.
      }
    }

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: safeUser(user) });
  })().catch((error) => res.status(500).json({ error: error.message || 'Failed to load user' }));
});

router.patch('/profile', auth, (req, res) => {
  const {
    name,
    username,
    handle,
    bio,
    year,
    profession,
    linkedin_url,
    portfolio_url,
    is_open_to_work,
    language_pref,
    privacy_show_open_to_work
  } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Full name is required' });
  }

  const current = db.prepare('SELECT id, username, last_username_change FROM users WHERE id=?').get(req.user.id);
  if (!current) return res.status(404).json({ error: 'User not found' });

  const requestedUsername = normalizeUsername(username || handle || current.username || '');
  if (!USERNAME_RE.test(requestedUsername)) {
    return res.status(400).json({ error: 'Username must be 3-24 chars and use only letters, numbers, and underscores' });
  }

  const usernameChanged = requestedUsername !== String(current.username || '');
  if (usernameChanged && current.last_username_change) {
    const lastChangeTs = new Date(current.last_username_change).getTime();
    if (!Number.isNaN(lastChangeTs)) {
      const nextAllowedTs = lastChangeTs + USERNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() < nextAllowedTs) {
        const daysLeft = Math.ceil((nextAllowedTs - Date.now()) / (24 * 60 * 60 * 1000));
        return res.status(429).json({
          error: `Username can be changed once every ${USERNAME_COOLDOWN_DAYS} days. Try again in ${daysLeft} day(s).`,
          daysRemaining: daysLeft
        });
      }
    }
  }

  const duplicate = db.prepare('SELECT id FROM users WHERE lower(username)=lower(?) AND id<>?').get(requestedUsername, req.user.id);
  if (duplicate) return res.status(409).json({ error: 'Username is already taken' });

  db.prepare(`
    UPDATE users
    SET name=?,
        username=?,
        handle=?,
        last_username_change=CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE last_username_change END,
        bio=?,
        year=?,
        profession=?,
        major=?,
        linkedin_url=?,
        portfolio_url=?,
        is_open_to_work=?,
        privacy_show_open_to_work=?,
        language_pref=?
    WHERE id=?
  `).run(
    String(name).trim(),
    requestedUsername,
    requestedUsername,
    usernameChanged ? 1 : 0,
    (bio || '').trim(),
    year || null,
    profession || null,
    profession || null,
    (linkedin_url || '').trim() || null,
    (portfolio_url || '').trim() || null,
    Number(!!is_open_to_work),
    Number(privacy_show_open_to_work !== undefined ? !!privacy_show_open_to_work : true),
    language_pref || 'en',
    req.user.id
  );

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  syncUserToPg(user).catch(() => {});
  res.json({ user: safeUser(user) });
});

router.patch('/avatar', auth, avatarUpload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Avatar file is required' });
  if (isVercel) {
    return res.status(501).json({
      error: 'Avatar upload to local filesystem is disabled on Vercel. Use Supabase Storage for uploads.'
    });
  }
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  db.prepare('UPDATE users SET avatar_url=? WHERE id=?').run(avatarUrl, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  syncUserToPg(user).catch(() => {});
  res.json({ user: safeUser(user) });
});

router.patch('/cover', auth, coverUpload.single('cover'), (req, res) => {
  if (isVercel && req.file) {
    return res.status(501).json({
      error: 'Cover upload to local filesystem is disabled on Vercel. Use Supabase Storage for uploads.'
    });
  }

  if (req.file) {
    const coverUrl = `/uploads/covers/${req.file.filename}`;
    db.prepare('UPDATE users SET cover_url=?, cover_gradient=? WHERE id=?').run(coverUrl, null, req.user.id);
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
    return res.json({ user: safeUser(user) });
  }

  const { cover_gradient } = req.body;
  if (!cover_gradient) return res.status(400).json({ error: 'Cover file or cover_gradient is required' });

  db.prepare('UPDATE users SET cover_gradient=?, cover_url=? WHERE id=?').run(String(cover_gradient), null, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  return res.json({ user: safeUser(user) });
});

router.patch('/password', auth, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'current_password and new_password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(current_password, user.password)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password=? WHERE id=?').run(hash, req.user.id);
  res.json({ ok: true });
});

router.patch('/email', auth, (req, res) => {
  const { new_email, password } = req.body;
  if (!new_email || !password) {
    return res.status(400).json({ error: 'new_email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ error: 'Password is incorrect' });
  }

  const duplicate = db.prepare('SELECT id FROM users WHERE email=? AND id<>?').get(String(new_email).trim(), req.user.id);
  if (duplicate) return res.status(409).json({ error: 'Email already in use' });

  db.prepare('UPDATE users SET email=? WHERE id=?').run(String(new_email).trim(), req.user.id);
  const updated = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  res.json({ user: safeUser(updated) });
});

router.patch('/notifications', auth, (req, res) => {
  const {
    notify_followers,
    notify_likes,
    notify_comments,
    notify_approval,
    notify_rejection,
    notify_announcements
  } = req.body;

  db.prepare(`
    UPDATE users
    SET notify_followers=?,
        notify_likes=?,
        notify_comments=?,
        notify_approval=?,
        notify_rejection=?,
        notify_announcements=?
    WHERE id=?
  `).run(
    Number(!!notify_followers),
    Number(!!notify_likes),
    Number(!!notify_comments),
    Number(!!notify_approval),
    Number(!!notify_rejection),
    Number(!!notify_announcements),
    req.user.id
  );

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  syncUserToPg(user).catch(() => {});
  res.json({ user: safeUser(user) });
});

router.patch('/privacy', auth, (req, res) => {
  const {
    privacy_show_email,
    privacy_show_open_to_work,
    privacy_allow_followers,
    privacy_show_follower_count
  } = req.body;

  db.prepare(`
    UPDATE users
    SET privacy_show_email=?,
        privacy_show_open_to_work=?,
        privacy_allow_followers=?,
        privacy_show_follower_count=?
    WHERE id=?
  `).run(
    Number(!!privacy_show_email),
    Number(!!privacy_show_open_to_work),
    Number(!!privacy_allow_followers),
    Number(!!privacy_show_follower_count),
    req.user.id
  );

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  syncUserToPg(user).catch(() => {});
  res.json({ user: safeUser(user) });
});

router.delete('/account', auth, (req, res) => {
  const { email_confirmation } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!email_confirmation || String(email_confirmation).trim().toLowerCase() !== String(user.email).toLowerCase()) {
    return res.status(400).json({ error: 'Email confirmation does not match your account email' });
  }

  db.prepare('DELETE FROM users WHERE id=?').run(req.user.id);
  res.json({ ok: true });
});

module.exports = router;
