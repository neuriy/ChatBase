"use client";

import React from "react";

interface NeuriyLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const NeuriyLogoMark: React.FC<{ className?: string; size?: number }> = ({
  className = "w-6 h-6",
  size = 24,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left vertical bar with 45-degree top cut */}
      <path
        d="M20 32 L30 42 L30 82 L20 82 Z"
        fill="currentColor"
      />

      {/* Main diagonal stroke with angled ends */}
      <path
        d="M24 22 L34 12 L84 62 L74 72 Z"
        fill="currentColor"
      />

      {/* Top right corner frame (top horizontal bar + right vertical bar) */}
      <path
        d="M35 12 L84 12 L84 68 L74 58 L74 22 L35 22 Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const NeuriyLogo: React.FC<NeuriyLogoProps> = ({
  className = "",
  size = 24,
  showText = true,
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="text-neutral-800 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center justify-center">
        <NeuriyLogoMark size={size} />
      </div>

      {showText && (
        <span className="font-light tracking-tight text-neutral-900 dark:text-white text-lg font-sans">
          Neuriy
        </span>
      )}
    </div>
  );
};
