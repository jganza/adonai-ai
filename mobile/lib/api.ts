import { Config } from '../constants/Config';
import { ChatResponse, Conversation, UserProfile } from '../types';
import { supabase } from './supabase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function sendChat(
  prompt: string,
  conversationId?: string
): Promise<ChatResponse> {
  const headers = await getAuthHeaders();
  const body: Record<string, string> = { prompt };
  if (conversationId) {
    body.conversationId = conversationId;
  }

  const response = await fetch(`${Config.API_URL}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}

export async function getConversations(): Promise<Conversation[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${Config.API_URL}/api/conversations`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to load conversations');
  }

  const data = await response.json();
  return data.conversations;
}

export async function getConversation(id: string): Promise<Conversation> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${Config.API_URL}/api/conversations/${id}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to load conversation');
  }

  const data = await response.json();
  return data.conversation;
}

export async function deleteConversation(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${Config.API_URL}/api/conversations/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to delete conversation');
  }
}

export async function getProfile(): Promise<UserProfile> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${Config.API_URL}/api/auth/profile`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to load profile');
  }

  const data = await response.json();
  return data.profile;
}

export async function updateProfile(displayName: string): Promise<UserProfile> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${Config.API_URL}/api/auth/profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ displayName }),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  const data = await response.json();
  return data.profile;
}
