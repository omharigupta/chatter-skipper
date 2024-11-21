import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send } from "lucide-react";
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
  const [textInput, setTextInput] = useState("");
  const speechSynthesisRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  const handleSpeechStart = useCallback(() => {
    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }
  }, []);

  const handleSpeechEnd = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;
    await processMessage(transcript);
  }, []);

  const processMessage = async (message: string) => {
    setMessages((prev) => [...prev, { text: message, isBot: false }]);
    setIsProcessing(true);

    try {
      const response = await generateResponse(message);
      setMessages((prev) => [...prev, { text: response, isBot: true }]);

      const utterance = new SpeechSynthesisUtterance(response);
      speechSynthesisRef.current.speak(utterance);
    } catch (error) {
      toast.error("Failed to generate response");
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
          <div className="flex w-full gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={isProcessing}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
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