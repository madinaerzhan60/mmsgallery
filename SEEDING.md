# 🌱 Database Seeding Guide — MMS Gallery

This document explains how to seed the MMS Gallery database with realistic student accounts and their artworks.

---

## 📋 Quick Start

### Option 1: Run the Seed Script (Recommended)

Run the following command from the project root:

```bash
npm run seed
```

This will:
- ✅ Add 10 student accounts (or skip if already exist)
- ✅ Create 25 new artworks across all categories
- ✅ Generate 20-30 follow relationships between students
- ✅ Display statistics on completion

### Option 2: Force Reset (Clear & Reseed)

If you want to clear existing seeded data and start fresh:

```bash
npm run seed:force
```

**⚠️ Warning:** This will delete all artworks and follows (but keeps the admin account). Use with caution!

---

## 📊 Seeded Data Overview

### 10 Student Accounts

All students use password: **`password123`**

| Name | Profession | Year | Open to Work | LinkedIn |
|------|-----------|------|--------------|----------|
| **Aisha Nurbekova** | Graphic Designer | 3rd Year | ✅ Yes | [LinkedIn](https://linkedin.com/in/aisha-nurbekova) |
| **Dana Ospanova** | UX/UI Designer | 2nd Year | ✅ Yes | [LinkedIn](https://linkedin.com/in/dana-ospanova) |
| **Timur Kenzhebaev** | Photographer | 4th Year | ❌ No | — |
| **Madina Bekova** | 3D Modeler | 3rd Year | ✅ Yes | [LinkedIn](https://linkedin.com/in/madina-bekova) |
| **Arman Seitkali** | Game Designer | 2nd Year | ✅ Yes | [LinkedIn](https://linkedin.com/in/arman-seitkali) |
| **Zarina Akhmetova** | 3D/2D Animator | 1st Year | ❌ No | — |
| **Daniyar Mukhanov** | Film Editor | 4th Year | ✅ Yes | [LinkedIn](https://linkedin.com/in/daniyar-mukhanov) |
| **Aliya Sarbassova** | VFX Artist | 3rd Year | ✅ Yes | [LinkedIn](https://linkedin.com/in/aliya-sarbassova) |
| **Bekzat Nurlanov** | Game Artist | 2nd Year | ❌ No | — |
| **Kamila Dzhaksybekova** | Interior & Architecture Designer | 4th Year | ✅ Yes | [LinkedIn](https://linkedin.com/in/kamila-djaksybekova) |

### Artwork Distribution

**25 total artworks** across multiple categories:

- **3D** (8 artworks): Crystal renderings, product visualization, architectural concepts, interior design
- **Photography** (3 artworks): Landscape, street life, sports
- **Game Art** (5 artworks): Pixel art, UI kits, environment concepts, character design
- **UX/UI** (3 artworks): Mobile app, dashboard, game interface
- **Animation** (2 artworks): Bouncing ball, character walk cycles
- **Video** (4 artworks): Cinematic films, documentaries, music videos
- **VFX** (2 artworks): Fire simulation, portal effects
- **Illustration** (2 artworks): Graphics, posters

### Artwork Status

- **51 artworks approved** (visible in gallery)
- **7 artworks pending** (for admin moderation testing)
- **778 total likes** distributed across artwork

---

## 🔑 Test Accounts

### Admin Account
- **Email:** `admin@mmsgallery.edu`
- **Password:** `admin123`
- **Role:** Full admin access

### Student Test Accounts
Use any of the 10 students above with password `password123`

**Example:**
- Email: `aisha@sdu.edu.kz`
- Password: `password123`

---

## 📍 API Endpoints to Test

### Browse Students

```bash
# Top 3 artists by likes
curl http://localhost:4500/api/artists/top

# All students (paginated, with filters)
curl "http://localhost:4500/api/profiles?sort=likes&limit=10"

# Filter by profession
curl "http://localhost:4500/api/profiles?profession=3D%20Modeler"

# Open to work filter
curl "http://localhost:4500/api/profiles?open=1"
```

### Browse Artworks

```bash
# All approved artworks
curl "http://localhost:4500/api/artworks?limit=20"

# Filter by category
curl "http://localhost:4500/api/artworks?category=3D"

# By likes (popular first)
curl "http://localhost:4500/api/artworks?sort=popular&limit=10"
```

### Public Profiles

```bash
# View a student's public profile
curl "http://localhost:4500/api/artists/{uuid}"
```

---

## 🎨 Using Seeded Data for Testing

### Test Login Flow
1. Visit `/` and click "Login"
2. Use any student email + `password123`
3. Verify dashboard loads with their artworks

### Test Gallery Features
1. Visit `/gallery`
2. Filter by category (3D, Photography, etc.)
3. Click artwork to open lightbox detail view
4. (When authenticated) Try the "Following" filter

### Test Artist Directory
1. Visit `/artists`
2. See top 3 artists displayed
3. Filter by profession dropdown
4. Click on an artist card to view their public profile

### Test Recruiter View
1. Visit `/hire`
2. See students marked as "Open to Work" ✅
3. Filter by profession to find specific roles
4. Sort by most liked, most followers

### Test Admin Panel
1. Visit `/admin` and login with `admin@mmsgallery.edu` / `admin123`
2. View student count and artwork statistics
3. See all artworks with approval status
4. Export student list as CSV

---

## 🗄️ Database Structure

After seeding, the database contains:

### Users Table
```
users (12 total: 1 admin + 10 students + existing)
- uuid, name, email, password (hashed), profession, year, bio
- linkedin_url, portfolio_url, is_open_to_work, avatar_url
- language_pref, created_at
- followers/following counts (computed)
```

### Artworks Table
```
artworks (58 total: 33 existing + 25 new seeded)
- uuid, title, description, category, image_url
- status (approved/pending), likes_count, user_id (FK)
- created_at
```

### Follows Table
```
follows (20-30 relationships)
- follower_id, following_id (both FK to users)
- Enables social graph for "Following" feed
```

### Other Tables
- **likes**: Like relationships (user ↔ artwork)
- **notifications**: Activity feed (when users like artworks)
- **feedback**: Contact form submissions
- **comments**: Artwork comments (if implemented)

---

## 🖼️ Image URLs

All seeded artworks use placeholder images from **Picsum Photos**:

```
https://picsum.photos/seed/{artwork-title-slug}/800/600
```

Examples:
- `https://picsum.photos/seed/crystal-sphere/800/600`
- `https://picsum.photos/seed/character-walk-cycle/800/600`
- `https://picsum.photos/seed/almaty-from-above/800/600`

These are deterministic — same title = same image every time.

**To use real images:**
1. Upload artwork images via Settings → Avatar or create upload endpoint
2. Update `image_url` field in database
3. Restart server

---

## 🔄 Re-seeding Without Force

If you run `npm run seed` multiple times:
- ✅ Artworks are always created fresh (no duplicates)
- ✓ Students are recognized by email and skipped if they exist
- ✓ Follow relationships are merged (no duplicates)

To preserve user accounts but refresh artworks/follows:
1. Delete artworks: `DELETE FROM artworks WHERE user_id > 5`
2. Delete follows: `DELETE FROM follows`
3. Run `npm run seed`

---

## 📊 Verification Queries

Check the seeded data using SQLite:

```bash
# Count students
sqlite3 mmsgallery.sqlite "SELECT COUNT(*) FROM users WHERE role='student';"

# Sum of likes
sqlite3 mmsgallery.sqlite "SELECT SUM(likes_count) FROM artworks;"

# Top artist by likes
sqlite3 mmsgallery.sqlite "SELECT u.name, SUM(a.likes_count) as total_likes 
  FROM users u 
  JOIN artworks a ON u.id = a.user_id 
  GROUP BY u.id 
  ORDER BY total_likes DESC LIMIT 1;"

# Follow graph density
sqlite3 mmsgallery.sqlite "SELECT COUNT(*) FROM follows;"
```

---

## ⚙️ Seed.js Details

**Location:** `/Users/madina/Downloads/variable/seed.js`

**What it does:**
1. Reads student data and artwork data from hardcoded arrays
2. Hashes passwords with bcrypt (salt rounds: 10)
3. Inserts users (skips if email exists)
4. Creates artworks with UUIDs and image URLs
5. Generates random follow relationships (2-4 per student)
6. Displays summary stats

**Can be customized:**
- Edit `studentsData` array to add/remove students
- Edit `artworksData` array to adjust artwork list
- Modify follow logic to change relationship density

---

## 🚀 Workflow Example

**First time setup:**

```bash
# 1. Install dependencies
npm install

# 2. Run seed to populate database
npm run seed

# 3. Start the server
npm start

# 4. Open browser to http://localhost:4500
```

**After code changes:**

```bash
# If you changed the seed content, force reset:
npm run seed:force

# If you only changed unrelated code:
npm start  # (just restart, no re-seed needed)
```

---

## 📝 Common Issues

### ❌ "UNIQUE constraint failed: users.email"
**Cause:** Students already exist in database
**Solution:** Use `npm run seed:force` to reset, or just ignore (script handles it gracefully)

### ❌ "no such column: X"
**Cause:** Database schema doesn't match seeder expectations
**Solution:** Ensure `database.js` has been migrated with all latest schema changes

### ❌ "address already in use"
**Cause:** Port 4500 is taken by another process
**Solution:** Use `PORT=4501 npm start` or kill existing process

### ❌ Images not loading
**Cause:** Picsum.photos might be unavailable
**Solution:** Either wait/retry or use local image paths instead

---

## 🎓 Learning Resources

- **SQLite basics:** [SQLite Docs](https://www.sqlite.org/docs.html)
- **Node.js DatabaseSync:** [Node.js Built-in SQLite](https://nodejs.org/api/sqlite.html)
- **bcryptjs:** [bcryptjs NPM](https://www.npmjs.com/package/bcryptjs)
- **UUID generation:** [uuid NPM](https://www.npmjs.com/package/uuid)

---

## 📞 Support

If you encounter issues with seeding:

1. Check logs: `npm run seed` will show warnings/errors
2. Verify database: `sqlite3 mmsgallery.sqlite "SELECT COUNT(*) FROM users;"`
3. Check schema: `sqlite3 mmsgallery.sqlite ".schema users"`
4. Try force reset: `npm run seed:force`

---

**Last Updated:** April 6, 2026  
**Seed Version:** 1.0 (10 students, 25 artworks, realistic social graph)
