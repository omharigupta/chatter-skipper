import { toast } from "sonner";

export const generateResponse = async (prompt: string) => {
  try {
    const response = await fetch('http://localhost:8000/api/chat/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: prompt }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate response');
    }

    const data = await response.json();
    return data.response;
  } catch (error: any) {
    console.error("Error generating response:", error);
    toast.error("Failed to generate response. Please try again.");
    throw new Error(error.message || "Failed to generate response");
  }
};

export const getInitialGreeting = async () => {
  const initialPrompt = "Start a therapy session with a warm, professional greeting as a therapist. Make it welcoming but not overly familiar.";
  return generateResponse(initialPrompt);
};