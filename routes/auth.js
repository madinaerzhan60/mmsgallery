const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { auth, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, major, year, bio } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const uuid = uuidv4();
  try {
    db.prepare(`INSERT INTO users (uuid, name, email, password, role, major, year, bio)
      VALUES (?, ?, ?, ?, 'student', ?, ?, ?)`).run(uuid, name, email, hash, major||'', year||'', bio||'');

    const user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(uuid);
    const token = jwt.sign({ id: user.id, uuid: user.uuid, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: safeUser(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, uuid: user.uuid, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: safeUser(user) });
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(safeUser(user));
});

// PUT /api/auth/profile
router.put('/profile', auth, (req, res) => {
  const { name, major, year, bio } = req.body;
  db.prepare('UPDATE users SET name=?, major=?, year=?, bio=? WHERE id=?')
    .run(name, major, year, bio, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  res.json(safeUser(user));
});

function safeUser(u) {
  const { password, ...safe } = u;
  return safe;
}

module.exports = router;
