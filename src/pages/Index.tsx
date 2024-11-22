import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, RefreshCw } from "lucide-react";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { ChatMessage } from "@/components/ChatMessage";
import { useVoiceChat } from "@/lib/useVoiceChat";
import { generateResponse, getInitialGreeting } from "@/lib/gemini";
import { toast } from "sonner";
import { saveMessage, fetchMessages, ChatMessage as ChatMessageType } from "@/lib/supabase-chat";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState("");
  const speechSynthesisRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Initialize speech synthesis with female voice
  useEffect(() => {
    const initVoice = () => {
      const voices = speechSynthesisRef.current.getVoices();
      const femaleVoice = voices.find(
        voice => voice.name.includes('female') || 
                voice.name.includes('Female') || 
                voice.name.includes('Samantha') ||
                voice.name.includes('Victoria')
      );
      if (femaleVoice) {
        console.log('Selected voice:', femaleVoice.name);
      }
      return femaleVoice;
    };

    // Wait for voices to be loaded
    speechSynthesisRef.current.onvoiceschanged = () => {
      initVoice();
    };

    // Initial voice check
    initVoice();
  }, []);

  const { data: initialMessages } = useQuery({
    queryKey: ['messages'],
    queryFn: fetchMessages,
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const handleSpeechStart = useCallback(() => {
    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }
  }, []);

  const handleSpeechEnd = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;
    setTextInput(transcript.trim());
    toast.info("Voice input captured! Message will be sent automatically after 2 seconds of pause.");
  }, []);

  const processMessage = async (message: string) => {
    try {
      const userMessage = await saveMessage(message, false);
      setMessages((prev) => [...prev, userMessage]);
      setIsProcessing(true);

      const response = await generateResponse(message);
      const botMessage = await saveMessage(response, true);
      setMessages((prev) => [...prev, botMessage]);

      const utterance = new SpeechSynthesisUtterance(response);
      // Set female voice for the utterance
      const voices = speechSynthesisRef.current.getVoices();
      const femaleVoice = voices.find(
        voice => voice.name.includes('female') || 
                voice.name.includes('Female') || 
                voice.name.includes('Samantha') ||
                voice.name.includes('Victoria')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      speechSynthesisRef.current.speak(utterance);
    } catch (error) {
      toast.error("Failed to process message");
    } finally {
      setIsProcessing(false);
    }
  };

  const startNewSession = async () => {
    try {
      setMessages([]);
      setTextInput("");
      if (speechSynthesisRef.current.speaking) {
        speechSynthesisRef.current.cancel();
      }
      
      const greeting = await getInitialGreeting();
      const botMessage = await saveMessage(greeting, true);
      setMessages([botMessage]);
      
      const utterance = new SpeechSynthesisUtterance(greeting);
      // Set female voice for the greeting
      const voices = speechSynthesisRef.current.getVoices();
      const femaleVoice = voices.find(
        voice => voice.name.includes('female') || 
                voice.name.includes('Female') || 
                voice.name.includes('Samantha') ||
                voice.name.includes('Victoria')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      speechSynthesisRef.current.speak(utterance);
      
      toast.success("Started a new therapy session");
    } catch (error) {
      toast.error("Failed to start new session");
    }
  };

  // Start session with initial greeting when component mounts
  useEffect(() => {
    if (!initialMessages?.length) {
      startNewSession();
    }
  }, [initialMessages]);

  useEffect(() => {
    if (textInput.trim()) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        processMessage(textInput);
        setTextInput("");
      }, 2000); // Changed from 5000 to 2000 milliseconds
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [textInput]);

  const { isListening, startListening, stopListening } = useVoiceChat({
    onSpeechStart: handleSpeechStart,
    onSpeechEnd: handleSpeechEnd,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col p-6 backdrop-blur-lg bg-opacity-50 shadow-lg transition-all duration-300 hover:shadow-xl border-opacity-50">
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={startNewSession}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            New Session
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className="animate-fade-in"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <ChatMessage message={message.message} isBot={message.is_bot} />
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="flex w-full">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message... (Auto-sends after 2 seconds)"
              className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-primary/50 hover:border-primary/50"
            />
          </div>
          <VoiceVisualizer isActive={isListening || isProcessing} />
          <Button
            size="lg"
            className={`transition-all duration-300 hover:scale-105 active:scale-95 ${
              isListening
                ? "bg-destructive hover:bg-destructive/90"
                : "hover:bg-primary/90"
            }`}
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? (
              <MicOff className="w-6 h-6 animate-pulse" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Index;