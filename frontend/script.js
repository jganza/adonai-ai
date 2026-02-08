/*
 * ADONAI AI - Frontend Client (Phase 1)
 *
 * Handles:
 * - User authentication (sign up, sign in, sign out, Google OAuth)
 * - Chat with AI (anonymous + authenticated)
 * - Conversation history (load, display, switch between conversations)
 * - Rate limit display
 *
 * The Supabase JS client is loaded from CDN in index.html.
 * Auth config (URL + anon key) is fetched from /api/auth/config.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const promptInput = document.getElementById('prompt');
  const sendBtn = document.getElementById('sendBtn');
  const responseDiv = document.getElementById('response');
  const messageHistory = document.getElementById('messageHistory');

  // Auth elements
  const authAnonymous = document.getElementById('authAnonymous');
  const authUser = document.getElementById('authUser');
  const userDisplayName = document.getElementById('userDisplayName');
  const signInBtn = document.getElementById('signInBtn');
  const signUpBtn = document.getElementById('signUpBtn');
  const signOutBtn = document.getElementById('signOutBtn');

  // Modal elements
  const authModal = document.getElementById('authModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalClose = document.getElementById('modalClose');
  const authForm = document.getElementById('authForm');
  const nameGroup = document.getElementById('nameGroup');
  const authName = document.getElementById('authName');
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authError = document.getElementById('authError');
  const authSuccess = document.getElementById('authSuccess');
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  const switchToSignUp = document.getElementById('switchToSignUp');
  const modalSwitch = document.getElementById('modalSwitch');

  // Sidebar elements
  const sidebar = document.getElementById('sidebar');
  const newChatBtn = document.getElementById('newChatBtn');
  const conversationList = document.getElementById('conversationList');

  // Rate limit
  const rateLimitInfo = document.getElementById('rateLimitInfo');

  // --- State ---
  let supabaseClient = null; // Supabase client (initialized after config fetch)
  let currentUser = null;    // Current authenticated user
  let accessToken = null;    // JWT access token
  let currentConversationId = null; // Active conversation ID
  let isSignUpMode = false;  // Is the modal in sign-up mode?
  let authConfigured = false; // Is Supabase configured on the server?

  // =====================================================
  // INITIALIZATION
  // =====================================================

  async function init() {
    // Fetch auth config from server
    try {
      const res = await fetch('/api/auth/config');
      const config = await res.json();

      if (config.configured && typeof supabase !== 'undefined') {
        authConfigured = true;
        supabaseClient = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

        // Check for existing session
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
          handleAuthSession(session);
        }

        // Listen for auth state changes (handles OAuth redirect, token refresh)
        supabaseClient.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            handleAuthSession(session);
          } else if (event === 'SIGNED_OUT') {
            handleSignOut();
          }
        });
      } else {
        // Auth not configured - hide auth buttons
        authAnonymous.style.display = 'none';
      }
    } catch (err) {
      console.warn('Could not fetch auth config:', err.message);
      authAnonymous.style.display = 'none';
    }
  }

  init();

  // =====================================================
  // AUTH FUNCTIONS
  // =====================================================

  function handleAuthSession(session) {
    currentUser = session.user;
    accessToken = session.access_token;

    // Update UI
    const name = currentUser.user_metadata?.full_name
      || currentUser.user_metadata?.name
      || currentUser.email?.split('@')[0]
      || 'User';
    userDisplayName.textContent = name;
    authAnonymous.style.display = 'none';
    authUser.style.display = 'flex';
    sidebar.classList.add('visible');

    // Close modal if open
    closeModal();

    // Load conversation history
    loadConversations();
  }

  function handleSignOut() {
    currentUser = null;
    accessToken = null;
    currentConversationId = null;

    // Update UI
    authAnonymous.style.display = 'flex';
    authUser.style.display = 'none';
    sidebar.classList.remove('visible');

    // Clear message history and show single response mode
    messageHistory.style.display = 'none';
    messageHistory.innerHTML = '';
    responseDiv.style.display = 'block';
    responseDiv.textContent = '';

    // Hide rate limit info
    rateLimitInfo.classList.remove('visible');
  }

  // --- Modal management ---

  function openModal(signUp) {
    isSignUpMode = signUp;
    modalTitle.textContent = signUp ? 'Sign Up' : 'Sign In';
    authSubmitBtn.textContent = signUp ? 'Create Account' : 'Sign In';
    nameGroup.style.display = signUp ? 'block' : 'none';
    modalSwitch.innerHTML = signUp
      ? 'Already have an account? <a id="switchToSignIn">Sign in</a>'
      : 'Don\'t have an account? <a id="switchToSignUp">Sign up</a>';

    // Re-attach switch event listener
    const switchLink = modalSwitch.querySelector('a');
    switchLink.addEventListener('click', () => openModal(!signUp));

    // Clear form
    authForm.reset();
    authError.textContent = '';
    authSuccess.textContent = '';

    authModal.classList.add('visible');
  }

  function closeModal() {
    authModal.classList.remove('visible');
    authForm.reset();
    authError.textContent = '';
    authSuccess.textContent = '';
  }

  // --- Event listeners ---

  signInBtn.addEventListener('click', () => openModal(false));
  signUpBtn.addEventListener('click', () => openModal(true));
  modalClose.addEventListener('click', closeModal);
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeModal();
  });

  signOutBtn.addEventListener('click', async () => {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    handleSignOut();
  });

  // Email/password form submit
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.textContent = '';
    authSuccess.textContent = '';
    authSubmitBtn.disabled = true;

    const email = authEmail.value.trim();
    const password = authPassword.value;

    try {
      if (isSignUpMode) {
        // Sign up
        const displayName = authName.value.trim() || email.split('@')[0];
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: displayName },
          },
        });

        if (error) throw error;

        if (data.user && !data.session) {
          // Email confirmation required
          authSuccess.textContent = 'Check your email to confirm your account, then sign in.';
        } else if (data.session) {
          // Auto-confirmed (e.g., in development)
          handleAuthSession(data.session);
        }
      } else {
        // Sign in
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        // Session handled by onAuthStateChange
      }
    } catch (err) {
      authError.textContent = err.message || 'Authentication failed';
    } finally {
      authSubmitBtn.disabled = false;
    }
  });

  // Google OAuth
  googleSignInBtn.addEventListener('click', async () => {
    if (!supabaseClient) return;
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      authError.textContent = err.message || 'Google sign-in failed';
    }
  });

  // =====================================================
  // CONVERSATION HISTORY
  // =====================================================

  async function loadConversations() {
    if (!accessToken) return;

    try {
      const res = await fetch('/api/conversations', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();

      if (data.conversations && data.conversations.length > 0) {
        renderConversationList(data.conversations);
      } else {
        conversationList.innerHTML = '<li class="no-conversations">No conversations yet</li>';
      }
    } catch (err) {
      console.warn('Failed to load conversations:', err.message);
    }
  }

  function renderConversationList(conversations) {
    conversationList.innerHTML = '';
    conversations.forEach((conv) => {
      const li = document.createElement('li');
      li.textContent = conv.title;
      li.dataset.id = conv.id;
      if (conv.id === currentConversationId) {
        li.classList.add('active');
      }

      // Click to load conversation
      li.addEventListener('click', () => loadConversation(conv.id));

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-conv';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.title = 'Delete conversation';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteConversation(conv.id);
      });
      li.appendChild(deleteBtn);

      conversationList.appendChild(li);
    });
  }

  async function loadConversation(conversationId) {
    if (!accessToken) return;

    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();

      if (data.messages) {
        currentConversationId = conversationId;

        // Switch to message history view
        messageHistory.style.display = 'flex';
        responseDiv.style.display = 'none';

        // Render messages
        renderMessages(data.messages);

        // Update active conversation in sidebar
        document.querySelectorAll('.conversation-list li').forEach((li) => {
          li.classList.toggle('active', li.dataset.id === conversationId);
        });
      }
    } catch (err) {
      console.warn('Failed to load conversation:', err.message);
    }
  }

  function renderMessages(messages) {
    messageHistory.innerHTML = '';
    messages.forEach((msg) => {
      if (msg.role === 'system') return; // Don't show system messages
      const bubble = document.createElement('div');
      bubble.className = `message-bubble ${msg.role}`;

      const label = document.createElement('div');
      label.className = 'msg-label';
      label.textContent = msg.role === 'user' ? 'You' : 'ADONAI';

      const content = document.createElement('div');
      content.textContent = msg.content;

      bubble.appendChild(label);
      bubble.appendChild(content);
      messageHistory.appendChild(bubble);
    });

    // Scroll to bottom
    messageHistory.scrollTop = messageHistory.scrollHeight;
  }

  function addMessageBubble(role, content) {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${role}`;

    const label = document.createElement('div');
    label.className = 'msg-label';
    label.textContent = role === 'user' ? 'You' : 'ADONAI';

    const contentDiv = document.createElement('div');
    contentDiv.textContent = content;

    bubble.appendChild(label);
    bubble.appendChild(contentDiv);
    messageHistory.appendChild(bubble);

    // Scroll to bottom
    messageHistory.scrollTop = messageHistory.scrollHeight;
  }

  async function deleteConversation(conversationId) {
    if (!accessToken) return;
    if (!confirm('Delete this conversation?')) return;

    try {
      await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // If we deleted the active conversation, reset the view
      if (conversationId === currentConversationId) {
        currentConversationId = null;
        messageHistory.style.display = 'none';
        messageHistory.innerHTML = '';
        responseDiv.style.display = 'block';
        responseDiv.textContent = '';
      }

      // Reload conversation list
      loadConversations();
    } catch (err) {
      console.warn('Failed to delete conversation:', err.message);
    }
  }

  // New chat button
  newChatBtn.addEventListener('click', () => {
    currentConversationId = null;
    messageHistory.style.display = 'none';
    messageHistory.innerHTML = '';
    responseDiv.style.display = 'block';
    responseDiv.textContent = '';

    // Remove active state from sidebar
    document.querySelectorAll('.conversation-list li').forEach((li) => {
      li.classList.remove('active');
    });
  });

  // =====================================================
  // CHAT / SEND MESSAGE
  // =====================================================

  async function sendPrompt() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      alert('Please enter your question');
      return;
    }

    // Disable button and show loading
    sendBtn.disabled = true;
    sendBtn.textContent = 'Seeking wisdom...';

    // If authenticated, switch to message history view
    if (currentUser) {
      if (messageHistory.style.display === 'none') {
        messageHistory.style.display = 'flex';
        messageHistory.innerHTML = '';
        responseDiv.style.display = 'none';
      }
      // Add user message bubble immediately
      addMessageBubble('user', prompt);

      // Add loading bubble
      const loadingBubble = document.createElement('div');
      loadingBubble.className = 'message-bubble assistant';
      loadingBubble.id = 'loadingBubble';
      const loadingLabel = document.createElement('div');
      loadingLabel.className = 'msg-label';
      loadingLabel.textContent = 'ADONAI';
      const loadingContent = document.createElement('div');
      loadingContent.className = 'loading';
      loadingContent.textContent = 'Contemplating your question...';
      loadingBubble.appendChild(loadingLabel);
      loadingBubble.appendChild(loadingContent);
      messageHistory.appendChild(loadingBubble);
      messageHistory.scrollTop = messageHistory.scrollHeight;
    } else {
      // Anonymous mode - use single response div
      responseDiv.textContent = 'ADONAI is contemplating your question...';
      responseDiv.className = 'loading';
    }

    // Build request
    const body = { prompt };
    if (currentConversationId) {
      body.conversationId = currentConversationId;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        if (currentUser) {
          // Remove loading bubble and add response
          const loadingEl = document.getElementById('loadingBubble');
          if (loadingEl) loadingEl.remove();
          addMessageBubble('assistant', data.message);

          // Update conversation ID (for new conversations)
          if (data.conversationId) {
            currentConversationId = data.conversationId;
            // Reload sidebar
            loadConversations();
          }
        } else {
          // Anonymous mode
          responseDiv.textContent = data.message;
          responseDiv.className = '';
        }

        // Update rate limit display
        if (data.remaining !== undefined) {
          updateRateLimitDisplay(data.remaining);
        }
      } else {
        const errorMsg = data.error || 'Something went wrong';
        if (currentUser) {
          const loadingEl = document.getElementById('loadingBubble');
          if (loadingEl) loadingEl.remove();
          addMessageBubble('assistant', 'Error: ' + errorMsg);
        } else {
          responseDiv.textContent = 'Error: ' + errorMsg;
          responseDiv.className = '';
        }
      }
    } catch (err) {
      const errorMsg = 'Error connecting to ADONAI: ' + err.message;
      if (currentUser) {
        const loadingEl = document.getElementById('loadingBubble');
        if (loadingEl) loadingEl.remove();
        addMessageBubble('assistant', errorMsg);
      } else {
        responseDiv.textContent = errorMsg;
        responseDiv.className = '';
      }
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Seek Wisdom';
      promptInput.value = '';
    }
  }

  // =====================================================
  // RATE LIMIT DISPLAY
  // =====================================================

  function updateRateLimitDisplay(remaining) {
    if (remaining === undefined || remaining > 7) {
      rateLimitInfo.classList.remove('visible', 'warning', 'exhausted');
      return;
    }

    rateLimitInfo.classList.add('visible');
    rateLimitInfo.classList.remove('warning', 'exhausted');

    if (remaining <= 0) {
      rateLimitInfo.classList.add('exhausted');
      rateLimitInfo.textContent = 'Daily question limit reached. Try again tomorrow or sign up for more.';
    } else if (remaining <= 3) {
      rateLimitInfo.classList.add('warning');
      rateLimitInfo.textContent = `${remaining} questions remaining today.`;
    } else {
      rateLimitInfo.textContent = `${remaining} questions remaining today.`;
    }
  }

  // =====================================================
  // EVENT LISTENERS (Chat)
  // =====================================================

  sendBtn.addEventListener('click', sendPrompt);

  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  });
});
