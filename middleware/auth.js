const { pgPool, usePg } = require('../pg');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);
const supabase = supabaseEnabled 
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

async function auth(req, res, next) {
  if (!usePg || !pgPool) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' });
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });

  const token = header.slice(7);

  if (!supabaseEnabled) {
     return res.status(500).json({ error: 'Supabase is not configured' });
  }

  try {
    const { data: { user: sbUser }, error } = await supabase.auth.getUser(token);
    if (error || !sbUser) {
      return res.status(401).json({ error: 'Session expired or invalid token' });
    }

    const result = await pgPool.query('SELECT * FROM users WHERE uuid=$1 LIMIT 1', [sbUser.id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'User record not found in database' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Admin access required' });
    next();
  });
}

const JWT_SECRET = process.env.JWT_SECRET || 'lumina_secret_for_legacy'; 
module.exports = { auth, adminOnly, JWT_SECRET, supabase };
