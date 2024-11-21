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

export const saveMessage = async (message: string, isBot: boolean) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ message, is_bot: isBot }])
    .select();

  if (error) throw error;
  return data[0];
};

export const fetchMessages = async () => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as ChatMessage[];
};