/*
 * Rate limiting middleware for ADONAI AI.
 *
 * Limits the number of questions per day based on user tier:
 *   - Anonymous users: 10 questions/day (tracked by IP address)
 *   - Free tier users: 10 questions/day (tracked by user ID)
 *   - Premium users: unlimited (for future use)
 *
 * Rate limit data is stored in Supabase tables:
 *   - anonymous_usage: tracks anonymous users by IP + date
 *   - profiles: tracks authenticated users via daily_question_count
 *
 * If Supabase is not configured, rate limiting is disabled (for local dev).
 */

const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

const DAILY_LIMIT_FREE = 10;

/**
 * Extracts the client's real IP address from the request,
 * accounting for reverse proxies (Render, Cloudflare, etc.).
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Checks rate limit for the current request.
 * Sets req.rateLimitInfo with usage details.
 * Returns 429 if limit exceeded.
 */
async function checkRateLimit(req, res, next) {
  // If Supabase isn't configured, skip rate limiting (local dev mode)
  if (!isSupabaseConfigured()) {
    req.rateLimitInfo = { limited: false, remaining: 999 };
    return next();
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    if (req.user) {
      // AUTHENTICATED USER: check profile's daily count
      const result = await checkAuthenticatedLimit(req.user.id, today);
      req.rateLimitInfo = result;
    } else {
      // ANONYMOUS USER: check IP-based usage
      const ip = getClientIP(req);
      const result = await checkAnonymousLimit(ip, today);
      req.rateLimitInfo = result;
    }

    if (req.rateLimitInfo.limited) {
      return res.status(429).json({
        error: 'Daily question limit reached. Sign up for a free account or try again tomorrow.',
        limit: DAILY_LIMIT_FREE,
        used: req.rateLimitInfo.used,
        resetAt: 'midnight UTC',
      });
    }

    next();
  } catch (err) {
    // If rate limiting fails, allow the request (fail open for availability)
    console.error('Rate limit check failed:', err.message);
    req.rateLimitInfo = { limited: false, remaining: 999 };
    next();
  }
}

/**
 * Increments the usage counter after a successful response.
 * Call this AFTER the AI response has been sent.
 */
async function incrementUsage(req) {
  if (!isSupabaseConfigured()) return;

  const today = new Date().toISOString().split('T')[0];

  try {
    if (req.user) {
      await incrementAuthenticatedUsage(req.user.id, today);
    } else {
      const ip = getClientIP(req);
      await incrementAnonymousUsage(ip, today);
    }
  } catch (err) {
    console.error('Failed to increment usage:', err.message);
  }
}

// --- Internal helpers ---

async function checkAuthenticatedLimit(userId, today) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('daily_question_count, last_question_date, tier')
    .eq('id', userId)
    .single();

  if (!profile) {
    return { limited: false, remaining: DAILY_LIMIT_FREE, used: 0 };
  }

  // Premium users have no limit
  if (profile.tier === 'premium' || profile.tier === 'admin') {
    return { limited: false, remaining: 999, used: 0 };
  }

  // Reset count if it's a new day
  const count =
    profile.last_question_date === today ? profile.daily_question_count : 0;

  return {
    limited: count >= DAILY_LIMIT_FREE,
    remaining: Math.max(0, DAILY_LIMIT_FREE - count),
    used: count,
  };
}

async function checkAnonymousLimit(ip, today) {
  const { data } = await supabaseAdmin
    .from('anonymous_usage')
    .select('question_count')
    .eq('ip_address', ip)
    .eq('usage_date', today)
    .single();

  const count = data?.question_count || 0;
  return {
    limited: count >= DAILY_LIMIT_FREE,
    remaining: Math.max(0, DAILY_LIMIT_FREE - count),
    used: count,
  };
}

async function incrementAuthenticatedUsage(userId, today) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('daily_question_count, last_question_date')
    .eq('id', userId)
    .single();

  const isNewDay = !profile || profile.last_question_date !== today;
  const newCount = isNewDay ? 1 : (profile.daily_question_count || 0) + 1;

  await supabaseAdmin
    .from('profiles')
    .update({
      daily_question_count: newCount,
      last_question_date: today,
    })
    .eq('id', userId);
}

async function incrementAnonymousUsage(ip, today) {
  // Try to update existing record first
  const { data: existing } = await supabaseAdmin
    .from('anonymous_usage')
    .select('id, question_count')
    .eq('ip_address', ip)
    .eq('usage_date', today)
    .single();

  if (existing) {
    await supabaseAdmin
      .from('anonymous_usage')
      .update({ question_count: existing.question_count + 1 })
      .eq('id', existing.id);
  } else {
    await supabaseAdmin.from('anonymous_usage').insert({
      ip_address: ip,
      question_count: 1,
      usage_date: today,
    });
  }
}

module.exports = { checkRateLimit, incrementUsage, DAILY_LIMIT_FREE };
