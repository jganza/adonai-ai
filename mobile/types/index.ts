export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  tier: 'free' | 'premium' | 'admin';
  daily_question_count: number;
  last_question_date: string | null;
}

export interface ChatResponse {
  message: string;
  conversationId?: string;
  remaining?: number;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}
