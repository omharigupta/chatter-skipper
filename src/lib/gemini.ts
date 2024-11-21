import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const generateResponse = async (prompt: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Add therapist context to the prompt
    const therapistContext = `
      You are a professional psychologist/therapist with years of experience. 
      Your approach is empathetic, patient, and non-judgmental, similar to Carl Rogers' person-centered therapy style.
      You should:
      - Listen actively and reflect back what you hear
      - Use therapeutic techniques like validation and open-ended questions
      - Avoid giving direct advice, instead help the patient reach their own conclusions
      - Respond with empathy and understanding
      - Use phrases like "I hear you", "That must be difficult", "I understand"
      - Sometimes use "Mmm hmm" to show you're listening
      - Keep responses relatively brief and focused
      
      Respond to this patient's message: ${prompt}
    `;

    const result = await model.generateContent(therapistContext);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating response:", error);
    throw new Error("Failed to generate response");
  }
};