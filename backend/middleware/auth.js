/*
 * Authentication middleware for ADONAI AI.
 *
 * optionalAuth: Extracts user from JWT token if present.
 *   - If valid token: sets req.user with user data
 *   - If no token or invalid: sets req.user to null (anonymous access)
 *   - Never blocks requests - allows both authenticated and anonymous users
 *
 * requireAuth: Requires a valid JWT token.
 *   - If valid token: sets req.user and continues
 *   - If no token or invalid: returns 401 Unauthorized
 */

const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

/**
 * Optional authentication - allows both anonymous and authenticated requests.
 * Extracts user info from the Authorization header if present.
 */
async function optionalAuth(req, res, next) {
  req.user = null;

  // If Supabase isn't configured, skip auth entirely
  if (!isSupabaseConfigured()) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user) {
      req.user = data.user;
    }
  } catch (err) {
    // Token invalid or expired - continue as anonymous
    console.warn('Auth token validation failed:', err.message);
  }

  next();
}

/**
 * Required authentication - blocks unauthenticated requests.
 */
async function requireAuth(req, res, next) {
  req.user = null;

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: 'Authentication service not configured' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    }
    req.user = data.user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed. Please sign in again.' });
  }
}

module.exports = { optionalAuth, requireAuth };
