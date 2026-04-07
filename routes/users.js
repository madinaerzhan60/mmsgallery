const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const { pgPool, usePg } = require('../pg');
const { auth } = require('../middleware/auth');

const isVercel = Boolean(process.env.VERCEL);
const avatarDir = path.join(__dirname, '../public/uploads/avatars');
const coverDir = path.join(__dirname, '../public/uploads/covers');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'media';
const supabaseEnabled = Boolean(supabaseUrl && supabaseServiceRoleKey);
const supabase = supabaseEnabled
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

if (!isVercel) {
  try {
    if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
    if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir, { recursive: true });
  } catch (error) {
    console.warn('[user-upload] Failed to prepare upload directories:', error.message);
  }
}

function pgRequired(res) {
  if (!usePg || !pgPool) {
    res.status(500).json({ error: 'DATABASE_URL is not configured' });
    return false;
  }
  return true;
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
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
const USERNAME_COOLDOWN_DAYS = 10;

function normalizeUsername(input = '') {
  return String(input).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

function extForFile(file) {
  const guessed = path.extname(file.originalname || '').toLowerCase();
  if (guessed) return guessed;
  if ((file.mimetype || '').includes('png')) return '.png';
  if ((file.mimetype || '').includes('webp')) return '.webp';
  if ((file.mimetype || '').includes('gif')) return '.gif';
  if ((file.mimetype || '').includes('jpeg') || (file.mimetype || '').includes('jpg')) return '.jpg';
  return '.bin';
}

async function uploadToStorage(file, folder) {
  if (!supabase) {
    throw new Error('Cloud upload is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  const objectPath = `${folder}/${uuidv4()}${extForFile(file)}`;
  const { error: uploadError } = await supabase.storage
    .from(storageBucket)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype || 'application/octet-stream',
      upsert: false,
      cacheControl: '3600'
    });

  if (uploadError) {
    throw new Error(uploadError.message || 'Failed to upload file to storage.');
  }

  const { data } = supabase.storage.from(storageBucket).getPublicUrl(objectPath);
  return data.publicUrl;
}

async function getCurrentUser(req) {
  const result = await pgPool.query('SELECT * FROM users WHERE uuid=$1 LIMIT 1', [req.user.uuid]);
  return result.rows[0] || null;
}

router.get('/me', auth, async (req, res) => {
  if (!pgRequired(res)) return;
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to load user' });
  }
});

router.patch('/profile', auth, async (req, res) => {
  if (!pgRequired(res)) return;
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

  try {
    const current = await getCurrentUser(req);
    if (!current) return res.status(404).json({ error: 'User not found' });

    const requestedUsername = normalizeUsername(username || handle || current.username || current.handle || '');
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

    const duplicate = await pgPool.query(
      'SELECT id FROM users WHERE lower(username)=lower($1) AND id<>$2 LIMIT 1',
      [requestedUsername, current.id]
    );
    if (duplicate.rows[0]) return res.status(409).json({ error: 'Username is already taken' });

    await pgPool.query(
      `UPDATE users
       SET name=$1,
           username=$2,
           handle=$3,
           last_username_change=CASE WHEN $4 = 1 THEN NOW() ELSE last_username_change END,
           bio=$5,
           year=$6,
           profession=$7,
           major=$8,
           linkedin_url=$9,
           portfolio_url=$10,
           is_open_to_work=$11,
           privacy_show_open_to_work=$12,
           language_pref=$13
       WHERE uuid=$14`,
      [
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
        req.user.uuid
      ]
    );

    const user = await getCurrentUser(req);
    res.json({ user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

router.patch('/avatar', auth, avatarUpload.single('avatar'), async (req, res) => {
  if (!pgRequired(res)) return;
  if (!req.file) return res.status(400).json({ error: 'Avatar file is required' });

  try {
    const avatarUrl = isVercel
      ? await uploadToStorage(req.file, 'avatars')
      : `/uploads/avatars/${req.file.filename}`;
    await pgPool.query('UPDATE users SET avatar_url=$1 WHERE uuid=$2', [avatarUrl, req.user.uuid]);
    const user = await getCurrentUser(req);
    res.json({ user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update avatar' });
  }
});

router.patch('/cover', auth, coverUpload.single('cover'), async (req, res) => {
  if (!pgRequired(res)) return;

  try {
    if (req.file) {
      const coverUrl = isVercel
        ? await uploadToStorage(req.file, 'covers')
        : `/uploads/covers/${req.file.filename}`;
      await pgPool.query('UPDATE users SET cover_url=$1, cover_gradient=$2 WHERE uuid=$3', [coverUrl, null, req.user.uuid]);
      const user = await getCurrentUser(req);
      return res.json({ user: safeUser(user) });
    }

    const { cover_gradient } = req.body;
    if (!cover_gradient) return res.status(400).json({ error: 'Cover file or cover_gradient is required' });

    await pgPool.query('UPDATE users SET cover_gradient=$1, cover_url=$2 WHERE uuid=$3', [String(cover_gradient), null, req.user.uuid]);
    const user = await getCurrentUser(req);
    return res.json({ user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update cover' });
  }
});

router.patch('/password', auth, async (req, res) => {
  if (!pgRequired(res)) return;
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'current_password and new_password are required' });
  }

  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!bcrypt.compareSync(current_password, user.password)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hash = bcrypt.hashSync(new_password, 10);
    await pgPool.query('UPDATE users SET password=$1 WHERE uuid=$2', [hash, req.user.uuid]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update password' });
  }
});

router.patch('/email', auth, async (req, res) => {
  if (!pgRequired(res)) return;
  const { new_email, password } = req.body;
  if (!new_email || !password) {
    return res.status(400).json({ error: 'new_email and password are required' });
  }

  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: 'Password is incorrect' });
    }

    const duplicate = await pgPool.query(
      'SELECT id FROM users WHERE lower(email)=lower($1) AND id<>$2 LIMIT 1',
      [String(new_email).trim(), user.id]
    );
    if (duplicate.rows[0]) return res.status(409).json({ error: 'Email already in use' });

    await pgPool.query('UPDATE users SET email=$1 WHERE uuid=$2', [String(new_email).trim(), req.user.uuid]);
    const updated = await getCurrentUser(req);
    res.json({ user: safeUser(updated) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update email' });
  }
});

router.patch('/notifications', auth, async (req, res) => {
  if (!pgRequired(res)) return;
  const {
    notify_followers,
    notify_likes,
    notify_comments,
    notify_approval,
    notify_rejection,
    notify_announcements
  } = req.body;

  try {
    await pgPool.query(
      `UPDATE users
       SET notify_followers=$1,
           notify_likes=$2,
           notify_comments=$3,
           notify_approval=$4,
           notify_rejection=$5,
           notify_announcements=$6
       WHERE uuid=$7`,
      [
        Number(!!notify_followers),
        Number(!!notify_likes),
        Number(!!notify_comments),
        Number(!!notify_approval),
        Number(!!notify_rejection),
        Number(!!notify_announcements),
        req.user.uuid
      ]
    );

    const user = await getCurrentUser(req);
    res.json({ user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update notifications' });
  }
});

router.patch('/privacy', auth, async (req, res) => {
  if (!pgRequired(res)) return;
  const {
    privacy_show_email,
    privacy_show_open_to_work,
    privacy_allow_followers,
    privacy_show_follower_count
  } = req.body;

  try {
    await pgPool.query(
      `UPDATE users
       SET privacy_show_email=$1,
           privacy_show_open_to_work=$2,
           privacy_allow_followers=$3,
           privacy_show_follower_count=$4
       WHERE uuid=$5`,
      [
        Number(!!privacy_show_email),
        Number(!!privacy_show_open_to_work),
        Number(!!privacy_allow_followers),
        Number(!!privacy_show_follower_count),
        req.user.uuid
      ]
    );

    const user = await getCurrentUser(req);
    res.json({ user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update privacy settings' });
  }
});

router.delete('/account', auth, async (req, res) => {
  if (!pgRequired(res)) return;
  const { email_confirmation } = req.body;

  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!email_confirmation || String(email_confirmation).trim().toLowerCase() !== String(user.email).toLowerCase()) {
      return res.status(400).json({ error: 'Email confirmation does not match your account email' });
    }

    await pgPool.query('DELETE FROM users WHERE uuid=$1', [req.user.uuid]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to delete account' });
  }
});

module.exports = router;
