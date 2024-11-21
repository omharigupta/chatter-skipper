import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send } from "lucide-react";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { ChatMessage } from "@/components/ChatMessage";
import { useVoiceChat } from "@/lib/useVoiceChat";
import { generateResponse } from "@/lib/gemini";
import { toast } from "sonner";
import { saveMessage, fetchMessages, ChatMessage as ChatMessageType } from "@/lib/supabase-chat";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState("");
  const speechSynthesisRef = useRef<SpeechSynthesis>(window.speechSynthesis);

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
    
    // Update the input field with the transcribed text
    setTextInput(transcript.trim());
    toast.info("Voice input captured! Click send or press Enter to send the message.");
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
      speechSynthesisRef.current.speak(utterance);
    } catch (error) {
      toast.error("Failed to process message");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!textInput.trim()) return;
    await processMessage(textInput);
    setTextInput("");
  };

  const { isListening, startListening, stopListening } = useVoiceChat({
    onSpeechStart: handleSpeechStart,
    onSpeechEnd: handleSpeechEnd,
  });

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col p-6 backdrop-blur-lg bg-opacity-50 shadow-lg transition-all duration-300 hover:shadow-xl border-opacity-50">
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
          <div className="flex w-full gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-primary/50 hover:border-primary/50"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isProcessing}
              className="transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </Button>
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