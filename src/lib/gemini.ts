import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { fetchSimilarMessages } from "./supabase-chat";

const model = new ChatGoogleGenerativeAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  modelName: "gemini-pro",
  maxOutputTokens: 1024, // Reduced from 2048 for faster responses
});

const createPromptTemplate = (contextHistory: string) => {
  return PromptTemplate.fromTemplate(`
    You are a professional psychologist/therapist with years of experience. 
    Your approach is empathetic, patient, and non-judgmental, similar to Carl Rogers' person-centered therapy style.
    
    Previous relevant conversation context:
    {contextHistory}
    
    Guidelines for varied responses:
    - Use a wide variety of empathetic phrases
    - Avoid repeating acknowledgment phrases
    - Never use "I hear you" more than once
    - Never use "Mmm hmm" or similar verbal acknowledgments
    - Use meaningful reflective responses
    - Use gentle encouragement when appropriate
    - Ask thoughtful follow-up questions
    - Keep responses concise but meaningful
    - Maintain a warm, professional tone
    
    Based on the conversation history and current context, respond to this patient's message: {input}
  `);
};

export const generateResponse = async (prompt: string) => {
  try {
    // Fetch similar past messages for context
    const similarMessages = await fetchSimilarMessages(prompt);
    const contextHistory = similarMessages
      .map(msg => `${msg.is_bot ? "Therapist" : "Patient"}: ${msg.message}`)
      .join("\n");

    // Create the prompt template with context
    const promptTemplate = createPromptTemplate(contextHistory);

    // Create a chain that combines the prompt template, model, and output parser
    const chain = RunnableSequence.from([
      promptTemplate,
      model,
      new StringOutputParser()
    ]);

    // Execute the chain with the input
    const response = await chain.invoke({
      input: prompt,
      contextHistory: contextHistory
    });

    return response;
  } catch (error) {
    console.error("Error generating response:", error);
    throw new Error("Failed to generate response");
  }
};

export const getInitialGreeting = async () => {
  const initialPrompt = "Start a therapy session with a warm, professional greeting as a therapist. Make it welcoming but not overly familiar.";
  return generateResponse(initialPrompt);
};