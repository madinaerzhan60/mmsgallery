require('dotenv').config();
require('./database'); // init DB
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const { JWT_SECRET } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const isVercel = Boolean(process.env.VERCEL);

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!isVercel) {
  try {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (error) {
    console.warn('[uploads] Failed to prepare uploads directory:', error.message);
  }
}

// ── Middleware ─────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseCookies(cookieHeader = '') {
  const out = {};
  cookieHeader.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) return;
    out[key] = decodeURIComponent(value);
  });
  return out;
}

function getRequestToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies.mms_token || null;
}

function greetingByHour(hour) {
  if (hour >= 6 && hour < 12) return 'Доброе утро! Готов к творчеству?';
  if (hour >= 12 && hour < 18) return 'Добрый день! Есть новые идеи?';
  return 'Добрый вечер! Покажи что создал сегодня';
}

function buildPersonalizedHero(user) {
  const stats = db.prepare(`
    SELECT
      COUNT(*) AS totalWorks,
      SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) AS approvedWorks,
      SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pendingWorks,
      COALESCE(SUM(likes_count), 0) AS totalLikes
    FROM artworks
    WHERE user_id=?
  `).get(user.id);

  const approvedEvents = db.prepare(`
    SELECT title, created_at
    FROM artworks
    WHERE user_id=? AND status='approved'
    ORDER BY created_at DESC
    LIMIT 3
  `).all(user.id).map((row) => ({
    type: 'approved',
    text: `Твоя работа «${escapeHtml(row.title)}» одобрена ✓`,
    ts: new Date(row.created_at).getTime() || 0
  }));

  const likedEvents = db.prepare(`
    SELECT title, likes_count, created_at
    FROM artworks
    WHERE user_id=? AND likes_count > 0
    ORDER BY created_at DESC
    LIMIT 3
  `).all(user.id).map((row) => ({
    type: 'liked',
    text: `Твою работу «${escapeHtml(row.title)}» лайкнули (${Number(row.likes_count || 0)} раз)`,
    ts: new Date(row.created_at).getTime() || 0
  }));

  const weeklyViews = db.prepare(`
    SELECT COUNT(*) AS c
    FROM profile_views
    WHERE viewed_user_id=? AND created_at >= datetime('now', '-7 day')
  `).get(user.id)?.c || 0;

  const viewEvent = weeklyViews > 0
    ? [{
        type: 'views',
        text: `Твой профиль посмотрели ${weeklyViews} раз за неделю`,
        ts: Date.now()
      }]
    : [];

  const activityEvents = [...approvedEvents, ...likedEvents, ...viewEvent]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 3);

  const needsProfileReminder = !user.avatar_url || !String(user.bio || '').trim() || !String(user.username || '').trim();
  const profileSlug = encodeURIComponent((user.username || user.handle || '').trim() || user.uuid);
  const subtitle = greetingByHour(new Date().getHours());

  return `
  <section class="hero personalized-hero" style="min-height:unset;padding-top:112px;padding-bottom:44px">
    <div class="hero-shell" style="max-width:1040px;text-align:left;padding:34px 28px">
      <div class="hero-eyebrow" style="opacity:1;animation:none;margin-bottom:10px">Персональная лента</div>
      <h1 class="hero-title" style="font-size:clamp(1.9rem,4vw,3rem);opacity:1;animation:none">Привет, ${escapeHtml(user.name || 'друг')}!</h1>
      <p class="hero-sub" style="opacity:1;animation:none;margin-top:10px">${subtitle}</p>

      <div style="display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:12px;margin-top:22px">
        <article style="border:1px solid var(--border-color);border-radius:14px;padding:12px;background:var(--bg-secondary)">
          <div style="font-size:1.25rem;font-weight:800;color:var(--accent-primary)">${Number(stats.totalWorks || 0)}</div>
          <div style="font-size:.78rem;color:var(--text-muted)">Всего работ</div>
        </article>
        <article style="border:1px solid var(--border-color);border-radius:14px;padding:12px;background:var(--bg-secondary)">
          <div style="font-size:1.25rem;font-weight:800;color:var(--success)">${Number(stats.approvedWorks || 0)}</div>
          <div style="font-size:.78rem;color:var(--text-muted)">Одобрено</div>
        </article>
        <article style="border:1px solid var(--border-color);border-radius:14px;padding:12px;background:var(--bg-secondary)">
          <div style="font-size:1.25rem;font-weight:800;color:var(--warning)">${Number(stats.pendingWorks || 0)}</div>
          <div style="font-size:.78rem;color:var(--text-muted)">На проверке</div>
        </article>
        <article style="border:1px solid var(--border-color);border-radius:14px;padding:12px;background:var(--bg-secondary)">
          <div style="font-size:1.25rem;font-weight:800;color:var(--accent-primary)">${Number(stats.totalLikes || 0)}</div>
          <div style="font-size:.78rem;color:var(--text-muted)">Всего лайков</div>
        </article>
      </div>

      <div class="hero-btns" style="justify-content:flex-start;opacity:1;animation:none;margin-top:18px">
        <a href="/upload" class="btn btn-primary btn-sm">+ Загрузить работу</a>
        <a href="/profile/${profileSlug}" class="btn btn-ghost btn-sm">Мой профиль</a>
        <a href="/dashboard" class="btn btn-ghost btn-sm">Дашборд</a>
      </div>

      ${needsProfileReminder ? `
        <div style="margin-top:18px;border:1px solid #facc15;background:rgba(250,204,21,.14);color:#7c5f00;border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <span style="font-size:.9rem;font-weight:600">Заполни профиль - тебя смогут найти работодатели</span>
          <a href="/settings/profile" class="btn btn-ghost btn-sm" style="border-color:#facc15;background:rgba(255,255,255,.4)">Заполнить</a>
        </div>
      ` : ''}

      ${activityEvents.length ? `
        <div style="margin-top:18px;border-top:1px solid var(--border-color);padding-top:14px">
          <div style="font-size:.78rem;letter-spacing:.09em;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px">Последняя активность</div>
          <div style="display:grid;gap:8px">
            ${activityEvents.map((event) => `<div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:12px;padding:10px 12px;font-size:.9rem;color:var(--text-secondary)">${event.text}</div>`).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  </section>
  <style>
    @media (max-width: 900px) {
      .personalized-hero .hero-shell > div[style*="grid-template-columns:repeat(4"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    }
    @media (max-width: 520px) {
      .personalized-hero .hero-shell > div[style*="grid-template-columns:repeat(4"] { grid-template-columns: 1fr !important; }
    }
  </style>
  `;
}

function renderIndexForRequest(req) {
  const indexPath = path.join(__dirname, 'public/index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  const token = getRequestToken(req);
  let personalized = '';

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = db.prepare(`
        SELECT id, uuid, username, handle, name, bio, avatar_url
        FROM users
        WHERE id=? AND uuid=?
      `).get(payload.id, payload.uuid);
      if (user) {
        personalized = buildPersonalizedHero(user);
        html = html.replace('<section class="hero">', '<section class="hero" style="display:none">');
        html = html.replace('<section class="idea-strip"', '<section class="idea-strip" style="display:none"');
      }
    } catch {
      // Invalid/expired token: render public hero.
    }
  }

  return html.replace('<!--SSR_PERSONAL_HERO-->', personalized);
}

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/artworks', require('./routes/artworks'));
app.use('/api', require('./routes/api'));

// Return JSON for API errors instead of Express HTML error pages.
app.use((err, req, res, next) => {
  if (!err) return next();
  const status = Number(err.status || err.statusCode || 500);
  const rawMessage = String(err.message || 'Internal Server Error');
  const message = /readonly|read-only|SQLITE_READONLY/i.test(rawMessage)
    ? 'Database is read-only in this environment. Configure a writable database for profile updates.'
    : rawMessage;

  if (String(req.path || '').startsWith('/api/')) {
    return res.status(status).json({ error: message });
  }

  return next(err);
});

// ── SPA fallback ───────────────────────────────────────────────
app.get('/favicon.ico', (req, res) => res.redirect(302, '/favicon.svg'));
app.get('/', (req, res) => res.send(renderIndexForRequest(req)));
app.get('/auth', (req, res) => res.sendFile(path.join(__dirname, 'public/auth.html')));
app.get('/gallery', (req, res) => res.sendFile(path.join(__dirname, 'public/gallery.html')));
app.get('/artists', (req, res) => res.sendFile(path.join(__dirname, 'public/artists.html')));
app.get('/hire', (req, res) => res.sendFile(path.join(__dirname, 'public/hire.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public/contact.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public/dashboard.html')));
app.get('/upload', (req, res) => res.redirect('/dashboard?tab=submit'));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, 'public/settings.html')));
app.get('/settings/profile', (req, res) => res.sendFile(path.join(__dirname, 'public/settings.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/admin.html')));
app.get('/artist/:uuid', (req, res) => res.redirect(`/profile/${encodeURIComponent(req.params.uuid)}`));
app.get('/profile/:uuid', (req, res) => {
  const slug = String(req.params.uuid || '').trim();
  const underscoreVariant = slug.replace(/-/g, '_');
  const dashVariant = slug.replace(/_/g, '-');
  const row = db.prepare(`
    SELECT username, uuid
    FROM users
    WHERE role='student' AND (
      uuid=?
      OR lower(username)=lower(?)
      OR lower(username)=lower(?)
      OR lower(handle)=lower(?)
      OR lower(handle)=lower(?)
    )
    LIMIT 1
  `).get(slug, slug, underscoreVariant, slug, dashVariant);

  if (!row) {
    return res.redirect(302, '/artists');
  }

  if (row?.username && slug !== row.username) {
    return res.redirect(302, `/profile/${encodeURIComponent(row.username)}`);
  }

  return res.sendFile(path.join(__dirname, 'public/artist.html'));
});

// ── 404 ────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => {
  console.log(`\nMMS Gallery running at http://localhost:${PORT}`);
  console.log(`Admin: admin@mmsgallery.edu / admin123\n`);
});
