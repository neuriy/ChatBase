"use client";

import React from "react";
import { Message, ChatMessage } from "./ChatMessage";
import { SuggestionPills } from "./SuggestionPills";
import { ChatInput } from "./ChatInput";

interface MockupViewProps {
  emptyMessages: Message[];
  activeMessages: Message[];
  onSendMessage: (text: string, options?: { isWebSearch?: boolean; isDeepThink?: boolean; attachmentName?: string }) => void;
  onSelectSuggestion: (text: string) => void;
  onRegenerate: () => void;
}

export const MockupView: React.FC<MockupViewProps> = ({
  emptyMessages,
  activeMessages,
  onSendMessage,
  onSelectSuggestion,
  onRegenerate,
}) => {
  return (
    <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-8 py-6 px-4 max-w-6xl mx-auto animate-fade-in">
      {/* Device Frame 1: Empty State ("What can I help with?") */}
      <div className="w-full max-w-[390px] h-[780px] bg-[#ededed] dark:bg-[#18181a] rounded-[44px] border-[6px] border-[#222] dark:border-[#333] shadow-2xl overflow-hidden flex flex-col relative shrink-0">
        {/* Device Top Bar / Notch */}
        <div className="w-full px-6 pt-4 pb-2 flex items-center justify-between z-10 shrink-0">
          {/* Sidebar icon */}
          <div className="w-5 h-5 border-[1.8px] border-neutral-700 dark:border-neutral-300 rounded-[5px] flex items-center p-[2px]">
            <div className="w-[5px] h-full bg-neutral-700 dark:bg-neutral-300 rounded-[1px]" />
          </div>

          {/* Metallic Orb */}
          <div className="w-7 h-7 rounded-full metallic-orb border border-white/50" />
        </div>

        {/* Device Body */}
        <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto relative">
          {/* Centered Headline */}
          <div className="my-auto text-center py-12">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              What can I help with?
            </h1>
          </div>

          {/* Bottom Suggestion Pills & Input */}
          <div className="mt-auto space-y-3 w-full">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSelectSuggestion("What's causing this error?")}
                className="bg-neutral-200/80 dark:bg-neutral-800/80 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 text-xs font-medium p-3 rounded-2xl text-left transition-all line-clamp-2"
              >
                What's causing this error?
              </button>

              <button
                onClick={() => onSelectSuggestion("Is contrast strong enough?")}
                className="bg-neutral-200/80 dark:bg-neutral-800/80 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 text-xs font-medium p-3 rounded-2xl text-left transition-all line-clamp-2"
              >
                Is contrast strong enough?
              </button>
            </div>

            {/* Input Card */}
            <div className="bg-white dark:bg-[#202023] rounded-[24px] p-3 shadow-md border border-neutral-200/60 dark:border-neutral-800">
              <p className="text-xs text-neutral-400 mb-4">Ask anything</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-400 text-xs">
                  <span>📎</span>
                  <span>🌐</span>
                  <span>💡</span>
                  <span>...</span>
                </div>
                <div className="w-7 h-7 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-xs">
                  ↑
                </div>
              </div>
            </div>

            <p className="text-[10px] text-neutral-400 text-center">
              AI can make mistakes. Please double-check responses.
            </p>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="w-32 h-1 bg-neutral-900 dark:bg-white/40 rounded-full mx-auto mb-2 shrink-0" />
      </div>

      {/* Device Frame 2: Active Conversation Thread */}
      <div className="w-full max-w-[390px] h-[780px] bg-[#ededed] dark:bg-[#18181a] rounded-[44px] border-[6px] border-[#222] dark:border-[#333] shadow-2xl overflow-hidden flex flex-col relative shrink-0">
        {/* Device Top Bar */}
        <div className="w-full px-6 pt-4 pb-2 flex items-center justify-between z-10 shrink-0 border-b border-neutral-200/30 dark:border-neutral-800/30">
          <div className="w-5 h-5 border-[1.8px] border-neutral-700 dark:border-neutral-300 rounded-[5px] flex items-center p-[2px]">
            <div className="w-[5px] h-full bg-neutral-700 dark:bg-neutral-300 rounded-[1px]" />
          </div>

          <div className="w-7 h-7 rounded-full metallic-orb border border-white/50" />
        </div>

        {/* Device Message Thread Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {activeMessages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onRegenerate={msg.sender === "assistant" ? onRegenerate : undefined}
            />
          ))}
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 pt-1 shrink-0 bg-[#ededed] dark:bg-[#18181a]">
          <ChatInput onSendMessage={onSendMessage} />
        </div>

        {/* Home Indicator */}
        <div className="w-32 h-1 bg-neutral-900 dark:bg-white/40 rounded-full mx-auto mb-2 shrink-0" />
      </div>
    </div>
  );
};
