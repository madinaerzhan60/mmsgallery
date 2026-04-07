#!/usr/bin/env node

const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'mmsgallery.sqlite');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON');

const professions = [
  'Digital Artist',
  '3D Artist',
  'Photographer',
  'Motion Designer',
  'Illustrator',
  'UX/UI Designer',
  'Videographer',
  'Game Artist'
];

const fullNames = [
  'Айгерим Бекова',
  'Нурасыл Сейітов',
  'Аружан Төлеген',
  'Данияр Омаров',
  'Мадина Жумабаева',
  'Ерасыл Нұрлан',
  'Айдана Қасымова',
  'Арман Сериков',
  'Алина Мұратова',
  'Бекзат Әлиев',
  'Дильназ Кенжехан',
  'Руслан Жанұзақ',
  'Сания Тлеуова',
  'Ернұр Қалибек',
  'Әсем Нұртаева',
  'Мұрат Жақыпов',
  'Ләйлә Исабек',
  'Тимур Сәрсен',
  'Акерке Бақыт',
  'Дастан Әбіш'
];

const bios = [
  'Работает с визуальными историями и любит искать необычные композиционные решения. В проектах делает акцент на чистую подачу и сильный образ.',
  'Экспериментирует с формой, цветом и ритмом, чтобы превращать идеи в выразительные визуальные проекты. Чаще всего работает в цифровой среде.',
  'Создаёт проекты с вниманием к деталям и старается, чтобы каждый кадр или экран выглядел законченным. Интересуется современными трендами и культурным контекстом.',
  'Изучает новые визуальные техники и развивает собственный стиль через практику и эксперименты. Любит соединять минимализм и эмоциональную подачу.',
  'Фокусируется на аккуратной композиции, понятной структуре и сильной визуальной айдентике. Стремится делать работы, которые легко запоминаются.'
];

const handleMap = new Map();

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededIndex(seed, length) {
  return hashString(seed) % length;
}

function seededBool(seed) {
  return (hashString(seed) & 1) === 1;
}

function seededChoice(seed, items) {
  return items[seededIndex(seed, items.length)];
}

function transliterate(value) {
  const map = {
    А: 'A', Ә: 'A', Б: 'B', В: 'V', Г: 'G', Ғ: 'Gh', Д: 'D', Е: 'E', Ё: 'Yo', Ж: 'Zh', З: 'Z', И: 'I', Й: 'Y',
    К: 'K', Қ: 'Q', Л: 'L', М: 'M', Н: 'N', Ң: 'Ng', О: 'O', Ө: 'O', П: 'P', Р: 'R', С: 'S', Т: 'T', У: 'U', Ұ: 'U', Ү: 'U',
    Ф: 'F', Х: 'Kh', Һ: 'H', Ц: 'Ts', Ч: 'Ch', Ш: 'Sh', Щ: 'Shch', Ы: 'Y', І: 'I', Ь: '', Ъ: '', Э: 'E', Ю: 'Yu', Я: 'Ya',
    а: 'a', ә: 'a', б: 'b', в: 'v', г: 'g', ғ: 'gh', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', қ: 'q', л: 'l', м: 'm', н: 'n', ң: 'ng', о: 'o', ө: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ұ: 'u', ү: 'u',
    ф: 'f', х: 'kh', һ: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ы: 'y', і: 'i', ь: '', ъ: '', э: 'e', ю: 'yu', я: 'ya',
    Ә: 'A', ' ': '_', '-': '_', '’': '', 'ʼ': '', 'қ': 'q'
  };

  return String(value)
    .split('')
    .map((char) => map[char] ?? char)
    .join('')
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

function buildHandle(name, userId, email) {
  const baseSource = name || email.split('@')[0] || `student_${userId}`;
  let base = transliterate(baseSource) || `student_${userId}`;
  if (!/^[a-z]/.test(base)) base = `student_${base}`;
  let candidate = base;
  let suffix = 2;
  while (handleMap.has(candidate)) {
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
  handleMap.set(candidate, userId);
  return candidate;
}

const users = db.prepare(`
  SELECT id, name, email, handle, year, bio, profession, major, linkedin_url, portfolio_url, avatar_url, is_open_to_work
  FROM users
  WHERE role='student'
  ORDER BY id ASC
`).all();

const existingHandles = db.prepare(`
  SELECT handle, id FROM users
  WHERE role='student' AND handle IS NOT NULL AND TRIM(handle) <> ''
`).all();

for (const row of existingHandles) {
  handleMap.set(row.handle, row.id);
}

let updatedCount = 0;

for (const [index, user] of users.entries()) {
  const currentName = (user.name || '').trim();
  const nextName = currentName || fullNames[index % fullNames.length];
  const nextHandle = (user.handle || '').trim() || buildHandle(nextName, user.id, user.email);
  const stableSeed = `${user.id}:${user.email}`;
  const nextProfession = (user.profession || user.major || '').trim() || seededChoice(stableSeed, professions);
  const nextYear = String(((hashString(stableSeed) % 4) || 0) + 1);
  const nextBio = (user.bio || '').trim() || seededChoice(stableSeed, bios);
  const nextLinkedIn = (user.linkedin_url || '').trim() || `https://linkedin.com/in/${nextHandle}`;
  const nextPortfolio = (user.portfolio_url || '').trim() || (seededBool(stableSeed) ? `https://${nextHandle}.behance.net` : `https://${nextHandle}.dribbble.com`);
  const nextAvatar = (user.avatar_url || '').trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nextHandle)}`;
  const nextOpenToWork = Number(Boolean(user.is_open_to_work) || seededBool(`${stableSeed}:open`));

  const needsUpdate =
    currentName !== nextName ||
    (user.handle || '').trim() !== nextHandle ||
    (user.profession || user.major || '').trim() !== nextProfession ||
    String(user.year || '').trim() !== nextYear ||
    (user.bio || '').trim() !== nextBio ||
    (user.linkedin_url || '').trim() !== nextLinkedIn ||
    (user.portfolio_url || '').trim() !== nextPortfolio ||
    (user.avatar_url || '').trim() !== nextAvatar ||
    Number(Boolean(user.is_open_to_work)) !== nextOpenToWork;

  if (!needsUpdate) {
    continue;
  }

  db.prepare(`
    UPDATE users
    SET name=?,
        handle=?,
        major=?,
        profession=?,
        year=?,
        bio=?,
        linkedin_url=?,
        portfolio_url=?,
        avatar_url=?,
        is_open_to_work=?
    WHERE id=?
  `).run(
    nextName,
    nextHandle,
    nextProfession,
    nextProfession,
    nextYear,
    nextBio,
    nextLinkedIn,
    nextPortfolio,
    nextAvatar,
    nextOpenToWork,
    user.id
  );

  updatedCount += 1;
}

console.log(`Updated ${updatedCount} student profile(s).`);
