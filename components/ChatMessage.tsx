"use client";

import React, { useMemo, useState } from "react";
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  RotateCw,
  Download,
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

type Block =
  | { kind: "text"; text: string }
  | { kind: "code"; lang: string; code: string };

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const re = /```(\w+)?\n([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    if (m.index > last) {
      blocks.push({ kind: "text", text: content.slice(last, m.index) });
    }
    blocks.push({ kind: "code", lang: (m[1] || "").toLowerCase(), code: m[2] });
    last = m.index + m[0].length;
  }
  if (last < content.length) {
    blocks.push({ kind: "text", text: content.slice(last) });
  }
  return blocks.length ? blocks : [{ kind: "text", text: content }];
}

function downloadBlob(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const blocks = useMemo(() => parseBlocks(message.content), [message.content]);

  const isUser = message.sender === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const spoken = message.content
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/#{1,6}\s+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
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
      <div className="max-w-full w-full text-neutral-900 dark:text-neutral-100 text-[14.5px] leading-relaxed space-y-3 pr-2">
        {blocks.map((block, idx) => {
          if (block.kind === "text") {
            return block.text.split("\n").map((line, lineIdx) => {
              if (!line.trim()) return <div key={`${idx}-${lineIdx}`} className="h-1.5" />;
              const escaped = line
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
              const html = escaped
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(
                  /`([^`]+)`/g,
                  "<code class='font-mono text-[12.5px] bg-neutral-200/70 dark:bg-neutral-800 px-1 rounded'>$1</code>"
                );
              return (
                <p
                  key={`${idx}-${lineIdx}`}
                  className="whitespace-pre-wrap font-normal"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            });
          }

          if (block.lang === "svg") {
            return (
              <div
                key={idx}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-950"
              >
                <div
                  className="w-full max-h-[360px] overflow-auto p-2 flex justify-center bg-[#0b0f14]"
                  dangerouslySetInnerHTML={{ __html: block.code }}
                />
                <div className="flex items-center justify-between px-3 py-2 bg-neutral-100 dark:bg-neutral-900 text-[11px]">
                  <span className="text-neutral-500">SVG image</span>
                  <button
                    onClick={() =>
                      downloadBlob("neuriy-image.svg", block.code, "image/svg+xml")
                    }
                    className="flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-200"
                  >
                    <Download className="w-3.5 h-3.5" /> Download SVG
                  </button>
                </div>
              </div>
            );
          }

          if (block.lang === "html") {
            return (
              <div
                key={idx}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
              >
                <div className="flex items-center justify-between px-3 py-2 bg-neutral-100 dark:bg-neutral-900 text-[11px]">
                  <span className="text-neutral-500">HTML page</span>
                  <button
                    onClick={() =>
                      downloadBlob("neuriy-page.html", block.code, "text/html")
                    }
                    className="flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-200"
                  >
                    <Download className="w-3.5 h-3.5" /> Download HTML
                  </button>
                </div>
                <pre className="text-[11px] leading-relaxed p-3 overflow-x-auto max-h-64 bg-white dark:bg-[#121214] font-mono text-neutral-700 dark:text-neutral-300">
                  {block.code.slice(0, 4000)}
                  {block.code.length > 4000 ? "\n…" : ""}
                </pre>
              </div>
            );
          }

          return (
            <pre
              key={idx}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 p-3 overflow-x-auto text-[12px] font-mono"
            >
              {block.code}
            </pre>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 mt-2.5 text-neutral-400 dark:text-neutral-500">
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
