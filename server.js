require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { usePg, ensurePgSchema } = require('./pg');

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

function renderIndexForRequest() {
  const indexPath = path.join(__dirname, 'public/index.html');
  return fs.readFileSync(indexPath, 'utf8').replace('<!--SSR_PERSONAL_HERO-->', '');
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
app.get('/', (req, res) => res.send(renderIndexForRequest()));
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
app.get('/profile/:uuid', (req, res) => res.sendFile(path.join(__dirname, 'public/artist.html')));

// ── 404 ────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

async function start() {
  if (!usePg) {
    console.error('DATABASE_URL is required. Server is configured for PostgreSQL-only startup.');
    process.exit(1);
  }

  const schemaReady = await ensurePgSchema();
  if (!schemaReady) {
    console.error('Failed to ensure Supabase schema. Check DATABASE_URL and permissions.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\nMMS Gallery running at http://localhost:${PORT}`);
    console.log('PostgreSQL schema ready (public.users).\n');
  });
}

start();
