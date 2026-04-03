/* ══════════════════════════════════════════════════════════
   MMS GALLERY - Main Application JavaScript
   ══════════════════════════════════════════════════════════ */

/* ── Theme Toggle ── */
function initTheme() {
  const savedTheme = localStorage.getItem('mms_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('mms_theme', newTheme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const theme = document.documentElement.getAttribute('data-theme');
  const btns = document.querySelectorAll('.theme-toggle');
  btns.forEach(btn => {
    btn.innerHTML = theme === 'dark' ? '&#9728;' : '&#9790;';
  });
}

/* ── Toast ── */
let toastTimer;
function toast(msg, type = 'info') {
  let el = document.getElementById('toast');
  if (!el) { 
    el = document.createElement('div'); 
    el.id = 'toast'; 
    document.body.appendChild(el); 
  }
  el.textContent = msg;
  el.className = 'show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.className = '', 3000);
}

/* ── Nav scroll ── */
function initNavScroll() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 50));
}

/* ── Auth helpers ── */
const API = '';  // same origin

function getToken() { return localStorage.getItem('mms_token'); }
function getUser() { 
  try { 
    return JSON.parse(localStorage.getItem('mms_user')); 
  } catch { 
    return null; 
  } 
}
function setAuth(token, user) {
  localStorage.setItem('mms_token', token);
  localStorage.setItem('mms_user', JSON.stringify(user));
}
function clearAuth() { 
  localStorage.removeItem('mms_token'); 
  localStorage.removeItem('mms_user'); 
}
function isLoggedIn() { return !!getToken(); }

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function apiFetchForm(path, formData, method = 'POST') {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + path, { method, headers, body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/* ── Nav auth state ── */
function updateNavAuth() {
  const user = getUser();
  const navRight = document.getElementById('navRight');
  if (!navRight) return;
  
  const themeBtn = `<button class="theme-toggle" onclick="toggleTheme()" title="Toggle theme"></button>`;
  
  // User account icon SVG
  const accountIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  
  if (user) {
    navRight.innerHTML = `
      ${themeBtn}
      <a href="/dashboard" class="nav-account-btn" title="My Account">${accountIcon}</a>
      ${user.role === 'admin' ? '<a href="/admin" class="btn btn-ghost btn-sm">Admin</a>' : ''}
      <button onclick="logout()" class="btn btn-ghost btn-sm">Logout</button>
    `;
  } else {
    navRight.innerHTML = `
      ${themeBtn}
      <a href="/auth" class="btn btn-ghost btn-sm">Login</a>
      <a href="/auth?mode=register" class="btn btn-primary btn-sm">Sign Up</a>
    `;
  }
  updateThemeIcon();
}

function logout() {
  clearAuth();
  toast('Logged out successfully', 'success');
  setTimeout(() => location.href = '/', 800);
}

/* ── Art placeholder SVG ── */
function artSVG(seed, w = 400, h = 300) {
  const colors = [
    ['#e0e7ff', '#c7d2fe'],
    ['#dbeafe', '#bfdbfe'],
    ['#e0f2fe', '#bae6fd'],
    ['#ecfdf5', '#d1fae5'],
    ['#fef3c7', '#fde68a']
  ];
  const p = colors[seed % colors.length];
  const accent = ['#3b82f6', '#6366f1', '#8b5cf6', '#06b6d4', '#10b981'][seed % 5];
  
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;background:var(--bg-tertiary)">
    <defs>
      <linearGradient id="g${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p[0]}"/>
        <stop offset="100%" stop-color="${p[1]}"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g${seed})"/>
    <circle cx="${w * 0.3}" cy="${h * 0.4}" r="${Math.min(w, h) * 0.15}" fill="${accent}" opacity="0.3"/>
    <circle cx="${w * 0.7}" cy="${h * 0.6}" r="${Math.min(w, h) * 0.1}" fill="${accent}" opacity="0.2"/>
    <rect x="${w * 0.45}" y="${h * 0.35}" width="${w * 0.1}" height="${h * 0.3}" fill="${accent}" opacity="0.15" rx="4"/>
  </svg>`;
}

/* ── Intersection reveal ── */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { 
        e.target.style.opacity = '1'; 
        e.target.style.transform = 'translateY(0)'; 
      }
    });
  }, { threshold: 0.08 });
  
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.cssText += `opacity:0;transform:translateY(20px);transition:opacity 0.5s ${i * 0.05}s ease,transform 0.5s ${i * 0.05}s ease;`;
    obs.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavScroll();
  updateNavAuth();
  initReveal();
});
