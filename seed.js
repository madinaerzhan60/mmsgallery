#!/usr/bin/env node
/**
 * Seed the MMS Gallery database with 20 student accounts and their artworks
 * Usage: node seed.js [--force]
 * Use --force flag to clear and reseed everything
 */

const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = path.join(__dirname, 'mmsgallery.sqlite');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');

const FORCE_RESEED = process.argv.includes('--force');

// Student accounts to seed
const studentsData = [
  {
    name: "Aisha Nurbekova",
    gender: "female",
    email: "aisha@sdu.edu.kz",
    profession: "Graphic Designer",
    year: "3rd Year",
    bio: "Passionate about branding and visual identity. Love mixing traditional art with digital tools.",
    linkedin_url: "https://linkedin.com/in/aisha-nurbekova",
    is_open_to_work: true,
  },
  {
    name: "Dana Ospanova",
    gender: "female",
    email: "dana@sdu.edu.kz",
    profession: "UX/UI Designer",
    year: "2nd Year",
    bio: "I design experiences that people actually enjoy using. Figma is my second home.",
    linkedin_url: "https://linkedin.com/in/dana-ospanova",
    is_open_to_work: true,
  },
  {
    name: "Timur Kenzhebaev",
    gender: "male",
    email: "timur@sdu.edu.kz",
    profession: "Photographer",
    year: "4th Year",
    bio: "Documentary and landscape photographer. Sony shooter. Coffee addict.",
    linkedin_url: "",
    is_open_to_work: false,
  },
  {
    name: "Madina Bekova",
    gender: "female",
    email: "madina@sdu.edu.kz",
    profession: "3D Modeler",
    year: "3rd Year",
    bio: "3D generalist working in Blender and Cinema 4D. Obsessed with product visualization.",
    linkedin_url: "https://linkedin.com/in/madina-bekova",
    is_open_to_work: true,
  },
  {
    name: "Arman Seitkali",
    gender: "male",
    email: "arman@sdu.edu.kz",
    profession: "Game Designer",
    year: "2nd Year",
    bio: "Building worlds in Unity. Indie game enthusiast. Pixel art lover.",
    linkedin_url: "https://linkedin.com/in/arman-seitkali",
    is_open_to_work: true,
  },
  {
    name: "Zarina Akhmetova",
    gender: "female",
    email: "zarina@sdu.edu.kz",
    profession: "3D/2D Animator",
    year: "1st Year",
    bio: "New to animation but full of ideas. Learning After Effects and Spine.",
    linkedin_url: "",
    is_open_to_work: false,
  },
  {
    name: "Daniyar Mukhanov",
    gender: "male",
    email: "daniyar@sdu.edu.kz",
    profession: "Film Editor",
    year: "4th Year",
    bio: "Cutting stories that move people. Premiere Pro + DaVinci Resolve. Available for freelance.",
    linkedin_url: "https://linkedin.com/in/daniyar-mukhanov",
    is_open_to_work: true,
  },
  {
    name: "Aliya Sarbassova",
    gender: "female",
    email: "aliya@sdu.edu.kz",
    profession: "VFX Artist",
    year: "3rd Year",
    bio: "Making the impossible look real. Nuke + Houdini enthusiast.",
    linkedin_url: "https://linkedin.com/in/aliya-sarbassova",
    is_open_to_work: true,
  },
  {
    name: "Bekzat Nurlanov",
    gender: "male",
    email: "bekzat@sdu.edu.kz",
    profession: "Game Artist",
    year: "2nd Year",
    bio: "Concept artist and game illustrator. Drawing characters since age 7.",
    linkedin_url: "",
    is_open_to_work: false,
  },
  {
    name: "Kamila Dzhaksybekova",
    gender: "female",
    email: "kamila@sdu.edu.kz",
    profession: "Interior & Architecture Designer",
    year: "4th Year",
    bio: "Designing spaces that breathe. AutoCAD + 3ds Max + a lot of Pinterest.",
    linkedin_url: "https://linkedin.com/in/kamila-djaksybekova",
    is_open_to_work: true,
  },
  {
    name: "Aibek Sadykov",
    gender: "male",
    email: "aibek@sdu.edu.kz",
    profession: "Digital Artist",
    year: "2nd Year",
    bio: "Creates bold digital posters, editorial graphics, and concept art with a clean visual language.",
    linkedin_url: "https://linkedin.com/in/aibek-sadykov",
    is_open_to_work: true,
  },
  {
    name: "Akerke Nurlan",
    gender: "female",
    email: "akerke@sdu.edu.kz",
    profession: "Motion Designer",
    year: "3rd Year",
    bio: "Designs kinetic typography, motion branding, and short looping visuals for social media.",
    linkedin_url: "https://linkedin.com/in/akerke-nurlan",
    is_open_to_work: true,
  },
  {
    name: "Nursultan Aldabergen",
    gender: "male",
    email: "nursultan@sdu.edu.kz",
    profession: "Game Developer",
    year: "4th Year",
    bio: "Builds small gameplay systems, UI flows, and prototype mechanics in Unity and C#.",
    linkedin_url: "https://linkedin.com/in/nursultan-aldabergen",
    is_open_to_work: true,
  },
  {
    name: "Asem Tolegen",
    gender: "female",
    email: "asem@sdu.edu.kz",
    profession: "Illustrator",
    year: "1st Year",
    bio: "Draws character-driven illustrations, folk-inspired stories, and editorial visuals.",
    linkedin_url: "https://linkedin.com/in/asem-tolegen",
    is_open_to_work: false,
  },
  {
    name: "Murat Zhakypov",
    gender: "male",
    email: "murat@sdu.edu.kz",
    profession: "3D Modeler",
    year: "3rd Year",
    bio: "Focuses on product rendering, hard-surface modeling, and clean presentation shots.",
    linkedin_url: "https://linkedin.com/in/murat-zhakypov",
    is_open_to_work: true,
  },
  {
    name: "Lailym Isabek",
    gender: "female",
    email: "lailym@sdu.edu.kz",
    profession: "Videographer",
    year: "2nd Year",
    bio: "Shoots short-form video, social media promos, and student event recaps.",
    linkedin_url: "https://linkedin.com/in/lailym-isabek",
    is_open_to_work: true,
  },
  {
    name: "Rustem Zhanuzak",
    gender: "male",
    email: "rustem@sdu.edu.kz",
    profession: "UX/UI Designer",
    year: "4th Year",
    bio: "Designs SaaS dashboards, mobile onboarding flows, and usability-first interfaces.",
    linkedin_url: "https://linkedin.com/in/rustem-zhanuzak",
    is_open_to_work: true,
  },
  {
    name: "Saniya Tleuova",
    gender: "female",
    email: "saniya@sdu.edu.kz",
    profession: "Photographer",
    year: "2nd Year",
    bio: "Captures street portraits, campus stories, and warm documentary photo essays.",
    linkedin_url: "https://linkedin.com/in/saniya-tleuova",
    is_open_to_work: false,
  },
  {
    name: "Ernur Kali",
    gender: "male",
    email: "ernur@sdu.edu.kz",
    profession: "VFX Artist",
    year: "3rd Year",
    bio: "Builds compositing shots, screen replacements, and particle-heavy VFX sequences.",
    linkedin_url: "https://linkedin.com/in/ernur-kali",
    is_open_to_work: true,
  },
  {
    name: "Dastan Abish",
    gender: "male",
    email: "dastan@sdu.edu.kz",
    profession: "Game Animator",
    year: "1st Year",
    bio: "Creates playful game animations, HUD micro-interactions, and lively character motion.",
    linkedin_url: "https://linkedin.com/in/dastan-abish",
    is_open_to_work: true,
  }
];

// Artworks for each student
const artworksData = [
  // Madina Bekova — 3D
  { user: "Madina Bekova", title: "Crystal Sphere", category: "3D",
    description: "A photorealistic 3D render of a floating crystal sphere with caustic light effects. Made in Blender with Cycles renderer.",
    status: "approved", likes: 14 },
  { user: "Madina Bekova", title: "Product Viz — Perfume", category: "3D",
    description: "Commercial-style 3D product visualization of a luxury perfume bottle. Rendered in Cinema 4D + Octane.",
    status: "approved", likes: 22 },
  { user: "Madina Bekova", title: "Abstract Architecture", category: "3D",
    description: "Experimental architectural form study using parametric modeling techniques in Blender.",
    status: "pending", likes: 0 },

  // Arman Seitkali — Game Design
  { user: "Arman Seitkali", title: "Desert Level Concept", category: "Game Art",
    description: "Environment concept art for a desert-themed RPG level. Drew inspiration from Central Asian landscapes.",
    status: "approved", likes: 9 },
  { user: "Arman Seitkali", title: "Pixel City", category: "Game Art",
    description: "A fully animated pixel art city scene built in Aseprite. Features a day/night cycle.",
    status: "approved", likes: 17 },
  { user: "Arman Seitkali", title: "UI Kit — Fantasy Game", category: "UX/UI",
    description: "A complete game UI kit including health bars, inventory slots, and dialog boxes with a fantasy theme.",
    status: "approved", likes: 11 },

  // Dana Ospanova — UX/UI
  { user: "Dana Ospanova", title: "Food Delivery App", category: "UX/UI",
    description: "Full UX case study for a food delivery mobile app. Includes user research, wireframes, and high-fidelity Figma prototype.",
    status: "approved", likes: 19 },
  { user: "Dana Ospanova", title: "E-Learning Dashboard", category: "UX/UI",
    description: "Dark-mode dashboard design for an online education platform. Focused on data clarity and student progress tracking.",
    status: "approved", likes: 13 },

  // Zarina Akhmetova — Animation
  { user: "Zarina Akhmetova", title: "Bouncing Ball Loop", category: "Animation",
    description: "My first animation exercise — a classic bouncing ball with squash and stretch. Made in After Effects.",
    status: "approved", likes: 4 },
  { user: "Zarina Akhmetova", title: "Character Walk Cycle", category: "Animation",
    description: "2D character walk cycle animation for a stylized cartoon character. Drawn frame by frame in Procreate.",
    status: "approved", likes: 7 },

  // Daniyar Mukhanov — Video
  { user: "Daniyar Mukhanov", title: "Almaty From Above", category: "Video",
    description: "A cinematic short film shot on DJI Mini 3 Pro over Almaty city. Color graded in DaVinci Resolve.",
    status: "approved", likes: 28,
    video_url: "https://cdn.pixabay.com/video/2016/11/22/6502-192301252_large.mp4" },
  { user: "Daniyar Mukhanov", title: "SDU Campus Documentary", category: "Video",
    description: "A 5-minute documentary capturing student life at SDU University. Winner of the internal media competition 2024.",
    status: "approved", likes: 35,
    video_url: "https://cdn.pixabay.com/video/2019/06/30/24823-346724537_large.mp4" },
  { user: "Daniyar Mukhanov", title: "Music Video Edit", category: "Video",
    description: "A fast-cut music video edit synced to a Kazakh indie track. Showcases rhythm editing techniques.",
    status: "pending", likes: 0,
    video_url: "https://cdn.pixabay.com/video/2021/08/04/83741-587402186_large.mp4" },

  // Aliya Sarbassova — VFX
  { user: "Aliya Sarbassova", title: "Fire Simulation", category: "VFX",
    description: "Realistic fire and smoke simulation created in Houdini. Composited over live footage in Nuke.",
    status: "approved", likes: 16 },
  { user: "Aliya Sarbassova", title: "Portal Effect", category: "VFX",
    description: "A glowing interdimensional portal VFX shot. Used Nuke for compositing and After Effects for particle work.",
    status: "approved", likes: 21 },

  // Bekzat Nurlanov — Illustration
  { user: "Bekzat Nurlanov", title: "Warrior Character Sheet", category: "Illustration",
    description: "Full character sheet for a steppe warrior — front, back, side views plus expressions and weapon details.",
    status: "approved", likes: 12 },
  { user: "Bekzat Nurlanov", title: "Monster Design Vol.1", category: "Illustration",
    description: "A collection of 6 monster concept sketches inspired by Kazakh mythology.",
    status: "approved", likes: 8 },

  // Aisha Nurbekova — Graphic Design
  { user: "Aisha Nurbekova", title: "Brand Identity — Local Startup", category: "Illustration",
    description: "Complete brand identity design including logo, color palette, typography guidelines, and brand assets.",
    status: "approved", likes: 19 },
  { user: "Aisha Nurbekova", title: "Poster Series — Social Awareness", category: "Illustration",
    description: "A series of 5 posters designed for environmental awareness campaign. Bold typography and illustration.",
    status: "approved", likes: 15 },

  // Timur Kenzhebaev — Photography
  { user: "Timur Kenzhebaev", title: "Charyn Canyon at Sunrise", category: "Photography",
    description: "Golden hour landscape photography at Charyn Canyon, Kazakhstan. Shot on Sony A7III.",
    status: "approved", likes: 24 },
  { user: "Timur Kenzhebaev", title: "Almaty Street Life", category: "Photography",
    description: "A photo essay on everyday street life in Almaty — candid portraits and urban textures.",
    status: "approved", likes: 18 },
  { user: "Timur Kenzhebaev", title: "Winter in Shymbulak", category: "Photography",
    description: "Ski resort aerial and ground photography. Captured during a winter expedition to Shymbulak.",
    status: "approved", likes: 31 },

  // Kamila Dzhaksybekova — Interior Design
  { user: "Kamila Dzhaksybekova", title: "Minimalist Apartment Concept", category: "3D",
    description: "Interior visualization of a 45sqm minimalist apartment. Rendered in 3ds Max + Corona Renderer.",
    status: "approved", likes: 20 },
  { user: "Kamila Dzhaksybekova", title: "Cafe Interior — Boho Style", category: "3D",
    description: "Full interior design project for a boho-style cafe. Includes floor plan, 3D renders, and material board.",
    status: "approved", likes: 26 },
  { user: "Kamila Dzhaksybekova", title: "SDU Library Redesign", category: "3D",
    description: "Concept redesign proposal for the SDU University library. Modern, student-focused spatial design.",
    status: "pending", likes: 0 }

  // Aibek Sadykov — Digital Art
  ,{ user: "Aibek Sadykov", title: "Neon Campus Poster", category: "Digital Art",
    description: "A bold poster series for student events with gradient lighting and layered typography.",
    status: "approved", likes: 18 },
  { user: "Aibek Sadykov", title: "Album Cover Concepts", category: "Digital Art",
    description: "Three cover concepts for an indie music release, exploring color and silhouette contrast.",
    status: "approved", likes: 11 },

  // Akerke Nurlan — Motion Design
  { user: "Akerke Nurlan", title: "Motion Reel 2025", category: "Animation",
    description: "A short motion reel mixing kinetic typography, transitions, and brand animations.",
    status: "approved", likes: 14 },
  { user: "Akerke Nurlan", title: "Kinetic Type Study", category: "Animation",
    description: "A typography-driven motion experiment built to practice rhythm, timing, and visual hierarchy.",
    status: "approved", likes: 9 },

  // Nursultan Aldabergen — Game Development
  { user: "Nursultan Aldabergen", title: "Puzzle Quest Prototype", category: "Interactive",
    description: "A small Unity prototype with puzzle mechanics, checkpoints, and progress flow.",
    status: "approved", likes: 13 },
  { user: "Nursultan Aldabergen", title: "Inventory HUD System", category: "UX/UI",
    description: "UI design for a game inventory system with readable icons and quick item sorting.",
    status: "approved", likes: 8 },

  // Asem Tolegen — Illustration
  { user: "Asem Tolegen", title: "Folklore Character Sheet", category: "Illustration",
    description: "Character exploration inspired by Kazakh folklore with modern costume details.",
    status: "approved", likes: 16 },
  { user: "Asem Tolegen", title: "Editorial Story Panels", category: "Illustration",
    description: "A sequence of editorial illustrations for a magazine article about youth creativity.",
    status: "approved", likes: 10 },

  // Murat Zhakypov — 3D
  { user: "Murat Zhakypov", title: "Architectural Lobby Viz", category: "3D",
    description: "Interior render of a modern lobby with polished materials and realistic lighting.",
    status: "approved", likes: 22 },
  { user: "Murat Zhakypov", title: "Futuristic Chair Study", category: "3D",
    description: "Hard-surface product study with a metallic finish and clean studio presentation.",
    status: "approved", likes: 15 },

  // Lailym Isabek — Video
  { user: "Lailym Isabek", title: "Campus Teaser Trailer", category: "Video",
    description: "Fast-cut teaser for student life on campus, edited for social-first platforms.",
    status: "approved", likes: 19,
    video_url: "https://cdn.pixabay.com/video/2020/11/06/53847-478219314_large.mp4" },
  { user: "Lailym Isabek", title: "Brand Motion Promo", category: "Video",
    description: "A brand promo edit with title animation, pacing cuts, and clean sound hits.",
    status: "approved", likes: 12,
    video_url: "https://cdn.pixabay.com/video/2016/11/22/6502-192301252_large.mp4" },

  // Rustem Zhanuzak — UX/UI
  { user: "Rustem Zhanuzak", title: "Mobile Banking App", category: "UX/UI",
    description: "A polished banking app concept focused on onboarding, transactions, and clarity.",
    status: "approved", likes: 21 },
  { user: "Rustem Zhanuzak", title: "Accessibility Audit", category: "UX/UI",
    description: "A usability review of a student platform with contrast, spacing, and flow improvements.",
    status: "approved", likes: 9 },

  // Saniya Tleuova — Photography
  { user: "Saniya Tleuova", title: "Street Portraits", category: "Photography",
    description: "Natural-light portrait series shot around the city with a documentary touch.",
    status: "approved", likes: 17 },
  { user: "Saniya Tleuova", title: "Night Market Stories", category: "Photography",
    description: "Colorful night-market photo essay focused on atmosphere, texture, and movement.",
    status: "approved", likes: 13 },

  // Ernur Kali — VFX
  { user: "Ernur Kali", title: "Energy Burst Compositing", category: "VFX",
    description: "A composited energy burst shot built with tracking, masking, and glow passes.",
    status: "approved", likes: 20 },
  { user: "Ernur Kali", title: "Flying Car Shot", category: "VFX",
    description: "A sci-fi car shot with screen replacement, reflections, and smoke integration.",
    status: "approved", likes: 16 },

  // Dastan Abish — Game Animation
  { user: "Dastan Abish", title: "Rhythm Game HUD", category: "Interactive",
    description: "An animated HUD concept for a rhythm game with pulsing beats and score feedback.",
    status: "approved", likes: 14 },
  { user: "Dastan Abish", title: "Character Idle Loop", category: "Animation",
    description: "A lively idle loop made to test timing, personality, and character silhouette.",
    status: "approved", likes: 7 }
];

// Helper function to generate placeholder image URL
function getImageUrl(title) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `https://picsum.photos/seed/${slug}/800/600`;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'student';
}

function buildHandle(name, email) {
  return slugify(name || email?.split('@')[0] || 'student');
}

function buildAvatarUrl(name, gender) {
  const style = gender === 'female' ? 'lorelei' : 'adventurer';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(name)}`;
}

function seedDatabase() {
  console.log('🌱 Seeding MMS Gallery database...\n');

  // Check if we need to clear existing seed data
  if (FORCE_RESEED) {
    console.log('🔄 Force reseed mode: Clearing existing seed data...');
    db.exec('DELETE FROM likes');
    db.exec('DELETE FROM follows');
    db.exec('DELETE FROM notifications');
    db.exec('DELETE FROM comments');
    db.exec('DELETE FROM artworks');
    db.exec(`DELETE FROM users WHERE email NOT IN ('admin@mmsgallery.edu')`);
    console.log('   ✓ Cleared previous seed data\n');
  }

  // Insert students
  console.log('👥 Creating student accounts...');
  const passwordHash = bcrypt.hashSync('password123', 10);
  const studentIds = {};

  for (const student of studentsData) {
    try {
      const uuid = uuidv4();
      const handle = student.handle || buildHandle(student.name, student.email);
      const username = handle;
      const avatarUrl = student.avatar_url || buildAvatarUrl(student.name, student.gender);
      const portfolioUrl = student.portfolio_url || `https://www.behance.net/${handle}`;
      db.prepare(`
        INSERT INTO users (uuid, name, email, password, role, profession, year, bio, linkedin_url, portfolio_url, avatar_url, handle, username, last_username_change, is_open_to_work, language_pref)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
      `).run(
        uuid,
        student.name,
        student.email,
        passwordHash,
        'student',
        student.profession,
        student.year,
        student.bio,
        student.linkedin_url,
        portfolioUrl,
        avatarUrl,
        handle,
        username,
        student.is_open_to_work ? 1 : 0,
        'en'
      );

      const user = db.prepare('SELECT id FROM users WHERE email = ?').get(student.email);
      studentIds[student.name] = user.id;
      console.log(`   ✓ ${student.name} (${student.email})`);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        const user = db.prepare('SELECT id FROM users WHERE email = ?').get(student.email);
        studentIds[student.name] = user.id;
        console.log(`   ℹ ${student.name} already exists (${student.email})`);
      } else {
        console.error(`   ✗ Error inserting ${student.name}: ${err.message}`);
      }
    }
  }

  console.log(`\n📚 Creating artworks (${artworksData.length} total)...`);
  for (const artwork of artworksData) {
    try {
      const userId = studentIds[artwork.user];
      if (!userId) {
        console.warn(`   ⚠ User not found for artwork "${artwork.title}" by ${artwork.user}`);
        continue;
      }

      const uuid = uuidv4();
      const imageUrl = getImageUrl(artwork.title);
      const isVideo = (artwork.category || '').toLowerCase() === 'video' || !!artwork.video_url;
      const fileType = isVideo ? 'video' : 'image';
      const likesCount = artwork.status === 'approved' ? Number(artwork.likes || 0) : 0;

      db.prepare(`
        INSERT INTO artworks (uuid, title, description, category, image_url, file_url, thumbnail_url, file_type, status, likes_count, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuid,
        artwork.title,
        artwork.description,
        artwork.category,
        isVideo ? null : imageUrl,
        isVideo ? artwork.video_url : null,
        imageUrl,
        fileType,
        artwork.status,
        likesCount,
        userId
      );

      console.log(`   ✓ "${artwork.title}" by ${artwork.user} (${likesCount} likes, ${artwork.status}${isVideo ? ', video' : ''})`);
    } catch (err) {
      console.error(`   ✗ Error inserting artwork "${artwork.title}": ${err.message}`);
    }
  }

  // Create realistic follows relationships
  console.log(`\n🔗 Creating follow relationships...`);
  const userIds = Object.values(studentIds);
  const followCreated = new Set();

  // Each student follows 2-4 random others
  for (const followerId of userIds) {
    const followCount = Math.floor(Math.random() * 3) + 2; // 2-4 follows
    const potentialFollowing = userIds.filter(uid => uid !== followerId);

    for (let i = 0; i < followCount && potentialFollowing.length > 0; i++) {
      const randomIdx = Math.floor(Math.random() * potentialFollowing.length);
      const followingId = potentialFollowing.splice(randomIdx, 1)[0];
      
      const key = `${followerId}-${followingId}`;
      if (!followCreated.has(key)) {
        try {
          db.prepare(`
            INSERT INTO follows (follower_id, following_id)
            VALUES (?, ?)
          `).run(followerId, followingId);
          followCreated.add(key);
        } catch (err) {
          // Silently ignore duplicates
        }
      }
    }
  }

  console.log(`   ✓ Created ${followCreated.size} follow relationships\n`);

  // Print summary statistics
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
  const artworkCount = db.prepare("SELECT COUNT(*) as count FROM artworks").get().count;
  const approvedCount = db.prepare("SELECT COUNT(*) as count FROM artworks WHERE status = 'approved'").get().count;
  const totalLikes = db.prepare("SELECT SUM(likes_count) as total FROM artworks").get().total || 0;
  const followCount = db.prepare("SELECT COUNT(*) as count FROM follows").get().count;

  console.log('📊 Database Summary:');
  console.log(`   👥 Students: ${userCount}`);
  console.log(`   🖼️  Total Artworks: ${artworkCount} (${approvedCount} approved)`);
  console.log(`   ❤️  Total Likes: ${totalLikes}`);
  console.log(`   🔗 Follow Relationships: ${followCount}`);
  console.log(`\n✅ Seeding complete!`);
  console.log(`\n🚀 Run "npm start" to launch the app with seed data.`);
}

// Run seeding
try {
  seedDatabase();
} catch (err) {
  console.error('\n❌ Seeding failed:', err.message);
  process.exit(1);
}
