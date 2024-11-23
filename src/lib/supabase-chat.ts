import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface ChatMessage {
  id?: number;
  created_at?: string;
  message: string;
  is_bot: boolean;
}

// Save message without embedding
export const saveMessage = async (message: string, isBot: boolean) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ 
        message, 
        is_bot: isBot
      }])
      .select('id, created_at, message, is_bot');

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

// Fetch similar messages by falling back to recent messages
export const fetchSimilarMessages = async (message: string, limit = 5) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, created_at, message, is_bot')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as ChatMessage[];
  } catch (error) {
    console.error('Error fetching similar messages:', error);
    return [];
  }
};

export const fetchMessages = async () => {
  const { data, error } = await supabase
    .from('messages')
    .select('id, created_at, message, is_bot')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
  return data as ChatMessage[];
};