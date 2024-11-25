from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini
genai.configure(api_key=os.getenv("VITE_GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-pro')

# Initialize Supabase
supabase: Client = create_client(
    os.getenv("VITE_SUPABASE_URL", ""),
    os.getenv("VITE_SUPABASE_ANON_KEY", "")
)

class Message(BaseModel):
    message: str
    is_bot: bool

@app.post("/api/chat/generate")
async def generate_response(message: str):
    try:
        # Fetch similar messages
        data = supabase.table('messages').select("*").order('created_at', desc=True).limit(5).execute()
        similar_messages = data.data

        # Create context from similar messages
        context = "\n".join([
            f"{'Therapist' if msg['is_bot'] else 'Patient'}: {msg['message']}"
            for msg in similar_messages
        ])

        # Generate prompt
        prompt = f"""
        You are a professional psychologist/therapist with years of experience. 
        Your approach is empathetic, patient, and non-judgmental, similar to Carl Rogers' person-centered therapy style.
        
        Previous relevant conversation context:
        {context}
        
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
        
        Based on the conversation history and current context, respond to this patient's message: {message}
        """

        # Generate response
        response = model.generate_content(prompt)
        
        if not response.text:
            raise HTTPException(status_code=500, detail="No response generated")

        return {"response": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/messages")
async def save_message(message: Message):
    try:
        data = supabase.table('messages').insert({
            "message": message.message,
            "is_bot": message.is_bot
        }).execute()
        
        return data.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/messages")
async def get_messages():
    try:
        data = supabase.table('messages').select("*").order('created_at', asc=True).execute()
        return data.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)