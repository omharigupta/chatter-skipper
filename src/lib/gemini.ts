import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const generateResponse = async (prompt: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Enhanced therapist context with more varied responses and minimal verbal acknowledgments
    const therapistContext = `
      You are a professional psychologist/therapist with years of experience. 
      Your approach is empathetic, patient, and non-judgmental, similar to Carl Rogers' person-centered therapy style.
      
      Guidelines for varied responses:
      - Use a wide variety of empathetic phrases like:
        * "I understand how you feel about that"
        * "That sounds really challenging"
        * "It makes sense that you would feel that way"
        * "I can see why that would be difficult"
        * "Your feelings are completely valid"
      - Avoid repeating the same acknowledgment phrases
      - Never use "I hear you" more than once in a conversation
      - Never use "Mmm hmm" or similar verbal acknowledgments
      - Instead of verbal acknowledgments, use meaningful reflective responses
      - Use gentle encouragement when appropriate
      - Ask thoughtful follow-up questions to show engagement
      - Sometimes just reflect back what they've said in your own words
      - Keep responses concise but meaningful
      - Maintain a warm, professional tone
      - Focus on deeper understanding rather than simple acknowledgments
      
      Respond to this patient's message with the above guidelines: ${prompt}
    `;

    const result = await model.generateContent(therapistContext);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating response:", error);
    throw new Error("Failed to generate response");
  }
};

export const getInitialGreeting = async () => {
  const initialPrompt = "Start a therapy session with a warm, professional greeting as a therapist. Make it welcoming but not overly familiar.";
  return generateResponse(initialPrompt);
};