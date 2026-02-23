export const Config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://adonai-ai.onrender.com',
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  DAILY_FREE_LIMIT: 10,
  APP_NAME: 'ADONAI GUIDE',
} as const;
