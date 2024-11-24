// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

interface UseVoiceChatProps {
  onSpeechStart: () => void;
  onSpeechEnd: (transcript: string) => void;
}

export const useVoiceChat = ({ onSpeechStart, onSpeechEnd }: UseVoiceChatProps) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const initializeRecognition = useCallback(() => {
    if (!("webkitSpeechRecognition" in window)) {
      toast.error("Speech recognition not supported. Please use Chrome.");
      return null;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true; // Enable continuous recognition
    recognition.interimResults = true; // Get interim results for better accuracy
    recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy
    recognition.lang = 'hi-IN,en-US'; // Support both Hindi and English

    return recognition;
  }, []);

  const startListening = useCallback(() => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = initializeRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;

      let finalTranscript = '';
      let lastResultTime = Date.now();

      recognition.onstart = () => {
        setIsListening(true);
        onSpeechStart();
        toast.info("Listening... Speak now");
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        lastResultTime = Date.now();

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // If we have a final transcript or it's been more than 3 seconds since the last result
        if (finalTranscript || Date.now() - lastResultTime > 3000) {
          const transcript = finalTranscript || interimTranscript;
          if (transcript.trim()) {
            onSpeechEnd(transcript.trim());
            stopListening();
          }
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        const errorMessages = {
          'no-speech': "No speech detected. Please try again.",
          'audio-capture': "No microphone found. Ensure it's connected and permitted.",
          'not-allowed': "Microphone permission denied. Please allow access.",
        };
        toast.error(errorMessages[event.error as keyof typeof errorMessages] || "Recognition error. Please try again.");
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
        if (recognitionRef.current) {
          toast.info("Stopped listening");
        }
      };

      recognition.start();
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      toast.error("Failed to start speech recognition");
      setIsListening(false);
    }
  }, [onSpeechStart, onSpeechEnd]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return { isListening, startListening, stopListening };
};