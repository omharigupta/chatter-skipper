import { cn } from "@/lib/utils";

interface VoiceVisualizerProps {
  isActive: boolean;
}

export const VoiceVisualizer = ({ isActive }: VoiceVisualizerProps) => {
  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-gray-300 rounded-full transition-all duration-300",
            isActive && "animate-wave",
            isActive ? "bg-primary h-full" : "h-2"
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
};