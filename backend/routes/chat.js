/*
 * Chat route for ADONAI AI.
 *
 * Handles the main chat endpoint with support for:
 * - Anonymous users (no history saved, still rate-limited)
 * - Authenticated users (history saved to Supabase)
 * - Conversation context (multi-turn conversations)
 * - Rate limiting for both user types
 *
 * Route:
 *   POST /api/chat
 *     Body: { prompt, conversationId? }
 *     Headers: Authorization: Bearer <token> (optional)
 *     Response: { message, conversationId? }
 */

const express = require('express');
const router = express.Router();
const { generateResponse } = require('../openaiService');
const { optionalAuth } = require('../middleware/auth');
const { checkRateLimit, incrementUsage } = require('../middleware/rateLimit');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// Maximum number of previous messages to include as context
const MAX_HISTORY_MESSAGES = 20;

/**
 * POST /api/chat
 * Main chat endpoint - works for both anonymous and authenticated users.
 */
router.post('/', optionalAuth, checkRateLimit, async (req, res) => {
  try {
    const { prompt, conversationId } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const trimmedPrompt = prompt.trim();
    let history = [];
    let activeConversationId = conversationId || null;

    // If authenticated and Supabase is configured, handle conversation history
    if (req.user && isSupabaseConfigured()) {
      // Load existing conversation history if conversationId provided
      if (activeConversationId) {
        history = await loadConversationHistory(activeConversationId, req.user.id);
      } else {
        // Create a new conversation
        activeConversationId = await createConversation(req.user.id, trimmedPrompt);
      }

      // Save the user's message
      if (activeConversationId) {
        await saveMessage(activeConversationId, 'user', trimmedPrompt);
      }
    }

    // Generate AI response with conversation history context
    const message = await generateResponse(trimmedPrompt, history);

    // Save the assistant's response (if authenticated)
    if (req.user && isSupabaseConfigured() && activeConversationId) {
      await saveMessage(activeConversationId, 'assistant', message);
      // Update the conversation's updated_at timestamp
      await supabaseAdmin
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversationId);
    }

    // Increment rate limit usage counter
    await incrementUsage(req);

    // Build response
    const response = { message };
    if (req.user && activeConversationId) {
      response.conversationId = activeConversationId;
    }
    if (req.rateLimitInfo) {
      response.remaining = req.rateLimitInfo.remaining - 1;
    }

    res.json(response);
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Helper functions ---

/**
 * Creates a new conversation in the database.
 * Uses the first ~50 chars of the prompt as the title.
 */
async function createConversation(userId, firstPrompt) {
  const title =
    firstPrompt.length > 50
      ? firstPrompt.substring(0, 50) + '...'
      : firstPrompt;

  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      user_id: userId,
      title,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create conversation:', error.message);
    return null;
  }
  return data.id;
}

/**
 * Loads the conversation history for context.
 * Returns messages in the format expected by OpenAI: [{role, content}]
 * Only loads the most recent MAX_HISTORY_MESSAGES messages.
 */
async function loadConversationHistory(conversationId, userId) {
  // Verify the conversation belongs to this user
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();

  if (!conv) return [];

  const { data: messages, error } = await supabaseAdmin
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(MAX_HISTORY_MESSAGES);

  if (error || !messages) return [];

  return messages.map((m) => ({ role: m.role, content: m.content }));
}

/**
 * Saves a message to the database.
 */
async function saveMessage(conversationId, role, content) {
  const { error } = await supabaseAdmin.from('messages').insert({
    conversation_id: conversationId,
    role,
    content,
  });

  if (error) {
    console.error('Failed to save message:', error.message);
  }
}

module.exports = router;
