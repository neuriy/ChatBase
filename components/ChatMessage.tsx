"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  RotateCw,
} from "lucide-react";

export interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp?: string;
  attachmentName?: string;
}

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isUser = message.sender === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ("speechSynthesis" in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  if (isUser) {
    return (
      <div className="w-full flex justify-end my-3 px-2 animate-fade-in">
        <div className="max-w-[85%] sm:max-w-[75%] bg-[#e2e2e0] dark:bg-[#2a2a2c] text-neutral-900 dark:text-neutral-100 px-5 py-3 rounded-[22px] text-[14.5px] leading-relaxed shadow-xs tracking-normal">
          {message.attachmentName && (
            <div className="mb-2 text-xs font-medium bg-neutral-300/60 dark:bg-neutral-700/60 px-2.5 py-1 rounded-lg inline-block">
              📎 {message.attachmentName}
            </div>
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-start my-4 px-2 animate-fade-in">
      <div className="max-w-full text-neutral-900 dark:text-neutral-100 text-[14.5px] leading-relaxed space-y-2.5 pr-4">
        {message.content.split("\n").map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1.5" />;
          return (
            <p key={idx} className="whitespace-pre-wrap font-normal">
              {line}
            </p>
          );
        })}
      </div>

      {/* Assistant Action Bar matching reference screenshot */}
      <div className="flex items-center gap-1.5 mt-2.5 text-neutral-400 dark:text-neutral-500">
        {/* Copy */}
        <button
          onClick={handleCopy}
          title="Copy response"
          className="p-1 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-md transition-colors"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Thumbs Up */}
        <button
          onClick={() => setLiked(liked === true ? null : true)}
          title="Good response"
          className={`p-1 rounded-md transition-colors ${
            liked === true
              ? "text-blue-500"
              : "hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>

        {/* Thumbs Down */}
        <button
          onClick={() => setLiked(liked === false ? null : false)}
          title="Bad response"
          className={`p-1 rounded-md transition-colors ${
            liked === false
              ? "text-red-500"
              : "hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>

        {/* Read Aloud */}
        <button
          onClick={handleSpeak}
          title={isSpeaking ? "Stop reading" : "Read aloud"}
          className={`p-1 rounded-md transition-colors ${
            isSpeaking
              ? "text-amber-500"
              : "hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          {isSpeaking ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Regenerate */}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            title="Regenerate response"
            className="p-1 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-md transition-colors ml-0.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
