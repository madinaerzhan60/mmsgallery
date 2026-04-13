/**
 * Script: reset-admin-password.js
 * 
 * Resets the admin user's password in Supabase Auth.
 * If the admin doesn't exist in Supabase Auth yet, it creates them.
 * 
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... DATABASE_URL=... \
 *   node scripts/reset-admin-password.js <new_password>
 * 
 * Or if .env is available:
 *   node -r dotenv/config scripts/reset-admin-password.js <new_password>
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;
const newPassword = process.argv[2];

if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
  console.error('❌ Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL');
  process.exit(1);
}

if (!newPassword || newPassword.length < 8) {
  console.error('❌ Please provide a new password (min 8 chars) as argument:');
  console.error('   node scripts/reset-admin-password.js <new_password>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

async function main() {
  console.log('🔍 Finding admin user in database...');

  const { rows } = await pool.query(
    `SELECT uuid, email, name FROM users WHERE role='admin' ORDER BY id ASC LIMIT 1`
  );

  if (!rows[0]) {
    console.error('❌ No admin user found in the database.');
    process.exit(1);
  }

  const admin = rows[0];
  console.log(`✅ Found admin: ${admin.email} (${admin.name})`);
  console.log(`   UUID: ${admin.uuid}`);

  // Try to update in Supabase Auth
  console.log('🔄 Updating password in Supabase Auth...');
  const { data, error } = await supabase.auth.admin.updateUserById(admin.uuid, {
    password: newPassword
  });

  if (error) {
    // If user doesn't exist in Supabase Auth yet, create them
    if (error.message?.includes('not found') || error.status === 404) {
      console.log('⚠️  Admin not found in Supabase Auth. Creating...');
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: newPassword,
        email_confirm: true, // Admin is pre-confirmed
        user_metadata: { name: admin.name }
      });

      if (createError) {
        console.error('❌ Failed to create admin in Supabase Auth:', createError.message);
        process.exit(1);
      }

      // Update our DB uuid to match the new Supabase Auth uuid
      if (created.user.id !== admin.uuid) {
        await pool.query('UPDATE users SET uuid=$1 WHERE uuid=$2', [created.user.id, admin.uuid]);
        console.log(`✅ Updated admin UUID to: ${created.user.id}`);
      }

      console.log('✅ Admin created in Supabase Auth successfully!');
    } else {
      console.error('❌ Supabase Auth error:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Admin password updated successfully in Supabase Auth!');
  }

  console.log('\n🎉 Done! Admin can now log in with the new password.');
  await pool.end();
}

main().catch(err => {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
});
