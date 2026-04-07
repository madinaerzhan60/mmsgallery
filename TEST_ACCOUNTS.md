# 👤 Test Accounts Reference

## 🔐 Admin Account
```
Email:    admin@mmsgallery.edu
Password: admin123
Role:     Full administrator access
```

## 👥 Student Accounts
All students use password: **`password123`**

### Profile Specialists
| Email | Name | Profession | Open to Work |
|-------|------|------------|--------------|
| aisha@sdu.edu.kz | Aisha Nurbekova | Graphic Designer | ✅ |
| dana@sdu.edu.kz | Dana Ospanova | UX/UI Designer | ✅ |
| timur@sdu.edu.kz | Timur Kenzhebaev | Photographer | ❌ |
| madina@sdu.edu.kz | Madina Bekova | 3D Modeler | ✅ |
| arman@sdu.edu.kz | Arman Seitkali | Game Designer | ✅ |

### More Students (Scroll for full list)
| Email | Name | Profession | Open to Work |
|-------|------|------------|--------------|
| zarina@sdu.edu.kz | Zarina Akhmetova | 3D/2D Animator | ❌ |
| daniyar@sdu.edu.kz | Daniyar Mukhanov | Film Editor | ✅ |
| aliya@sdu.edu.kz | Aliya Sarbassova | VFX Artist | ✅ |
| bekzat@sdu.edu.kz | Bekzat Nurlanov | Game Artist | ❌ |
| kamila@sdu.edu.kz | Kamila Dzhaksybekova | Interior & Architecture Designer | ✅ |

---

## 🚀 Quick Login Test

```bash
# Example using curl to get auth token
curl -X POST http://localhost:4500/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aisha@sdu.edu.kz",
    "password": "password123"
  }'

# Response contains token and user object
```

---

## 📊 Database Stats

After running `npm run seed`:

- **Total Students:** 10
- **Total Artworks:** 58 (25 newly seeded)
- **Approved Artworks:** 51
- **Pending Artworks:** 7
- **Total Likes:** 778+
- **Follow Relationships:** 49+

---

## 🎨 Key Pages to Test

| Page | URL | Login Required |
|------|-----|-----------------|
| Home | / | No |
| Gallery | /gallery | No |
| Artists Directory | /artists | No |
| Hire/Recruiter | /hire | No |
| User Settings | /settings | **Yes** |
| Admin Dashboard | /admin | **Yes (Admin)** |

---

**Password reminder:** All students = `password123` | Admin = `admin123`
