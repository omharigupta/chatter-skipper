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
    
    // Enhanced accuracy settings with optimal configuration
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5; // Increased alternatives for better accuracy
    recognition.lang = 'en-US';

    // Advanced audio settings for better quality
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1, // Mono audio for better speech recognition
          sampleRate: 48000, // Higher sample rate for better quality
          sampleSize: 16 // Standard sample size for voice
        }
      }).catch(error => {
        console.error('Error accessing microphone:', error);
        toast.error('Error accessing microphone. Please check permissions.');
      });
    }

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
      let confidenceThreshold = 0.75; // Slightly lowered threshold for better recognition
      let consecutiveHighConfidence = 0;
      let silenceTimer: NodeJS.Timeout | null = null;
      let previousTranscript = '';

      recognition.onstart = () => {
        setIsListening(true);
        onSpeechStart();
        toast.info("Listening... Speak clearly and close to the microphone");
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';

        if (silenceTimer) {
          clearTimeout(silenceTimer);
        }

        for (let i = 0; i < event.results.length; ++i) {
          const result = event.results[i];
          
          // Enhanced confidence tracking
          if (result[0].confidence >= confidenceThreshold) {
            consecutiveHighConfidence++;
            
            // If we get multiple high confidence results, lower the threshold slightly
            if (consecutiveHighConfidence > 3) {
              confidenceThreshold = Math.max(0.65, confidenceThreshold - 0.05);
            }

            if (result.isFinal) {
              const transcript = result[0].transcript.trim();
              // Check if the new transcript is significantly different
              if (!previousTranscript || 
                  (transcript.length > previousTranscript.length * 0.7)) {
                finalTranscript += transcript + ' ';
                previousTranscript = transcript;
              }
            } else {
              interimTranscript += result[0].transcript;
            }
          } else {
            consecutiveHighConfidence = 0;
            confidenceThreshold = Math.min(0.75, confidenceThreshold + 0.02);
          }
        }

        // Adaptive silence detection based on speech pattern
        const silenceDelay = finalTranscript.length > 50 ? 2000 : 1500;
        
        silenceTimer = setTimeout(() => {
          const transcript = (finalTranscript || interimTranscript).trim();
          if (transcript && transcript.length >= 2) { // Minimum length check
            onSpeechEnd(transcript);
            stopListening();
          }
        }, silenceDelay);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        const errorMessages = {
          'no-speech': "No speech detected. Please try again and speak clearly.",
          'audio-capture': "No microphone found. Ensure it's connected and permitted.",
          'not-allowed': "Microphone permission denied. Please allow access.",
          'network': "Network error. Please check your connection.",
          'aborted': "Speech recognition was aborted. Please try again.",
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