/*
 * Authentication routes for ADONAI AI.
 *
 * These routes handle server-side auth operations.
 * Most auth happens client-side via Supabase JS, but the backend
 * provides endpoints for profile management and auth status.
 *
 * Routes:
 *   GET  /api/auth/profile   - Get current user's profile
 *   PUT  /api/auth/profile   - Update current user's profile
 *   GET  /api/auth/config    - Get public Supabase config for frontend
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabaseAdmin, isSupabaseConfigured, SUPABASE_URL, SUPABASE_ANON_KEY } = require('../config/supabase');

/**
 * GET /api/auth/config
 * Returns public Supabase configuration for the frontend.
 * This is safe to expose - the anon key is designed to be public.
 */
router.get('/config', (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.json({
      configured: false,
      message: 'Authentication is not configured. Running in anonymous-only mode.',
    });
  }

  res.json({
    configured: true,
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  });
});

/**
 * GET /api/auth/profile
 * Returns the authenticated user's profile data.
 * Requires authentication.
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      tier: profile.tier,
      dailyQuestionCount: profile.daily_question_count,
      lastQuestionDate: profile.last_question_date,
      createdAt: profile.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/auth/profile
 * Updates the authenticated user's profile (display name only for now).
 * Requires authentication.
 */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { displayName } = req.body;

    if (!displayName || typeof displayName !== 'string') {
      return res.status(400).json({ error: 'Display name is required' });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
