import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isBot: boolean;
}

export const ChatMessage = ({ message, isBot }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isBot ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2",
          isBot
            ? "bg-chat-bubble text-chat-text"
            : "bg-primary text-primary-foreground"
        )}
      >
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};