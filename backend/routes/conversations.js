/*
 * Conversation management routes for ADONAI AI.
 *
 * These routes let authenticated users manage their conversation history:
 *   GET    /api/conversations          - List all conversations
 *   GET    /api/conversations/:id      - Get a conversation with messages
 *   PUT    /api/conversations/:id      - Update conversation title
 *   DELETE /api/conversations/:id      - Delete a conversation
 *
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /api/conversations
 * Lists all conversations for the authenticated user.
 * Sorted by most recently updated first.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    res.json({ conversations: conversations || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/conversations/:id
 * Gets a specific conversation with all its messages.
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch conversation (verify ownership)
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Fetch messages
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgError) {
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    res.json({
      ...conversation,
      messages: messages || [],
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

/**
 * PUT /api/conversations/:id
 * Updates a conversation's title.
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { error } = await supabaseAdmin
      .from('conversations')
      .update({ title: title.trim() })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to update conversation' });
    }

    res.json({ message: 'Conversation updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

/**
 * DELETE /api/conversations/:id
 * Deletes a conversation and all its messages (CASCADE).
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete conversation' });
    }

    res.json({ message: 'Conversation deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

module.exports = router;
