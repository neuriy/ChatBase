"use client";

import React, { useState, useRef, KeyboardEvent, useEffect } from "react";
import {
  Paperclip,
  Globe,
  Lightbulb,
  MoreHorizontal,
  ArrowUp,
  X,
  Code,
  Image as ImageIcon,
  Sparkles,
  Mic,
  MicOff,
} from "lucide-react";
import { AIFace } from "./AIFace";

interface ChatInputProps {
  onSendMessage: (text: string, options?: { isWebSearch?: boolean; isDeepThink?: boolean; attachmentName?: string }) => void;
  isGenerating?: boolean;
  onOpenFaceVoiceMode?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isGenerating = false,
  onOpenFaceVoiceMode,
}) => {
  const [text, setText] = useState("");
  const [isWebSearch, setIsWebSearch] = useState(false);
  const [isDeepThink, setIsDeepThink] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setText((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${currentTranscript}` : currentTranscript;
          });
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceControl = () => {
    if (!recognitionRef.current) {
      alert("Voice control is not supported by your browser. Try Google Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleSend = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if ((!text.trim() && !attachment) || isGenerating) return;
    onSendMessage(text.trim(), {
      isWebSearch,
      isDeepThink,
      attachmentName: attachment || undefined,
    });
    setText("");
    setAttachment(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0].name);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-4 animate-fade-in relative z-20">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Input Card matching Neuriy AI UI design */}
      <div className="bg-white dark:bg-[#1e1e20] rounded-[28px] p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-lg shadow-black/5 transition-all">
        {/* Active badges/attachments */}
        {(attachment || isWebSearch || isDeepThink || isListening) && (
          <div className="flex items-center gap-2 mb-2 flex-wrap text-xs">
            {isListening && (
              <span className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 px-3 py-1 rounded-full font-medium animate-pulse">
                <Mic className="w-3 h-3 text-red-500" />
                Listening to voice...
                <button
                  onClick={toggleVoiceControl}
                  className="hover:text-red-800 dark:hover:text-red-200 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {attachment && (
              <span className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-3 py-1 rounded-full font-medium">
                📎 {attachment}
                <button
                  onClick={() => setAttachment(null)}
                  className="hover:text-red-500 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {isWebSearch && (
              <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-medium">
                <Globe className="w-3 h-3" />
                Neuriy Web Search Active
                <button
                  onClick={() => setIsWebSearch(false)}
                  className="hover:text-blue-800 dark:hover:text-blue-200 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {isDeepThink && (
              <span className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full font-medium">
                <Lightbulb className="w-3 h-3" />
                Neuriy Deep Reasoning Mode
                <button
                  onClick={() => setIsDeepThink(false)}
                  className="hover:text-amber-800 dark:hover:text-amber-200 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Text Area */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          rows={1}
          className="w-full bg-transparent resize-none outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-[15px] font-normal min-h-[32px] max-h-[140px] leading-relaxed"
        />

        {/* Action Row matching screenshot */}
        <div className="flex items-center justify-between mt-3 pt-1">
          {/* Left Action Icons */}
          <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500 relative">
            {/* Attachment */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              className="p-1.5 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Web search toggle */}
            <button
              onClick={() => setIsWebSearch(!isWebSearch)}
              title="Toggle Web Search"
              className={`p-1.5 rounded-full transition-colors ${
                isWebSearch
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40"
                  : "hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <Globe className="w-4 h-4" />
            </button>

            {/* Lightbulb / Reasoning mode */}
            <button
              onClick={() => setIsDeepThink(!isDeepThink)}
              title="Toggle Deep Reasoning"
              className={`p-1.5 rounded-full transition-colors ${
                isDeepThink
                  ? "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/40"
                  : "hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <Lightbulb className="w-4 h-4" />
            </button>

            {/* Voice Control Button */}
            <button
              onClick={toggleVoiceControl}
              title={isListening ? "Stop Voice Recording" : "Voice Control"}
              className={`p-1.5 rounded-full transition-colors ${
                isListening
                  ? "text-red-500 bg-red-100 dark:bg-red-950/80 animate-pulse"
                  : "hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* More Menu (...) */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                title="More options"
                className="p-1.5 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Popover */}
              {showMoreMenu && (
                <div className="absolute bottom-9 left-0 z-50 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-2 w-48 space-y-1 animate-fade-in">
                  <button
                    onClick={() => {
                      setAttachment("screenshot-mockup.png");
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-purple-500" />
                    <span>Upload Image</span>
                  </button>

                  <button
                    onClick={() => {
                      setText((prev) => prev + "\n```ts\n// Write code here\n```");
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
                  >
                    <Code className="w-4 h-4 text-emerald-500" />
                    <span>Insert Code Block</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDeepThink(true);
                      setIsWebSearch(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Enable Neuriy Pro Search</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: AI Face Voice Mode + Circular Send Button */}
          <div className="flex items-center gap-2">
            {onOpenFaceVoiceMode && (
              <button
                onClick={onOpenFaceVoiceMode}
                title="Speak directly to AI Face"
                className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs"
              >
                <AIFace size="sm" />
              </button>
            )}

            <button
              onClick={handleSend}
              disabled={(!text.trim() && !attachment) || isGenerating}
              title="Send message to Neuriy AI"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                text.trim() || attachment
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                  : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 opacity-90 cursor-pointer"
              }`}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer disclaimer matching screenshot */}
      <p className="text-[11.5px] text-neutral-400 dark:text-neutral-500 text-center mt-2.5 tracking-normal">
        AI can make mistakes. Please double-check responses.
      </p>
    </div>
  );
};
