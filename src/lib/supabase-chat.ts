import { createClient } from '@supabase/supabase-js';
import { encode } from 'gpt-tokenizer';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface ChatMessage {
  id?: number;
  created_at?: string;
  message: string;
  is_bot: boolean;
  embedding?: number[];
}

// Function to create embeddings using a simple token-based approach
const createEmbedding = async (text: string) => {
  try {
    const tokens = encode(text);
    // Create a simple embedding by distributing token values across 512 dimensions
    const embedding = new Array(512).fill(0);
    tokens.forEach((token, index) => {
      embedding[index % 512] = token / 100; // Normalize values
    });
    return embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    return null;
  }
};

// Save message with embedding
export const saveMessage = async (message: string, isBot: boolean) => {
  try {
    const embedding = await createEmbedding(message);
    
    const { data, error } = await supabase
      .from('messages')
      .insert([{ 
        message, 
        is_bot: isBot,
        embedding: embedding || undefined
      }])
      .select('id, created_at, message, is_bot');

    if (error) {
      // If error is related to embedding column, try without it
      if (error.message.includes('embedding')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('messages')
          .insert([{ message, is_bot: isBot }])
          .select('id, created_at, message, is_bot');
        
        if (fallbackError) throw fallbackError;
        return fallbackData[0];
      }
      throw error;
    }
    return data[0];
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

// Fetch similar messages based on embedding similarity
export const fetchSimilarMessages = async (message: string, limit = 5) => {
  try {
    const embedding = await createEmbedding(message);
    if (!embedding) return [];

    try {
      const { data, error } = await supabase
        .rpc('match_messages', {
          query_embedding: embedding,
          match_threshold: 0.7,
          match_count: limit
        });

      if (error) throw error;
      return data as ChatMessage[];
    } catch (error) {
      console.error('Vector search failed, falling back to recent messages:', error);
      // Fallback to recent messages if vector search fails
      const { data: recentData, error: recentError } = await supabase
        .from('messages')
        .select('id, created_at, message, is_bot')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (recentError) throw recentError;
      return recentData as ChatMessage[];
    }
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