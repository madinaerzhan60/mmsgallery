// Uses Node.js built-in sqlite (v22.5+) — no native compilation needed!
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Persist database to local file so user accounts and uploads survive server restarts
const dbPath = path.join(__dirname, 'mmsgallery.sqlite');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON');

// ── Schema ────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid        TEXT    UNIQUE NOT NULL,
    name        TEXT    NOT NULL,
    email       TEXT    UNIQUE NOT NULL,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'student',
    major       TEXT,
    year        TEXT,
    bio         TEXT,
    avatar_url  TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS artworks (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid         TEXT    UNIQUE NOT NULL,
    title        TEXT    NOT NULL,
    description  TEXT,
    category     TEXT    NOT NULL,
    tags         TEXT,
    image_url    TEXT,
    file_url     TEXT,
    status       TEXT    NOT NULL DEFAULT 'pending',
    featured     INTEGER NOT NULL DEFAULT 0,
    views        INTEGER NOT NULL DEFAULT 0,
    user_id      INTEGER NOT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS likes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    artwork_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, artwork_id),
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    content    TEXT    NOT NULL,
    user_id    INTEGER NOT NULL,
    artwork_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
  );
`);

// ── Seed default admin ─────────────────────────────────────────
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (uuid, name, email, password, role, major, year, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    uuidv4(), 'Admin', 'admin@mmsgallery.edu', hash, 'admin',
    'Administration', '', 'Gallery administrator'
  );
  console.log('Default admin created: admin@mmsgallery.edu / admin123');
}

// ── Seed sample students and artworks ──────────────────────────
const studentExists = db.prepare('SELECT id FROM users WHERE role = ?').get('student');
if (!studentExists) {
  const studentHash = bcrypt.hashSync('student123', 10);
  
  // Create sample students
  const students = [
    { name: 'Aisha Nurbekova', email: 'aisha@sdu.edu.kz', major: 'Digital Art', year: '3rd Year', bio: 'Passionate about digital illustration and concept art.' },
    { name: 'Timur Kenzhebaev', email: 'timur@sdu.edu.kz', major: 'Photography', year: '4th Year', bio: 'Landscape and portrait photographer.' },
    { name: 'Dana Ospanova', email: 'dana@sdu.edu.kz', major: 'Graphic Design', year: '2nd Year', bio: 'Exploring modern design trends and typography.' },
  ];
  
  const studentIds = [];
  for (const s of students) {
    db.prepare(`INSERT INTO users (uuid, name, email, password, role, major, year, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), s.name, s.email, studentHash, 'student', s.major, s.year, s.bio
    );
    studentIds.push(db.prepare('SELECT id FROM users WHERE email = ?').get(s.email).id);
  }
  
  // Create sample artworks
  const artworks = [
    { title: 'Digital Dreams', description: 'Abstract digital artwork exploring the intersection of technology and imagination.', category: 'digital', tags: 'abstract,digital,colorful', image_url: '/uploads/sample-digital-art.jpg', userId: studentIds[0] },
    { title: 'Mountain Serenity', description: 'Captured during a hiking trip in the Tian Shan mountains.', category: 'photography', tags: 'landscape,nature,mountains', image_url: '/uploads/sample-photography.jpg', userId: studentIds[1] },
    { title: 'Character Study', description: 'Original character illustration exploring modern anime aesthetics.', category: 'illustration', tags: 'character,anime,illustration', image_url: '/uploads/sample-illustration.jpg', userId: studentIds[0] },
    { title: 'Fluid Forms', description: '3D rendered sculpture exploring organic shapes and metallic surfaces.', category: '3d', tags: '3d,sculpture,abstract', image_url: '/uploads/sample-3d-render.jpg', userId: studentIds[2] },
    { title: 'Garden Memories', description: 'Oil painting inspired by impressionist masters.', category: 'painting', tags: 'traditional,impressionist,landscape', image_url: '/uploads/sample-painting.jpg', userId: studentIds[0] },
    { title: 'Type & Space', description: 'Minimalist poster design exploring typography and negative space.', category: 'graphic-design', tags: 'poster,typography,minimal', image_url: '/uploads/sample-graphic-design.jpg', userId: studentIds[2] },
  ];
  
  for (const a of artworks) {
    db.prepare(`INSERT INTO artworks (uuid, title, description, category, tags, image_url, status, featured, views, user_id)
      VALUES (?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?)`).run(
      uuidv4(), a.title, a.description, a.category, a.tags, a.image_url, 
      Math.random() > 0.5 ? 1 : 0, Math.floor(Math.random() * 100), a.userId
    );
  }
  
  console.log('Sample students and artworks created');
}

module.exports = db;
