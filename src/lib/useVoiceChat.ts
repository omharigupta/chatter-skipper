// Type declarations for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event & { error: string }) => void;
  onend: (event: Event) => void;
  start(): void;
  stop(): void;
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

  const startListening = useCallback(() => {
    try {
      if (!("webkitSpeechRecognition" in window)) {
        toast.error("Speech recognition is not supported in this browser. Please use Chrome.");
        return;
      }

      recognitionRef.current = new window.webkitSpeechRecognition();
      const recognition = recognitionRef.current;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Set language explicitly

      recognition.onstart = () => {
        setIsListening(true);
        onSpeechStart();
        toast.info("Listening... Speak now");
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");

        if (event.results[0].isFinal) {
          if (transcript.trim()) {
            onSpeechEnd(transcript);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        switch (event.error) {
          case 'no-speech':
            toast.error("No speech was detected. Please try again.");
            break;
          case 'audio-capture':
            toast.error("No microphone was found. Ensure it's connected and permitted.");
            break;
          case 'not-allowed':
            toast.error("Microphone permission was denied. Please allow microphone access.");
            break;
          default:
            toast.error("Error with speech recognition. Please try again.");
        }
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

  return {
    isListening,
    startListening,
    stopListening,
  };
};