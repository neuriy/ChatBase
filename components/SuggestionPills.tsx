"use client";

import React from "react";

interface SuggestionPillsProps {
  onSelectSuggestion: (text: string) => void;
}

export const SUGGESTIONS = [
  "What's causing this error?",
  "Is contrast strong enough?",
  "Troubleshoot laptop slowness",
  "How to optimize web app performance",
];

export const SuggestionPills: React.FC<SuggestionPillsProps> = ({
  onSelectSuggestion,
}) => {
  return (
    <div className="w-full flex items-center justify-center gap-3 px-4 flex-wrap mb-4 animate-fade-in">
      {SUGGESTIONS.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelectSuggestion(suggestion)}
          className="bg-white/80 dark:bg-neutral-800/80 hover:bg-white dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm font-medium px-4 py-3 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-98 text-left max-w-xs"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};
