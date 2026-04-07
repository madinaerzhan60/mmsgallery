# 🚀 Quick Start Guide

See the full project description in [PROJECT_DESCRIPTION.md](PROJECT_DESCRIPTION.md).

## Project Overview

**MMS Gallery** is a student art portfolio platform with:
- ✅ **Database**: 10 seeded students + 25 artworks
- ✅ **Design**: Avant-garde editorial aesthetic (high contrast, minimal UI)
- ✅ **APIs**: Frontend data integration via `/api/` routes
- ✅ **Auth**: Student login system with role-based access

---

## 📦 What's Available

### Database
```bash
npm run seed          # Populate with test data
npm run seed:force    # Clear & re-populate
```

**Test Accounts:**
- Admin: `admin@mmsgallery.edu` / `admin123`
- Students: See `TEST_ACCOUNTS.md` (all use `password123`)

### Server
```bash
npm start             # Launch on port 4503
```

### Files You'll Want to Read

| File | Purpose |
|------|---------|
| `SEEDING.md` | Complete database population details + statistics |
| `TEST_ACCOUNTS.md` | Quick reference for all test login credentials |
| `DESIGN_SYSTEM.md` | Complete design philosophy, colors, typography, components |
| `public/css/theme.css` | 900+ lines of editorial design system |

---

## 🎨 Design Overview

### Color Palette _(High Contrast)_
```
Primary Background:  #f5f4f0 (warm white/paper)
Dark Background:     #0d0d0d (near black)
Text Color:          #111111 (almost black)
Accent Color:        #2563eb (electric blue - brand only)
Rule/Dividers:       #d0cfc9 (subtle gray lines)
```

### Typography Stack
- **Headlines**: Playfair Display (serif, bold)
- **Body**: Inter (neutral sans-serif)
- **UI Labels**: Space Grotesk (grotesque, uppercase, tracked)
- All fonts loaded from Google Fonts

### Design Rules
✅ **Sharp corners only** (no border-radius)  
✅ **1px borders as design elements** (no shadows)  
✅ **Flat colors only** (no gradients)  
✅ **Generous whitespace** (brutalist spacing)  
✅ **Minimal UI chrome** (text underlines, not pills)  

---

## 📂 Project Structure

```
/public
  ├── index.html              ← Homepage (redesigned ✨)
  ├── gallery.html            ← Gallery view
  ├── artists.html            ← Artist showcase
  ├── hire.html               ← Open to Work
  ├── admin.html              ← Admin panel
  ├── css/
  │   └── theme.css           ← Editorial design system (900+ lines)
  ├── js/
  │   └── app.js              ← API utilities & init scripts
  └── uploads/                ← User image storage

/routes
  ├── api.js                  ← Core API endpoints
  ├── auth.js                 ← Authentication routes
  └── artworks.js             ← Artwork CRUD operations

/middleware
  └── auth.js                 ← JWT verification & role checking

database.js                   ← SQLite connection & schema
server.js                     ← Express server setup
seed.js                       ← Database seeding script
package.json                  ← Dependencies & scripts
```

---

## 🔌 Available API Endpoints

### Public Routes
```
GET  /api/artworks              ← All artworks (filterable by category, status, limit)
GET  /api/artworks/:id          ← Single artwork details
GET  /api/artists/top           ← Top 3 artists by likes/follows
GET  /api/profiles/:id          ← User profile with stats
```

### Authenticated Routes (JWT required)
```
POST /api/artworks              ← Create new artwork
PUT  /api/artworks/:id          ← Update artwork
DELETE /api/artworks/:id        ← Delete artwork
POST /api/artworks/:id/like     ← Like/unlike artwork
GET  /api/user/dashboard        ← Current user dashboard data
POST /api/follow/:userId        ← Follow/unfollow user
```

### Auth Routes
```
POST /auth/register             ← Sign up new student
POST /auth/login                ← Login (returns JWT)
POST /auth/logout               ← Logout
GET  /auth/me                   ← Current user info
```

---

## 🎯 Next Steps

### 1. Start the Server
```bash
npm start
# Server runs on http://localhost:4503
```

### 2. Seed the Database _(if needed)_
```bash
npm run seed
# ✅ Inserts 10 students, 25 artworks, 49 follows
```

### 3. Test the Design
Open in browser:
- **Homepage**: http://localhost:4503/
- **Gallery**: http://localhost:4503/gallery
- **Artists**: http://localhost:4503/artists
- **Admin**: http://localhost:4503/admin

### 4. Verify Data
Test API endpoints:
```bash
# Get all artworks
curl http://localhost:4503/api/artworks

# Get top artists
curl http://localhost:4503/api/artists/top

# Get specific profile
curl http://localhost:4503/api/profiles/1
```

---

## 🔐 Authentication

Login to access protected features:

```javascript
// Frontend login example
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'student@example.com',
    password: 'password123'
  })
});
const { token } = await response.json();
localStorage.setItem('token', token);

// Auto-attached to all subsequent /api/ requests via app.js
```

---

## 📊 Database Structure

### Users Table
- `id` (UUID)
- `name`, `email`, `password` (hashed)
- `profession`, `year`, `bio`
- `linkedin_url`, `avatar_url`
- `is_open_to_work` (boolean)
- `role` (student|admin)
- `created_at`, `updated_at`

### Artworks Table
- `id` (UUID)
- `user_id` (foreign key)
- `title`, `description`, `category`
- `image_url`, `status` (approved|pending)
- `likes_count`, `views_count`
- `created_at`, `updated_at`

### Follows Table
- `id` (UUID)
- `follower_id`, `following_id` (both user_ids)
- `created_at`

### Likes Table
- `id` (UUID)
- `user_id`, `artwork_id`
- `created_at`

---

## 🛠️ Development

### Install Dependencies
```bash
npm install
```

### Environment Variables
```env
# .env (create if needed)
PORT=4503
DATABASE_URL=./database.db
JWT_SECRET=your-secret-key-here
NODE_ENV=development

```

Contact form submissions are stored in the admin feedback inbox at `/admin` → `Feedback`.

### Database Reset
```bash
rm database.db       # Delete existing database
npm run seed         # Reseed with fresh data
```

### Debug Mode
```bash
DEBUG=* npm start    # Enable verbose logging
```

---

## 🎨 Design Customization

All design variables are in `/public/css/theme.css`:

```css
:root {
  /* Colors */
  --color-bg: #f5f4f0;
  --color-bg-dark: #0d0d0d;
  --color-text: #111111;
  --color-accent: #2563eb;
  
  /* Spacing */
  --space-xs: 8px;
  --space-md: 32px;
  --space-lg: 64px;
  
  /* Typography */
  --font-display: 'Playfair Display', serif;
  --font-body: 'Inter', system-ui;
}
```

To customize:
1. Edit color hex values
2. Change font families (with @import statements)
3. Adjust spacing multipliers
4. Modify breakpoints in @media queries

All changes apply globally to all pages.

---

## 📱 Responsive Design

### Breakpoints
- **Desktop**: 1280px+ (4-column layouts)
- **Tablet**: 768px–1279px (2-column layouts)
- **Mobile**: <768px (1-column, touch-friendly)

Test responsiveness:
```bash
# Browser DevTools → Toggle Device Toolbar (Cmd+Shift+M on Mac)
# Or test with: curl http://localhost:4503/ | grep "@media"
```

---

## 📚 Documentation Files

| File | Contents |
|------|----------|
| `SEEDING.md` | 350+ lines on database population, student roster, artwork distribution, API testing |
| `TEST_ACCOUNTS.md` | Quick login credentials table |
| `DESIGN_SYSTEM.md` | 200+ lines describing design philosophy, colors, typography, components, inspiration |
| `README.md` | ← You are here |

---

## ✅ Verification Checklist

Before going live:

- [ ] Server starts without errors: `npm start`
- [ ] Database seeded with 10 students: `npm run seed`
- [ ] Homepage loads at http://localhost:4503/
- [ ] Gallery, Artists, Admin pages display correctly
- [ ] Design is high-contrast, minimal-UI ✨
- [ ] Test login works (use credentials from `TEST_ACCOUNTS.md`)
- [ ] API endpoints return correct data
- [ ] Pages are responsive on mobile

---

## 🐛 Troubleshooting

**Server won't start:**
```bash
# Check port 4503 is free
lsof -i :4503
kill -9 <PID>

# Or use different port:
PORT=3000 npm start
```

**Database locked:**
```bash
rm database.db-shm database.db-wal
npm run seed
```

**Design looks broken:**
- Clear browser cache (Cmd+Shift+R)
- Check CSS is loading: `curl http://localhost:4503/css/theme.css | head -20`

**Seeds won't insert:**
```bash
npm run seed:force   # Clears duplicates and restarts
```

---

## 🎉 You're All Set!

Your avant-garde editorial gallery is ready to showcase student creativity. The design is bold, minimal, and uncompromising. The data is seeded and ready. Now it's time to explore, customize, and deploy.

**Questions?** Check `DESIGN_SYSTEM.md` for detailed design documentation or refer to individual files for code specifics.

Happy creating! 🚀

---

**Last Updated:** April 6, 2026  
**Status:** Production Ready ✅
