const router = require('express').Router();
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  const cookieHeader = req.headers.cookie || '';
  const tokenPart = cookieHeader.split(';').map((s) => s.trim()).find((p) => p.startsWith('mms_token='));
  if (!tokenPart) return null;
  return decodeURIComponent(tokenPart.slice('mms_token='.length));
}

function getOptionalViewerId(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id FROM users WHERE id=? AND uuid=?').get(payload.id, payload.uuid);
    return user?.id || null;
  } catch {
    return null;
  }
}

function findStudentByIdentifier(identifier) {
  const normalized = String(identifier || '').trim();
  const numericId = Number(normalized);
  return db.prepare(`
    SELECT id, uuid, username
    FROM users
    WHERE role='student' AND (
      uuid=?
      OR lower(username)=lower(?)
      OR lower(handle)=lower(?)
      OR id=?
    )
    LIMIT 1
  `).get(normalized, normalized, normalized, Number.isNaN(numericId) ? null : numericId);
}

function recordProfileView(targetUserId, viewerUserId = null) {
  db.prepare('INSERT INTO profile_views (viewed_user_id, viewer_user_id) VALUES (?, ?)')
    .run(targetUserId, viewerUserId || null);
}

function profileSelect() {
  return `
    SELECT
      u.id,
      u.uuid,
      u.username,
      u.name,
      CASE WHEN u.privacy_show_email = 1 THEN u.email ELSE NULL END AS email,
      u.year,
      u.bio,
      u.avatar_url,
      u.profession,
      u.linkedin_url,
      u.portfolio_url,
      u.is_open_to_work,
      u.language_pref,
      u.created_at,
      (SELECT COUNT(*) FROM artworks a WHERE a.user_id=u.id AND a.status='approved') AS works_count,
      (SELECT COALESCE(SUM(a.likes_count), 0) FROM artworks a WHERE a.user_id=u.id AND a.status='approved') AS likes_count,
      (CASE
        WHEN u.privacy_show_follower_count = 1 THEN (SELECT COUNT(*) FROM follows f WHERE f.following_id=u.id)
        ELSE 0
      END) AS followers_count,
      (SELECT COUNT(*) FROM follows f WHERE f.follower_id=u.id) AS following_count
    FROM users u
    WHERE u.role='student'
  `;
}

function decorateArtworkRows(rows) {
  return rows.map((row) => ({
    ...row,
    likes: row.likes_count || 0,
    comments: db.prepare('SELECT COUNT(*) as c FROM comments WHERE artwork_id=?').get(row.id).c
  }));
}

// ── Artists (public users) ─────────────────────────────────────
router.get('/artists', (req, res) => {
  const users = db.prepare(`
    SELECT
      u.id,
      u.uuid,
      u.username,
      u.name,
      COALESCE(u.profession, u.major) AS major,
      u.year,
      u.bio,
      u.avatar_url,
      (SELECT COUNT(*) FROM artworks WHERE user_id=u.id AND status='approved') AS artwork_count
    FROM users u
    WHERE u.role='student'
    ORDER BY artwork_count DESC, u.created_at DESC
  `).all();
  res.json(users);
});

router.get('/artists/top', (req, res) => {
  const rows = db.prepare(`${profileSelect()} ORDER BY likes_count DESC, followers_count DESC LIMIT 3`).all();
  res.json(rows);
});

router.get('/artists/:uuid', (req, res) => {
  const target = findStudentByIdentifier(req.params.uuid);
  if (!target) return res.status(404).json({ error: 'Not found' });
  const u = db.prepare(`
    SELECT
      id,
      uuid,
      username,
      name,
      COALESCE(profession, major) AS major,
      profession,
      year,
      bio,
      avatar_url,
      linkedin_url,
      portfolio_url,
      is_open_to_work,
      created_at
    FROM users
    WHERE id=? AND role='student'
  `).get(target.id);
  if (!u) return res.status(404).json({ error: 'Not found' });

  recordProfileView(u.id, getOptionalViewerId(req));

  const artworks = decorateArtworkRows(db.prepare(`
    SELECT *
    FROM artworks
    WHERE user_id=? AND status='approved'
    ORDER BY created_at DESC
  `).all(u.id));
  res.json({ ...u, artworks });
});

router.get('/profiles', (req, res) => {
  const { sort = 'newest', profession = 'all' } = req.query;
  const where = [];
  const params = [];

  if (profession && profession !== 'all') {
    where.push('COALESCE(u.profession, u.major) = ?');
    params.push(profession);
  }

  let query = profileSelect();
  if (where.length) query += ` AND ${where.join(' AND ')}`;

  if (sort === 'likes') query += ' ORDER BY likes_count DESC, followers_count DESC';
  else if (sort === 'followers') query += ' ORDER BY followers_count DESC, likes_count DESC';
  else query += ' ORDER BY u.created_at DESC';

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

router.get('/profiles/:uuid', (req, res) => {
  const target = findStudentByIdentifier(req.params.uuid);
  if (!target) return res.status(404).json({ error: 'Not found' });

  const profile = db.prepare(`${profileSelect()} AND u.uuid=?`).get(target.uuid);
  if (!profile) return res.status(404).json({ error: 'Not found' });

  recordProfileView(profile.id, getOptionalViewerId(req));

  const artworks = decorateArtworkRows(db.prepare(`
    SELECT *
    FROM artworks
    WHERE user_id=? AND status='approved'
    ORDER BY created_at DESC
  `).all(profile.id));

  res.json({ ...profile, major: profile.profession, artworks });
});

router.get('/profiles/:uuid/followers-preview', (req, res) => {
  const target = findStudentByIdentifier(req.params.uuid);
  if (!target) return res.status(404).json({ error: 'Profile not found' });

  const followers = db.prepare(`
    SELECT u.uuid, u.username, u.name, u.avatar_url
    FROM follows f
    JOIN users u ON u.id = f.follower_id
    WHERE f.following_id=?
    ORDER BY f.created_at DESC
    LIMIT 5
  `).all(target.id);

  const total = db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id=?').get(target.id).c;
  res.json({ total, followers });
});

router.get('/profiles/:uuid/followers', (req, res) => {
  const target = findStudentByIdentifier(req.params.uuid);
  if (!target) return res.status(404).json({ error: 'Profile not found' });

  const rows = db.prepare(`
    SELECT u.uuid, u.username, u.name, u.avatar_url
    FROM follows f
    JOIN users u ON u.id = f.follower_id
    WHERE f.following_id=?
    ORDER BY f.created_at DESC
  `).all(target.id);

  res.json({ total: rows.length, followers: rows });
});

router.get('/profiles/:uuid/following-preview', (req, res) => {
  const target = findStudentByIdentifier(req.params.uuid);
  if (!target) return res.status(404).json({ error: 'Profile not found' });

  const following = db.prepare(`
    SELECT u.uuid, u.username, u.name, u.avatar_url
    FROM follows f
    JOIN users u ON u.id = f.following_id
    WHERE f.follower_id=?
    ORDER BY f.created_at DESC
    LIMIT 5
  `).all(target.id);

  const total = db.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id=?').get(target.id).c;
  res.json({ total, following });
});

router.get('/profiles/:uuid/following', (req, res) => {
  const target = findStudentByIdentifier(req.params.uuid);
  if (!target) return res.status(404).json({ error: 'Profile not found' });

  const rows = db.prepare(`
    SELECT u.uuid, u.username, u.name, u.avatar_url
    FROM follows f
    JOIN users u ON u.id = f.following_id
    WHERE f.follower_id=?
    ORDER BY f.created_at DESC
  `).all(target.id);

  res.json({ total: rows.length, following: rows });
});

router.get('/hire', (req, res) => {
  const { sort = 'likes', profession = 'all' } = req.query;
  const filters = ['u.is_open_to_work = 1', 'u.privacy_show_open_to_work = 1'];
  const params = [];

  if (profession && profession !== 'all') {
    filters.push('COALESCE(u.profession, u.major) = ?');
    params.push(profession);
  }

  let query = `${profileSelect()} AND ${filters.join(' AND ')}`;
  if (sort === 'followers') query += ' ORDER BY followers_count DESC, likes_count DESC';
  else if (sort === 'newest') query += ' ORDER BY u.created_at DESC';
  else query += ' ORDER BY likes_count DESC, followers_count DESC';

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

router.post('/profiles/:uuid/follow', auth, (req, res) => {
  const target = db.prepare(`
    SELECT id, privacy_allow_followers
    FROM users
    WHERE role='student' AND (uuid=? OR username=? OR handle=?)
  `).get(req.params.uuid, req.params.uuid, req.params.uuid);
  if (!target) return res.status(404).json({ error: 'Profile not found' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'You cannot follow yourself' });
  if (!Number(target.privacy_allow_followers)) {
    return res.status(403).json({ error: 'This user does not allow followers' });
  }

  const existing = db.prepare('SELECT id FROM follows WHERE follower_id=? AND following_id=?').get(req.user.id, target.id);
  if (existing) {
    db.prepare('DELETE FROM follows WHERE follower_id=? AND following_id=?').run(req.user.id, target.id);
    return res.json({ following: false });
  }

  db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user.id, target.id);
  db.prepare('INSERT INTO notifications (user_id, type, from_user_id) VALUES (?, ?, ?)').run(target.id, 'follow', req.user.id);
  return res.json({ following: true });
});

router.get('/profiles/:uuid/follow-state', auth, (req, res) => {
  const target = findStudentByIdentifier(req.params.uuid);
  if (!target) return res.status(404).json({ error: 'Profile not found' });

  const row = db.prepare('SELECT 1 FROM follows WHERE follower_id=? AND following_id=?').get(req.user.id, target.id);
  res.json({ following: !!row });
});

router.get('/feed/following', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT a.*,
      u.uuid as author_uuid,
      u.username as author_username,
      u.name as author_name,
      COALESCE(u.profession, u.major) as author_major,
      u.year as author_year,
      (SELECT COUNT(*) FROM comments c WHERE c.artwork_id = a.id) as comments_count
    FROM artworks a
    JOIN users u ON a.user_id=u.id
    WHERE a.status='approved'
      AND a.user_id IN (
        SELECT following_id FROM follows WHERE follower_id=?
      )
    ORDER BY a.created_at DESC
  `).all(req.user.id);
  res.json(rows);
});

router.get('/notifications', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT n.*, fu.uuid as from_user_uuid, fu.name as from_user_name
    FROM notifications n
    LEFT JOIN users fu ON fu.id=n.from_user_id
    WHERE n.user_id=?
    ORDER BY n.created_at DESC
    LIMIT 50
  `).all(req.user.id);
  res.json(rows);
});

router.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.prepare('INSERT INTO feedback (name, email, subject, message) VALUES (?, ?, ?, ?)')
    .run(name.trim(), email.trim(), subject.trim(), message.trim());

  res.status(201).json({ ok: true, inbox: 'admin-feedback' });
});

// ── Admin ──────────────────────────────────────────────────────
router.get('/admin/stats', adminOnly, (req, res) => {
  res.json({
    users: db.prepare("SELECT COUNT(*) as c FROM users WHERE role='student'").get().c,
    artworks: db.prepare("SELECT COUNT(*) as c FROM artworks").get().c,
    pending: db.prepare("SELECT COUNT(*) as c FROM artworks WHERE status='pending'").get().c,
    approved: db.prepare("SELECT COUNT(*) as c FROM artworks WHERE status='approved'").get().c,
    rejected: db.prepare("SELECT COUNT(*) as c FROM artworks WHERE status='rejected'").get().c,
    likes: db.prepare("SELECT COALESCE(SUM(likes_count), 0) as c FROM artworks").get().c,
    comments: db.prepare("SELECT COUNT(*) as c FROM comments").get().c,
    feedback: db.prepare("SELECT COUNT(*) as c FROM feedback").get().c,
  });
});

router.get('/admin/artworks', adminOnly, (req, res) => {
  const { status } = req.query;
  let q = `SELECT a.*, u.uuid as author_uuid, u.username as author_username, u.name as author_name, u.email as author_email,
    (SELECT COUNT(*) FROM likes WHERE artwork_id=a.id) as likes
    FROM artworks a JOIN users u ON a.user_id=u.id`;
  const params = [];
  if (status) { q += ' WHERE a.status=?'; params.push(status); }
  q += ' ORDER BY a.created_at DESC';
  res.json(db.prepare(q).all(...params));
});

router.get('/admin/users', adminOnly, (req, res) => {
  const { profession = 'all', open_to_work = 'all' } = req.query;
  const where = [];
  const params = [];

  if (profession !== 'all') {
    where.push('COALESCE(u.profession, u.major)=?');
    params.push(profession);
  }

  if (open_to_work === '1' || open_to_work === '0') {
    where.push('u.is_open_to_work=?');
    params.push(Number(open_to_work));
  }

  let query = `
    SELECT u.*,
      (SELECT COUNT(*) FROM artworks WHERE user_id=u.id) as artwork_count,
      (SELECT COUNT(*) FROM follows WHERE following_id=u.id) as followers_count,
      (SELECT COUNT(*) FROM follows WHERE follower_id=u.id) as following_count
    FROM users u
  `;
  if (where.length) query += ` WHERE ${where.join(' AND ')}`;
  query += ' ORDER BY u.created_at DESC';

  const users = db.prepare(query).all(...params);
  res.json(users.map(({ password, ...u }) => u));
});

router.get('/admin/feedback', adminOnly, (req, res) => {
  const rows = db.prepare('SELECT * FROM feedback ORDER BY created_at DESC').all();
  res.json(rows);
});

router.delete('/admin/feedback/:id', adminOnly, (req, res) => {
  db.prepare('DELETE FROM feedback WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/admin/follows/stats', adminOnly, (req, res) => {
  const rows = db.prepare(`
    SELECT
      u.uuid,
      u.name,
      (SELECT COUNT(*) FROM follows WHERE following_id=u.id) as followers,
      (SELECT COUNT(*) FROM follows WHERE follower_id=u.id) as following
    FROM users u
    WHERE u.role='student'
    ORDER BY followers DESC, following DESC
  `).all();
  res.json(rows);
});

router.get('/admin/students/export.csv', adminOnly, (req, res) => {
  const rows = db.prepare(`
    SELECT
      name,
      email,
      COALESCE(profession, major, '') as profession,
      year,
      is_open_to_work,
      (SELECT COUNT(*) FROM artworks WHERE user_id=users.id AND status='approved') as works_count,
      (SELECT COALESCE(SUM(likes_count), 0) FROM artworks WHERE user_id=users.id AND status='approved') as likes_count,
      (SELECT COUNT(*) FROM follows WHERE following_id=users.id) as followers_count
    FROM users
    WHERE role='student'
    ORDER BY created_at DESC
  `).all();

  const header = ['name', 'email', 'profession', 'year', 'is_open_to_work', 'works_count', 'likes_count', 'followers_count'];
  const csv = [header.join(',')]
    .concat(rows.map((r) => header.map((key) => JSON.stringify(r[key] ?? '')).join(',')))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
  res.send(csv);
});

router.patch('/admin/artworks/:id/status', adminOnly, (req, res) => {
  const { status, featured } = req.body;
  db.prepare('UPDATE artworks SET status=?, featured=COALESCE(?,featured) WHERE id=?')
    .run(status, featured != null ? Number(featured) : null, req.params.id);
  res.json({ ok: true });
});

router.delete('/admin/users/:id', adminOnly, (req, res) => {
  db.prepare('DELETE FROM users WHERE id=? AND role!=?').run(req.params.id, 'admin');
  res.json({ ok: true });
});

module.exports = router;
