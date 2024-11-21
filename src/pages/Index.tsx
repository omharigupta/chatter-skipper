import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff } from "lucide-react";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { ChatMessage } from "@/components/ChatMessage";
import { useVoiceChat } from "@/lib/useVoiceChat";
import { generateResponse } from "@/lib/gemini";
import { toast } from "sonner";

interface Message {
  text: string;
  isBot: boolean;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  const handleSpeechStart = useCallback(() => {
    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }
  }, []);

  const handleSpeechEnd = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;

    setMessages((prev) => [...prev, { text: transcript, isBot: false }]);
    setIsProcessing(true);

    try {
      const response = await generateResponse(transcript);
      setMessages((prev) => [...prev, { text: response, isBot: true }]);

      const utterance = new SpeechSynthesisUtterance(response);
      speechSynthesisRef.current.speak(utterance);
    } catch (error) {
      toast.error("Failed to generate response");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { isListening, startListening, stopListening } = useVoiceChat({
    onSpeechStart: handleSpeechStart,
    onSpeechEnd: handleSpeechEnd,
  });

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col p-6 backdrop-blur-lg bg-opacity-50">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message.text}
              isBot={message.isBot}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <VoiceVisualizer isActive={isListening || isProcessing} />
          <Button
            size="lg"
            className={isListening ? "bg-destructive" : ""}
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? (
              <MicOff className="w-6 h-6" />
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