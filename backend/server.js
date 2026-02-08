/*
 * ADONAI AI - Express Server (Phase 1)
 *
 * Serves the frontend and exposes API endpoints for:
 * - Chat with AI (anonymous + authenticated)
 * - User authentication (via Supabase)
 * - Conversation history management
 * - Rate limiting
 *
 * The server gracefully degrades: if Supabase is not configured,
 * it still works as a basic chat app (anonymous only, no history).
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { isSupabaseConfigured } = require('./config/supabase');

// Import route handlers
const chatRoutes = require('./routes/chat');
const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversations');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Trust proxy headers (needed for rate limiting behind Render/Cloudflare)
app.set('trust proxy', 1);

// --- API Routes ---
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);

// --- Static Frontend Files ---
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Serve index.html for the root route and any unmatched routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`ADONAI AI server running on http://localhost:${PORT}`);
  if (isSupabaseConfigured()) {
    console.log('Supabase: Connected (auth + history enabled)');
  } else {
    console.log('Supabase: Not configured (anonymous-only mode)');
    console.log('  Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_KEY to enable auth');
  }
});

// Export for testing
module.exports = app;
