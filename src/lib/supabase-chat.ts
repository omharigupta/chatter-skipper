export interface ChatMessage {
  id?: number;
  created_at?: string;
  message: string;
  is_bot: boolean;
}

export const saveMessage = async (message: string, isBot: boolean) => {
  try {
    const response = await fetch('http://localhost:8000/api/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, is_bot: isBot }),
    });

    if (!response.ok) {
      throw new Error('Failed to save message');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

export const fetchSimilarMessages = async (message: string, limit = 5) => {
  try {
    const response = await fetch('http://localhost:8000/api/chat/messages');
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    const data = await response.json();
    return data.slice(-limit) as ChatMessage[];
  } catch (error) {
    console.error('Error fetching similar messages:', error);
    return [];
  }
};

export const fetchMessages = async () => {
  const response = await fetch('http://localhost:8000/api/chat/messages');
  if (!response.ok) {
    console.error('Error fetching messages:', response.statusText);
    throw new Error('Failed to fetch messages');
  }
  return await response.json() as ChatMessage[];
};