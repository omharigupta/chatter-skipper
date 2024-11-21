import React from "react";

interface VoiceVisualizerProps {
  isActive: boolean;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isActive }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-8 my-2">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-200 ${
            isActive
              ? "bg-primary animate-voice-wave"
              : "bg-muted h-2"
          }`}
          style={{
            animation: isActive
              ? `voice-wave 0.5s ease infinite ${i * 0.1}s`
              : "none",
            height: isActive ? "2rem" : "0.5rem",
          }}
        />
      ))}
    </div>
  );
};