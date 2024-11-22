import { useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export const useSpeechSynthesis = () => {
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const initVoice = useCallback(() => {
    const voices = synthRef.current.getVoices();
    // Prioritize natural sounding voices
    const preferredVoices = voices.filter(voice => 
      voice.localService && // Local voices often sound better
      (voice.name.includes('Natural') || // Microsoft's natural voices
       voice.name.includes('Premium') || // Premium voices
       voice.name.includes('Enhanced') || // Enhanced quality voices
       voice.name.includes('Neural')) // Neural network based voices
    );

    // Fallback to any female voice if no natural voices found
    const femaleVoice = preferredVoices.length > 0 
      ? preferredVoices[0] 
      : voices.find(voice => 
          voice.name.includes('female') || 
          voice.name.includes('Female') || 
          voice.name.includes('Samantha') ||
          voice.name.includes('Victoria')
        );

    if (femaleVoice) {
      voiceRef.current = femaleVoice;
      console.log('Selected voice:', femaleVoice.name);
    } else {
      console.warn('No suitable voice found, using default');
    }
  }, []);

  useEffect(() => {
    // Initialize voice when voices are loaded
    if (synthRef.current.getVoices().length > 0) {
      initVoice();
    }
    
    synthRef.current.onvoiceschanged = initVoice;

    return () => {
      synthRef.current.onvoiceschanged = null;
    };
  }, [initVoice]);

  const speak = useCallback((text: string) => {
    try {
      if (synthRef.current.speaking) {
        synthRef.current.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice if available
      if (voiceRef.current) {
        utterance.voice = voiceRef.current;
      }

      // Optimize speech parameters for more natural sound
      utterance.pitch = 1.0; // Natural pitch
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.volume = 1.0; // Full volume
      
      // Add slight pauses at punctuation for more natural rhythm
      text = text.replace(/([.,!?])/g, '$1 ');
      
      utterance.onend = () => {
        console.log('Speech finished');
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        toast.error('Error during speech synthesis');
      };

      synthRef.current.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      toast.error('Failed to synthesize speech');
    }
  }, []);

  const cancel = useCallback(() => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
  }, []);

  return { speak, cancel };
};