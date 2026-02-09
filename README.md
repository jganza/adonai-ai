# ADONAI AI - Biblical Wisdom for Modern Life

ADONAI is a web application that uses OpenAI's GPT-4o model to provide biblical wisdom for modern life. Phase 1 adds user authentication and conversation history via Supabase.

## Features

- **AI Biblical Wisdom** - Ask any life question and receive scripture-based guidance
- **User Authentication** - Email/password and Google OAuth sign-in
- **Conversation History** - All chats saved and retrievable (for signed-in users)
- **Anonymous Access** - Works without an account (limited to 10 questions/day)
- **Rate Limiting** - 10 questions/day for free-tier users
- **Graceful Degradation** - Works without Supabase configured (anonymous-only mode)

## Quick Start (Local Development)

### Prerequisites
- Node.js v18 or later (`node -v` to check)
- An OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- A Supabase account (optional, for auth + history)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Environment Variables

```bash
cp .env.example .env
```

Open `.env` in a text editor and fill in your values:

```
OPENAI_API_KEY=sk-your-actual-key
```

**Without Supabase** - The app works in anonymous-only mode (no auth, no history).

**With Supabase** - Also add:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

### Step 3: Set Up Supabase (Optional)

If you want authentication and conversation history:

1. **Create a Supabase account** at [supabase.com](https://supabase.com)
2. **Create a new project** - pick a name and region, set a database password
3. **Get your API keys**:
   - Go to Project Settings > API
   - Copy: Project URL, anon/public key, and service_role key
   - Paste them into your `.env` file
4. **Run the database schema**:
   - Go to SQL Editor in your Supabase dashboard
   - Copy the contents of `database/schema.sql`
   - Paste and click "Run"
5. **Enable Google OAuth** (optional):
   - Go to Authentication > Providers > Google
   - Enable it
   - Add your Google OAuth client ID and secret
   - ([Google Cloud Console guide](https://developers.google.com/identity/protocols/oauth2))
6. **Configure redirect URLs**:
   - Go to Authentication > URL Configuration
   - Add `http://localhost:3000` to Redirect URLs (for local dev)
   - Add your production URL (e.g., `https://adonai-ai.onrender.com`) to Redirect URLs

### Step 4: Start the App

```bash
npm start
```

Open `http://localhost:3000` in your browser.

## Testing

```bash
npm test
```

## Project Structure

```
adonai-ai/
├── backend/
│   ├── config/
│   │   └── supabase.js        # Supabase client configuration
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication middleware
│   │   └── rateLimit.js        # Daily rate limiting
│   ├── routes/
│   │   ├── auth.js             # Auth config & profile endpoints
│   │   ├── chat.js             # Main chat endpoint with history
│   │   └── conversations.js    # Conversation CRUD operations
│   ├── openaiService.js        # OpenAI API integration (V2 instructions)
│   └── server.js               # Express server entry point
├── frontend/
│   ├── index.html              # Main UI with auth modal & history sidebar
│   └── script.js               # Client-side auth, chat, and history logic
├── database/
│   └── schema.sql              # SQL schema to run in Supabase SQL Editor
├── test/
│   ├── run-tests.js            # Test runner
│   └── openaiService.test.js   # OpenAI service tests
├── .env.example                # Template for environment variables
├── package.json                # Dependencies and scripts
├── render.yaml                 # Render.com deployment config
└── README.md                   # This file
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/chat` | Optional | Send a question, get biblical wisdom |
| GET | `/api/auth/config` | No | Get Supabase public config for frontend |
| GET | `/api/auth/profile` | Required | Get current user's profile |
| PUT | `/api/auth/profile` | Required | Update display name |
| GET | `/api/conversations` | Required | List all conversations |
| GET | `/api/conversations/:id` | Required | Get conversation with messages |
| PUT | `/api/conversations/:id` | Required | Update conversation title |
| DELETE | `/api/conversations/:id` | Required | Delete a conversation |

### Chat API Example

```bash
# Anonymous chat (no auth header)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What does the Bible say about worry?"}'

# Authenticated chat (with Supabase JWT)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -d '{"prompt": "What does the Bible say about worry?"}'

# Continue a conversation
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -d '{"prompt": "Can you elaborate on that?", "conversationId": "uuid-here"}'
```

## Deploying to Render.com

1. **Push code to GitHub** (if not already done)
2. **Add environment variables** in your Render dashboard:
   - `OPENAI_API_KEY` - Your OpenAI key
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon key
   - `SUPABASE_SERVICE_KEY` - Your Supabase service role key
3. **Deploy** - Render auto-deploys when you push to the connected branch
4. **Add production URL to Supabase**:
   - Go to Supabase > Authentication > URL Configuration
   - Add `https://adonai-ai.onrender.com` (or your custom domain) to Redirect URLs

## How It Works

### Anonymous Users
- Can ask questions immediately (no sign-in required)
- Limited to 10 questions per day (tracked by IP address)
- Conversations are NOT saved

### Authenticated Users
- Sign in with email/password or Google
- All conversations are saved to the database
- Can view, continue, and delete past conversations
- Limited to 10 questions per day (free tier)
- Conversation history appears in a sidebar

### Graceful Degradation
If Supabase environment variables are not set:
- The app works in anonymous-only mode
- Auth buttons are hidden
- Chat works normally (just no history or accounts)
- This is useful for quick local testing with just an OpenAI key
