"use client";

import React from "react";

interface AIFaceProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const AIFace: React.FC<AIFaceProps> = ({
  isListening = false,
  isSpeaking = false,
  size = "md",
  className = "",
}) => {
  // Dimensions based on size
  const scale = size === "sm" ? 0.35 : size === "lg" ? 1.5 : 1;

  return (
    <div
      className={`relative flex flex-col items-center justify-center ${
        isListening || isSpeaking ? "animate-float-fast" : "animate-float"
      } ${className}`}
    >
      {/* Ambient glow when listening or speaking */}
      {(isListening || isSpeaking) && (
        <div
          className={`absolute rounded-full blur-3xl transition-all duration-500 ${
            isSpeaking
              ? "w-64 h-64 bg-amber-400/30 dark:bg-amber-500/20 animate-pulse"
              : "w-64 h-64 bg-blue-400/30 dark:bg-blue-500/20 animate-ping"
          }`}
        />
      )}

      {/* SVG Vector AI Face matching user's image */}
      <svg
        width={140 * scale}
        height={100 * scale}
        viewBox="0 0 140 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 transition-transform duration-300 drop-shadow-md"
      >
        {/* Left Eye (Pill shape with blinking animation) */}
        <rect
          x="40"
          y="20"
          width="18"
          height="42"
          rx="9"
          className="fill-neutral-900 dark:fill-white animate-eye-blink origin-center"
        />

        {/* Right Eye (Pill shape with blinking animation) */}
        <rect
          x="82"
          y="20"
          width="18"
          height="42"
          rx="9"
          className="fill-neutral-900 dark:fill-white animate-eye-blink origin-center"
        />

        {/* Nose / Mouth Dot (talking animation when speaking) */}
        <rect
          x="68"
          y="74"
          width="4"
          height="9"
          rx="2"
          className={`fill-neutral-900 dark:fill-white origin-center transition-all ${
            isSpeaking ? "animate-mouth-talk" : ""
          }`}
        />
      </svg>
    </div>
  );
};
