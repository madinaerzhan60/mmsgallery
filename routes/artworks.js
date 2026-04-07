const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const isVercel = Boolean(process.env.VERCEL);
const supabaseDbUrl = (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '').trim();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'media';
const usePg = Boolean(supabaseDbUrl);
const pgPool = usePg
  ? new Pool({
      connectionString: supabaseDbUrl,
      ssl: { rejectUnauthorized: false }
    })
  : null;
const supabaseEnabled = Boolean(supabaseUrl && supabaseServiceRoleKey);
const supabase = supabaseEnabled
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!isVercel) {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (error) {
    console.warn('[artwork-upload] Failed to prepare uploads directory:', error.message);
  }
}

// Multer config
const storage = isVercel
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadsDir),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, uuidv4() + ext);
      }
    });
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|pdf/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

function extForFile(file) {
  const guessed = path.extname(file.originalname || '').toLowerCase();
  if (guessed) return guessed;
  if ((file.mimetype || '').includes('png')) return '.png';
  if ((file.mimetype || '').includes('webp')) return '.webp';
  if ((file.mimetype || '').includes('gif')) return '.gif';
  if ((file.mimetype || '').includes('jpeg') || (file.mimetype || '').includes('jpg')) return '.jpg';
  if ((file.mimetype || '').includes('mp4')) return '.mp4';
  if ((file.mimetype || '').includes('quicktime')) return '.mov';
  return '.bin';
}

function extFromMimeOrName(mimeType = '', fileName = '') {
  const byName = path.extname(String(fileName || '')).toLowerCase();
  if (byName) return byName;
  const type = String(mimeType || '').toLowerCase();
  if (type.includes('png')) return '.png';
  if (type.includes('webp')) return '.webp';
  if (type.includes('gif')) return '.gif';
  if (type.includes('jpeg') || type.includes('jpg')) return '.jpg';
  if (type.includes('mp4')) return '.mp4';
  if (type.includes('quicktime')) return '.mov';
  return '.bin';
}

async function uploadToStorage(file, folder) {
  if (!supabase) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for cloud uploads.');
  }

  const objectPath = `${folder}/${uuidv4()}${extForFile(file)}`;
  const { error: uploadError } = await supabase.storage
    .from(storageBucket)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype || 'application/octet-stream',
      upsert: false,
      cacheControl: '3600'
    });

  if (uploadError) throw new Error(uploadError.message || 'Failed to upload file to storage.');

  const { data } = supabase.storage.from(storageBucket).getPublicUrl(objectPath);
  return data.publicUrl;
}

// POST /api/artworks/upload-url (auth)
router.post('/upload-url', auth, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        error: 'Cloud upload is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'
      });
    }

    const kind = String(req.body.kind || '').toLowerCase();
    const mimeType = String(req.body.mimeType || 'application/octet-stream');
    const fileName = String(req.body.fileName || 'file.bin');
    if (kind !== 'image' && kind !== 'video') {
      return res.status(400).json({ error: 'kind must be image or video' });
    }

    const folder = kind === 'video' ? 'videos' : 'images';
    const objectPath = `${folder}/${uuidv4()}${extFromMimeOrName(mimeType, fileName)}`;
    const { data, error } = await supabase.storage.from(storageBucket).createSignedUploadUrl(objectPath);
    if (error || !data?.signedUrl) {
      return res.status(500).json({ error: error?.message || 'Failed to create signed upload URL.' });
    }

    const { data: publicData } = supabase.storage.from(storageBucket).getPublicUrl(objectPath);
    return res.json({
      uploadUrl: data.signedUrl,
      publicUrl: publicData.publicUrl,
      objectPath,
      bucket: storageBucket
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create upload URL' });
  }
});

function withStats(artwork) {
  const likesFromTable = db.prepare('SELECT COUNT(*) as c FROM likes WHERE artwork_id=?').get(artwork.id).c;
  const likes = Number(artwork.likes_count || 0) > likesFromTable ? Number(artwork.likes_count || 0) : likesFromTable;
  const comments = db.prepare('SELECT COUNT(*) as c FROM comments WHERE artwork_id=?').get(artwork.id).c;
  const author = db.prepare('SELECT id,uuid,username,name,COALESCE(profession, major) as major,year,avatar_url FROM users WHERE id=?').get(artwork.user_id);
  return {
    ...artwork,
    likes,
    comments,
    author,
    tags: artwork.tags ? artwork.tags.split(',') : []
  };
}

function mergeArtworkRows(primaryRows, secondaryRows) {
  const merged = new Map();
  for (const row of [...secondaryRows, ...primaryRows]) {
    if (!row?.uuid) continue;
    merged.set(String(row.uuid), row);
  }
  return Array.from(merged.values()).sort((a, b) => {
    const at = new Date(a.created_at || 0).getTime();
    const bt = new Date(b.created_at || 0).getTime();
    return bt - at;
  });
}

async function withStatsPg(artwork) {
  const commentsRow = await pgPool.query('SELECT COUNT(*)::int AS c FROM comments WHERE artwork_id=$1', [artwork.id]);
  const authorRow = await pgPool.query(
    'SELECT id, uuid, username, name, COALESCE(profession, major) as major, year, avatar_url FROM users WHERE id=$1 LIMIT 1',
    [artwork.user_id]
  );
  return {
    ...artwork,
    likes: Number(artwork.likes_count || 0),
    comments: Number(commentsRow.rows[0]?.c || 0),
    author: authorRow.rows[0] || null,
    tags: artwork.tags ? String(artwork.tags).split(',') : []
  };
}

// GET /api/artworks  (public, approved)
router.get('/', async (req, res) => {
  const { category, search, featured, page = 1, limit = 20 } = req.query;

  if (usePg) {
    try {
      const params = [];
      let idx = 1;
      let query = `SELECT a.* FROM artworks a WHERE a.status='approved'`;
      if (category && category !== 'all') {
        query += ` AND LOWER(a.category)=LOWER($${idx++})`;
        params.push(category);
      }
      if (featured) query += ' AND a.featured=1';
      if (search) {
        query += ` AND (a.title ILIKE $${idx++} OR a.description ILIKE $${idx++})`;
        params.push(`%${search}%`, `%${search}%`);
      }
      query += ` ORDER BY a.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(Number(limit), (Number(page) - 1) * Number(limit));

      const result = await pgPool.query(query, params);
      const pgRows = await Promise.all(result.rows.map((row) => withStatsPg(row)));
      const sqliteRows = db.prepare(`SELECT a.* FROM artworks a WHERE a.status='approved'`).all();
      const localRows = sqliteRows.map(withStats);
      return res.json(mergeArtworkRows(pgRows, localRows));
    } catch (error) {
      const fallbackRows = db.prepare(query.replace(/\$\d+/g, '?')).all(...params).map(withStats);
      return res.json(fallbackRows);
    }
  }

  let query = `SELECT a.* FROM artworks a WHERE a.status='approved'`;
  const params = [];
  if (category && category !== 'all') { query += ` AND LOWER(a.category)=LOWER(?)`; params.push(category); }
  if (featured) { query += ` AND a.featured=1`; }
  if (search) { query += ` AND (a.title LIKE ? OR a.description LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const rows = db.prepare(query).all(...params);
  res.json(rows.map(withStats));
});

// GET /api/artworks/user/mine  (auth)
router.get('/user/mine', auth, (req, res) => {
  if (usePg) {
    (async () => {
      const result = await pgPool.query(
        `SELECT a.*
         FROM artworks a
         LEFT JOIN users u ON u.id = a.user_id
         WHERE a.user_id = $1 OR u.uuid = $2
         ORDER BY a.created_at DESC`,
        [req.user.id, req.user.uuid]
      );
      const pgRows = await Promise.all(result.rows.map((row) => withStatsPg(row)));
      const sqliteRows = db.prepare(
        `SELECT a.*
         FROM artworks a
         LEFT JOIN users u ON u.id = a.user_id
         WHERE a.user_id = ? OR u.uuid = ?
         ORDER BY a.created_at DESC`
      ).all(req.user.id, req.user.uuid).map(withStats);
      return res.json(mergeArtworkRows(pgRows, sqliteRows));
    })().catch(() => {
      const rows = db.prepare(
        `SELECT a.*
         FROM artworks a
         LEFT JOIN users u ON u.id = a.user_id
         WHERE a.user_id = ? OR u.uuid = ?
         ORDER BY a.created_at DESC`
      ).all(req.user.id, req.user.uuid);
      return res.json(rows.map(withStats));
    });
    return;
  }

  const rows = db.prepare(
    `SELECT a.*
     FROM artworks a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE a.user_id = ? OR u.uuid = ?
     ORDER BY a.created_at DESC`
  ).all(req.user.id, req.user.uuid);
  res.json(rows.map(withStats));
});

// GET /api/artworks/:uuid
router.get('/:uuid', (req, res) => {
  if (usePg) {
    (async () => {
      try {
        const found = await pgPool.query('SELECT * FROM artworks WHERE uuid=$1 LIMIT 1', [req.params.uuid]);
        const a = found.rows[0] || db.prepare('SELECT * FROM artworks WHERE uuid=?').get(req.params.uuid);
        if (!a) return res.status(404).json({ error: 'Not found' });
        if (found.rows[0]) {
          await pgPool.query('UPDATE artworks SET views=COALESCE(views,0)+1 WHERE id=$1', [a.id]);
          const full = await withStatsPg(a);
          return res.json({ ...full, liked: false });
        }
        db.prepare('UPDATE artworks SET views=views+1 WHERE id=?').run(a.id);
        return res.json({ ...withStats(a), liked: false });
      } catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to load artwork' });
      }
    })();
    return;
  }

  const a = db.prepare('SELECT * FROM artworks WHERE uuid=?').get(req.params.uuid);
  if (!a) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE artworks SET views=views+1 WHERE id=?').run(a.id);
  const liked = req.headers.authorization
    ? !!db.prepare('SELECT 1 FROM likes WHERE user_id=(SELECT id FROM users WHERE uuid=?) AND artwork_id=?')
        .get(req.headers.authorization.includes('Bearer') ? req.headers.authorization.slice(7) : '', a.id)
    : false;
  res.json({ ...withStats(a), liked });
});

// POST /api/artworks  (auth)
router.post('/', auth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'file', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    if (!title || !category) return res.status(400).json({ error: 'Title and category required' });

    const directImageUrl = String(req.body.image_url || '').trim() || null;
    const directFileUrl = String(req.body.file_url || '').trim() || null;
    const directFileType = String(req.body.file_type || '').trim().toLowerCase();

    let image_url = null;
    let file_url = null;

    if (directImageUrl || directFileUrl) {
      image_url = directImageUrl;
      file_url = directFileUrl;
    } else if (req.files?.image) {
      image_url = isVercel
        ? await uploadToStorage(req.files.image[0], 'images')
        : `/uploads/${req.files.image[0].filename}`;
    }

    if (req.files?.file) {
      file_url = isVercel
        ? await uploadToStorage(req.files.file[0], 'videos')
        : `/uploads/${req.files.file[0].filename}`;
    }

    const fileType = directFileType || (file_url ? 'video' : 'image');
    const uuid = uuidv4();

    if (usePg) {
      await pgPool.query(
        `INSERT INTO artworks (uuid, title, description, category, tags, image_url, file_url, thumbnail_url, file_type, status, user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10)`,
        [
          uuid,
          title,
          description || '',
          category,
          tags || '',
          image_url,
          file_url,
          image_url,
          fileType,
          req.user.id
        ]
      );
      const saved = await pgPool.query('SELECT * FROM artworks WHERE uuid=$1 LIMIT 1', [uuid]);
      return res.status(201).json(await withStatsPg(saved.rows[0]));
    }

    db.prepare(`
      INSERT INTO artworks (uuid, title, description, category, tags, image_url, file_url, thumbnail_url, file_type, status, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      uuid,
      title,
      description || '',
      category,
      tags || '',
      image_url,
      file_url,
      image_url,
      fileType,
      req.user.id
    );

    const artwork = db.prepare('SELECT * FROM artworks WHERE uuid=?').get(uuid);
    res.status(201).json(withStats(artwork));
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to upload artwork' });
  }
});

// PUT /api/artworks/:uuid  (owner or admin)
router.put('/:uuid', auth, upload.fields([{ name: 'image', maxCount: 1 }]), async (req, res) => {
  const a = usePg
    ? (await pgPool.query('SELECT * FROM artworks WHERE uuid=$1 LIMIT 1', [req.params.uuid])).rows[0]
    : db.prepare('SELECT * FROM artworks WHERE uuid=?').get(req.params.uuid);
  if (!a) return res.status(404).json({ error: 'Not found' });
  if (a.user_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });

  const { title, description, category, tags, status, featured } = req.body;
  const image_url = req.files?.image
    ? (isVercel
      ? await uploadToStorage(req.files.image[0], 'images')
      : `/uploads/${req.files.image[0].filename}`)
    : a.image_url;

  if (usePg) {
    await pgPool.query(
      `UPDATE artworks
       SET title=$1, description=$2, category=$3, tags=$4, image_url=$5,
           thumbnail_url=COALESCE($6, thumbnail_url),
           status=COALESCE($7, status),
           featured=COALESCE($8, featured)
       WHERE uuid=$9`,
      [
        title || a.title,
        description || a.description,
        category || a.category,
        tags || a.tags,
        image_url,
        image_url,
        status || null,
        featured != null ? Number(featured) : null,
        req.params.uuid
      ]
    );
    const updated = await pgPool.query('SELECT * FROM artworks WHERE uuid=$1 LIMIT 1', [req.params.uuid]);
    return res.json(await withStatsPg(updated.rows[0]));
  }

  db.prepare(`UPDATE artworks SET title=?,description=?,category=?,tags=?,image_url=?,
    thumbnail_url=COALESCE(?, thumbnail_url), status=COALESCE(?,status), featured=COALESCE(?,featured) WHERE uuid=?`)
    .run(title||a.title, description||a.description, category||a.category, tags||a.tags,
      image_url, image_url, status||null, featured!=null?Number(featured):null, req.params.uuid);

  res.json(withStats(db.prepare('SELECT * FROM artworks WHERE uuid=?').get(req.params.uuid)));
});

// DELETE /api/artworks/:uuid
router.delete('/:uuid', auth, (req, res) => {
  if (usePg) {
    (async () => {
      const a = (await pgPool.query('SELECT * FROM artworks WHERE uuid=$1 LIMIT 1', [req.params.uuid])).rows[0];
      if (!a) return res.status(404).json({ error: 'Not found' });
      if (a.user_id !== req.user.id && req.user.role !== 'admin')
        return res.status(403).json({ error: 'Forbidden' });
      await pgPool.query('DELETE FROM artworks WHERE uuid=$1', [req.params.uuid]);
      return res.json({ ok: true });
    })().catch((error) => res.status(500).json({ error: error.message || 'Failed to delete artwork' }));
    return;
  }

  const a = db.prepare('SELECT * FROM artworks WHERE uuid=?').get(req.params.uuid);
  if (!a) return res.status(404).json({ error: 'Not found' });
  if (a.user_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM artworks WHERE uuid=?').run(req.params.uuid);
  res.json({ ok: true });
});

// POST /api/artworks/:uuid/like
router.post('/:uuid/like', auth, (req, res) => {
  if (usePg) {
    (async () => {
      const found = await pgPool.query('SELECT id FROM artworks WHERE uuid=$1 LIMIT 1', [req.params.uuid]);
      const a = found.rows[0];
      if (!a) return res.status(404).json({ error: 'Not found' });
      const existing = await pgPool.query('SELECT id FROM likes WHERE user_id=$1 AND artwork_id=$2 LIMIT 1', [req.user.id, a.id]);
      if (existing.rows[0]) {
        await pgPool.query('DELETE FROM likes WHERE user_id=$1 AND artwork_id=$2', [req.user.id, a.id]);
        const likesRow = await pgPool.query('SELECT COUNT(*)::int as c FROM likes WHERE artwork_id=$1', [a.id]);
        const likes = Number(likesRow.rows[0]?.c || 0);
        await pgPool.query('UPDATE artworks SET likes_count=$1 WHERE id=$2', [likes, a.id]);
        return res.json({ liked: false, likes });
      }
      await pgPool.query('INSERT INTO likes (user_id, artwork_id) VALUES ($1,$2)', [req.user.id, a.id]);
      const likesRow = await pgPool.query('SELECT COUNT(*)::int as c FROM likes WHERE artwork_id=$1', [a.id]);
      const likes = Number(likesRow.rows[0]?.c || 0);
      await pgPool.query('UPDATE artworks SET likes_count=$1 WHERE id=$2', [likes, a.id]);
      const owner = await pgPool.query('SELECT user_id FROM artworks WHERE id=$1', [a.id]);
      if (owner.rows[0] && owner.rows[0].user_id !== req.user.id) {
        await pgPool.query(
          'INSERT INTO notifications (user_id, type, from_user_id, artwork_id) VALUES ($1, $2, $3, $4)',
          [owner.rows[0].user_id, 'like', req.user.id, a.id]
        );
      }
      return res.json({ liked: true, likes });
    })().catch((error) => res.status(500).json({ error: error.message || 'Failed to like artwork' }));
    return;
  }

  const a = db.prepare('SELECT id FROM artworks WHERE uuid=?').get(req.params.uuid);
  if (!a) return res.status(404).json({ error: 'Not found' });
  const existing = db.prepare('SELECT id FROM likes WHERE user_id=? AND artwork_id=?').get(req.user.id, a.id);
  if (existing) {
    db.prepare('DELETE FROM likes WHERE user_id=? AND artwork_id=?').run(req.user.id, a.id);
    const likes = db.prepare('SELECT COUNT(*) as c FROM likes WHERE artwork_id=?').get(a.id).c;
    db.prepare('UPDATE artworks SET likes_count=? WHERE id=?').run(likes, a.id);
    res.json({ liked: false, likes });
  } else {
    db.prepare('INSERT INTO likes (user_id, artwork_id) VALUES (?,?)').run(req.user.id, a.id);
    const likes = db.prepare('SELECT COUNT(*) as c FROM likes WHERE artwork_id=?').get(a.id).c;
    db.prepare('UPDATE artworks SET likes_count=? WHERE id=?').run(likes, a.id);
    const owner = db.prepare('SELECT user_id FROM artworks WHERE id=?').get(a.id);
    if (owner && owner.user_id !== req.user.id) {
      db.prepare('INSERT INTO notifications (user_id, type, from_user_id, artwork_id) VALUES (?, ?, ?, ?)')
        .run(owner.user_id, 'like', req.user.id, a.id);
    }
    res.json({ liked: true, likes });
  }
});

// GET /api/artworks/:uuid/comments
router.get('/:uuid/comments', (req, res) => {
  if (usePg) {
    (async () => {
      const found = await pgPool.query('SELECT id FROM artworks WHERE uuid=$1 LIMIT 1', [req.params.uuid]);
      const a = found.rows[0];
      if (!a) return res.status(404).json({ error: 'Not found' });
      const comments = await pgPool.query(
        `SELECT c.*, u.name, u.avatar_url
         FROM comments c
         JOIN users u ON c.user_id=u.id
         WHERE c.artwork_id=$1
         ORDER BY c.created_at DESC`,
        [a.id]
      );
      return res.json(comments.rows);
    })().catch((error) => res.status(500).json({ error: error.message || 'Failed to load comments' }));
    return;
  }

  const a = db.prepare('SELECT id FROM artworks WHERE uuid=?').get(req.params.uuid);
  if (!a) return res.status(404).json({ error: 'Not found' });
  const comments = db.prepare(`SELECT c.*, u.name, u.avatar_url FROM comments c
    JOIN users u ON c.user_id=u.id WHERE c.artwork_id=? ORDER BY c.created_at DESC`).all(a.id);
  res.json(comments);
});

// POST /api/artworks/:uuid/comments
router.post('/:uuid/comments', auth, (req, res) => {
  if (usePg) {
    (async () => {
      const { content } = req.body;
      if (!content) return res.status(400).json({ error: 'Content required' });
      const found = await pgPool.query('SELECT id FROM artworks WHERE uuid=$1 LIMIT 1', [req.params.uuid]);
      const a = found.rows[0];
      if (!a) return res.status(404).json({ error: 'Not found' });
      await pgPool.query('INSERT INTO comments (content, user_id, artwork_id) VALUES ($1,$2,$3)', [content, req.user.id, a.id]);
      return res.status(201).json({ ok: true });
    })().catch((error) => res.status(500).json({ error: error.message || 'Failed to post comment' }));
    return;
  }

  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  const a = db.prepare('SELECT id FROM artworks WHERE uuid=?').get(req.params.uuid);
  if (!a) return res.status(404).json({ error: 'Not found' });
  db.prepare('INSERT INTO comments (content, user_id, artwork_id) VALUES (?,?,?)').run(content, req.user.id, a.id);
  res.status(201).json({ ok: true });
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File is too large. Maximum size is 100MB.' });
    }
    return res.status(400).json({ error: err.message || 'Upload error' });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'Upload error' });
  }
  return next();
});

module.exports = router;
