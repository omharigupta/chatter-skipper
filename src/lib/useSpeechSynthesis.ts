import { useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export const useSpeechSynthesis = () => {
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const initVoice = useCallback(() => {
    const voices = synthRef.current.getVoices();
    
    // Prioritize Hindi voices first
    const hindiVoice = voices.find(voice => 
      voice.lang.includes('hi-IN') || // Hindi (India)
      voice.name.toLowerCase().includes('hindi')
    );

    // Fallback to natural sounding voices if no Hindi voice is available
    const preferredVoices = voices.filter(voice => 
      voice.localService && 
      (voice.name.includes('Natural') ||
       voice.name.includes('Premium') ||
       voice.name.includes('Enhanced') ||
       voice.name.includes('Neural'))
    );

    if (hindiVoice) {
      voiceRef.current = hindiVoice;
      console.log('Selected Hindi voice:', hindiVoice.name);
    } else if (preferredVoices.length > 0) {
      voiceRef.current = preferredVoices[0];
      console.log('Selected fallback voice:', preferredVoices[0].name);
    } else {
      console.warn('No suitable voice found, using default');
    }
  }, []);

  useEffect(() => {
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
      
      if (voiceRef.current) {
        utterance.voice = voiceRef.current;
      }

      // Optimize speech parameters for Hindi pronunciation
      utterance.pitch = 1.0;
      utterance.rate = 0.85; // Slightly slower for clearer pronunciation
      utterance.volume = 1.0;
      
      // Add pauses for better word separation in Hindi
      text = text.replace(/([।,!?])/g, '$1 ');
      
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