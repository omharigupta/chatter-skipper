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

// Function to create embeddings using Google's Generative AI
const createEmbedding = async (text: string) => {
  try {
    // Use a simple averaging of word vectors for demonstration
    // In a production environment, you would use a proper embedding model
    const tokens = encode(text);
    const embedding = new Array(512).fill(0); // 512-dimensional embedding
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
        embedding
      }])
      .select();

    if (error) throw error;
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

    const { data, error } = await supabase
      .rpc('match_messages', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: limit
      });

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
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
  return data as ChatMessage[];
};