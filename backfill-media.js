#!/usr/bin/env node
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'mmsgallery.sqlite');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  UPDATE artworks
  SET
    file_type = COALESCE(
      NULLIF(file_type, ''),
      CASE
        WHEN LOWER(COALESCE(file_url, '')) LIKE '%.mp4'
          OR LOWER(COALESCE(file_url, '')) LIKE '%.mov'
          OR LOWER(COALESCE(file_url, '')) LIKE '%.webm'
          OR LOWER(COALESCE(file_url, '')) LIKE '%.avi'
        THEN 'video'
        ELSE 'image'
      END
    ),
    thumbnail_url = COALESCE(NULLIF(thumbnail_url, ''), image_url)
`);

const rows = db.prepare(`
  SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN file_type = 'video' THEN 1 ELSE 0 END) AS videos,
    SUM(CASE WHEN file_type = 'image' THEN 1 ELSE 0 END) AS images
  FROM artworks
`).get();

console.log(`Updated ${rows.total} artworks (${rows.images || 0} images, ${rows.videos || 0} videos).`);
