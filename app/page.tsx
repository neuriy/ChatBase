"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChatMessage, Message } from "@/components/ChatMessage";
import { SuggestionPills } from "@/components/SuggestionPills";
import { ChatInput } from "@/components/ChatInput";
import { ChatShell } from "@/components/ChatShell";
import { AIFaceVoiceMode } from "@/components/AIFaceVoiceMode";
import { AuthGate } from "@/components/AuthGate";
import {
  loadSettings,
  type SettingsState,
} from "@/components/SettingsPage";
import { ChatHistoryItem } from "@/components/Sidebar";
import { RefreshCw, Wrench } from "lucide-react";

export default function Home() {
  return (
    <AuthGate>
      <ChatApp />
    </AuthGate>
  );
}

function ChatApp() {
  const router = useRouter();
  const [isFaceVoiceModeOpen, setIsFaceVoiceModeOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toolPhase, setToolPhase] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [settings, setSettings] = useState<SettingsState>({
    model: "pro",
    temperature: 0.7,
    webSearchDefault: false,
    systemPrompt: "",
    userName: "User",
    isDarkMode: false,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("chat-" + Date.now());
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    const pending = sessionStorage.getItem("neuriy_pending_prompt");
    if (pending) {
      sessionStorage.removeItem("neuriy_pending_prompt");
      void handleSendMessage(pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onClear = () => {
      setHistory([]);
      setMessages([]);
    };
    window.addEventListener("neuriy:clear-history", onClear);
    return () => window.removeEventListener("neuriy:clear-history", onClear);
  }, []);

  useEffect(() => {
    if (isFaceVoiceModeOpen) document.title = "Neuriy | Voice Assistant Mode";
    else if (toolPhase) document.title = "Neuriy | Marketplace tool…";
    else if (isGenerating) document.title = "Neuriy | Thinking...";
    else if (messages.length === 0) document.title = "Neuriy | What can I help with?";
    else {
      const currentItem = history.find((h) => h.id === activeChatId);
      document.title = `Neuriy | ${currentItem ? currentItem.title : "Chat"}`;
    }
  }, [
    isFaceVoiceModeOpen,
    isGenerating,
    toolPhase,
    messages,
    history,
    activeChatId,
  ]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isGenerating, toolPhase]);

  const handleNewChat = () => {
    setActiveChatId("chat-" + Date.now());
    setMessages([]);
    setChatError(null);
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setMessages([]);
  };

  const handleDeleteChat = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (activeChatId === id) handleNewChat();
  };

  const getModelLabel = () => {
    switch (settings.model) {
      case "flash":
        return "Neuriy 1.1 Flash";
      case "reasoning":
        return "Neuriy DeepReasoning";
      case "code":
        return "Neuriy Code 1.1";
      default:
        return "Neuriy 1.1 Pro";
    }
  };

  const handleSendMessage = async (
    text: string,
    options?: {
      isWebSearch?: boolean;
      isDeepThink?: boolean;
      attachmentName?: string;
    }
  ): Promise<string | null> => {
    const userMsg: Message = {
      id: "u-" + Date.now(),
      sender: "user",
      content: text,
      attachmentName: options?.attachmentName,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsGenerating(true);
    setToolPhase(/marketplace|neuriy\s+app|find\s+app|dataset|catalog/i.test(text));
    setChatError(null);

    if (messages.length === 0) {
      setHistory((prev) => [
        {
          id: activeChatId,
          title: text.slice(0, 30) + (text.length > 30 ? "..." : ""),
          timestamp: "Just now",
          preview: text,
        },
        ...prev,
      ]);
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.content,
          })),
          model: settings.model,
          temperature: settings.temperature,
          webSearch: options?.isWebSearch || settings.webSearchDefault,
          deepThink: options?.isDeepThink || settings.model === "reasoning",
        }),
        signal: ctrl.signal,
      });

      if (res.status === 401) {
        setChatError("Sessie verlopen. Log opnieuw in.");
        setIsGenerating(false);
        setToolPhase(false);
        return null;
      }

      const data = await res.json();
      if (!res.ok) {
        setChatError(data.error || "Er ging iets mis.");
        setIsGenerating(false);
        setToolPhase(false);
        return null;
      }

      setToolPhase(false);
      const reply = String(data.reply || "");
      setMessages((prev) => [
        ...prev,
        {
          id: data.id || "a-" + Date.now(),
          sender: "assistant",
          content: reply,
        },
      ]);
      return reply;
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setChatError("Verzoek geannuleerd.");
      } else {
        setChatError(
          "AI tijdelijk niet beschikbaar. Probeer het zo opnieuw — de chat blijft werken."
        );
      }
      return null;
    } finally {
      setIsGenerating(false);
      setToolPhase(false);
    }
  };

  const handleSelectSuggestion = (suggestionText: string) => {
    void handleSendMessage(suggestionText);
  };

  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === "user");
    if (lastUserMsg) void handleSendMessage(lastUserMsg.content);
  };

  const handleAbort = () => abortRef.current?.abort();

  return (
    <ChatShell
      history={history}
      activeChatId={activeChatId}
      onSelectChat={handleSelectChat}
      onNewChat={handleNewChat}
      onDeleteChat={handleDeleteChat}
      activeModelName={getModelLabel()}
    >
      {isFaceVoiceModeOpen && (
        <AIFaceVoiceMode
          onClose={() => setIsFaceVoiceModeOpen(false)}
          onSendMessage={handleSendMessage}
        />
      )}

      <main className="flex-1 flex flex-col justify-between max-w-3xl w-full mx-auto px-4 pt-4 pb-2">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-between py-12 items-center text-center my-auto">
            <div className="my-auto space-y-3">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                What can I help with?
              </h1>
              <p className="text-sm text-neutral-500 max-w-md mx-auto">
                Neuriy AI · powered by ElloFive. Browse the{" "}
                <button
                  type="button"
                  onClick={() => router.push("/marketplace")}
                  className="text-[#1e6fff] font-medium underline-offset-2 hover:underline"
                >
                  Marketplace
                </button>{" "}
                for tools the AI can use.
              </p>
            </div>
            <div className="w-full mt-auto pt-8">
              <SuggestionPills onSelectSuggestion={handleSelectSuggestion} />
            </div>
          </div>
        ) : (
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto py-6 px-2 space-y-4 max-h-[calc(100vh-210px)]"
          >
            {messages.map((msg, idx) => {
              const prevUser =
                [...messages.slice(0, idx)]
                  .reverse()
                  .find((m) => m.sender === "user")?.content || "";
              return (
              <ChatMessage
                key={msg.id}
                message={msg}
                userPrompt={msg.sender === "assistant" ? prevUser : undefined}
                onRegenerate={
                  msg.sender === "assistant" ? handleRegenerate : undefined
                }
              />
              );
            })}

            {toolPhase && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 py-2">
                <Wrench className="w-3.5 h-3.5" />
                <span>Marketplace tool active…</span>
              </div>
            )}

            {isGenerating && !toolPhase && (
              <div className="flex items-center gap-2 text-xs text-neutral-400 py-2 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-600 dark:text-neutral-300" />
                <span>Neuriy AI is typing response...</span>
                <button
                  onClick={handleAbort}
                  className="ml-2 underline text-neutral-500"
                >
                  Cancel
                </button>
              </div>
            )}

            {chatError && (
              <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl px-3 py-2">
                {chatError}
              </div>
            )}
          </div>
        )}

        <div className="sticky bottom-0 pt-2 bg-gradient-to-t from-[#ededed] via-[#ededed] dark:from-[#121214] dark:via-[#121214] to-transparent">
          <ChatInput
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            onOpenFaceVoiceMode={() => setIsFaceVoiceModeOpen(true)}
          />
        </div>
      </main>
    </ChatShell>
  );
}
