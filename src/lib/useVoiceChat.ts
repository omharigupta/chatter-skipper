// Type declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: 'no-speech' | 'audio-capture' | 'not-allowed' | string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
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

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
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
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = 'hi-IN,en-US';

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
      let silenceTimer: NodeJS.Timeout | null = null;

      recognition.onstart = () => {
        setIsListening(true);
        onSpeechStart();
        toast.info("Listening... Speak now");
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        lastResultTime = Date.now();

        // Clear any existing silence timer
        if (silenceTimer) {
          clearTimeout(silenceTimer);
        }

        for (let i = 0; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Set a new silence timer
        silenceTimer = setTimeout(() => {
          const transcript = finalTranscript || interimTranscript;
          if (transcript.trim()) {
            onSpeechEnd(transcript.trim());
            stopListening();
          }
        }, 3000); // 3 seconds of silence
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