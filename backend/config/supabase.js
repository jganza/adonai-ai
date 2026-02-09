/*
 * Supabase client configuration for ADONAI AI.
 *
 * Two clients are exported:
 * - supabase: Regular client for user-context operations
 * - supabaseAdmin: Service-role client for admin operations
 *   (rate limiting, bypassing RLS for backend tasks)
 *
 * Required environment variables:
 *   SUPABASE_URL        - Your Supabase project URL
 *   SUPABASE_ANON_KEY   - Public anon key (safe for frontend)
 *   SUPABASE_SERVICE_KEY - Service role key (backend only, never expose)
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Regular client (respects Row Level Security)
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Admin client (bypasses Row Level Security - for backend operations only)
let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// Helper to check if Supabase is configured
function isSupabaseConfigured() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_KEY);
}

module.exports = {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
};
