"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Sidebar, ChatHistoryItem } from "@/components/Sidebar";
import { ChatMessage, Message } from "@/components/ChatMessage";
import { SuggestionPills } from "@/components/SuggestionPills";
import { ChatInput } from "@/components/ChatInput";
import { SettingsModal, SettingsState } from "@/components/SettingsModal";
import { AIFaceVoiceMode } from "@/components/AIFaceVoiceMode";
import { RefreshCw } from "lucide-react";

// Initial demo messages
const MOCKUP_CONVERSATION: Message[] = [
  {
    id: "m1",
    sender: "assistant",
    content:
      "Let's troubleshoot like tech ninjas 🥷💻\nFirst question: Did you install or update anything recently?",
  },
  {
    id: "m2",
    sender: "user",
    content: "I installed a few Chrome extensions and updated Zoom.",
  },
  {
    id: "m3",
    sender: "assistant",
    content:
      "Chrome extensions... the usual suspects. 🕵️\nLet's try this:\n1. Disable unnecessary extensions\n2. Clear browser cache\n3. Restart your laptop\nAlso, how's your disk space looking?",
  },
  {
    id: "m4",
    sender: "user",
    content: "Pretty full. Like, 12GB left on a 256GB SSD.",
  },
  {
    id: "m5",
    sender: "assistant",
    content:
      "Yep, your laptop's gasping for space.\nTry cleaning up large files or\noffloading to the cloud.",
  },
];

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFaceVoiceModeOpen, setIsFaceVoiceModeOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<SettingsState>({
    model: "pro",
    temperature: 0.7,
    webSearchDefault: false,
    systemPrompt: "",
    userName: "User",
    isDarkMode: false,
  });

  // Active chat state
  const [messages, setMessages] = useState<Message[]>(MOCKUP_CONVERSATION);
  const [activeChatId, setActiveChatId] = useState<string>("demo-1");

  // History list
  const [history, setHistory] = useState<ChatHistoryItem[]>([
    {
      id: "demo-1",
      title: "Tech Ninjas Troubleshooting",
      timestamp: "Just now",
      preview: "Yep, your laptop's gasping for space...",
    },
    {
      id: "demo-2",
      title: "UI Contrast & Accessibility",
      timestamp: "2 hours ago",
      preview: "Evaluating AA & AAA contrast ratios...",
    },
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // On mount: sync theme with localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem("neuriy_theme");
    const isDark =
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDarkMode(isDark);
    setSettings((prev) => ({ ...prev, isDarkMode: isDark }));

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Update browser document title dynamically: Neuriy | {what user doing}
  useEffect(() => {
    if (isFaceVoiceModeOpen) {
      document.title = "Neuriy | Voice Assistant Mode";
    } else if (isSettingsOpen) {
      document.title = "Neuriy | Settings";
    } else if (isGenerating) {
      document.title = "Neuriy | Thinking...";
    } else if (messages.length === 0) {
      document.title = "Neuriy | What can I help with?";
    } else {
      const currentItem = history.find((h) => h.id === activeChatId);
      const title = currentItem ? currentItem.title : "Tech Ninjas Troubleshooting";
      document.title = `Neuriy | ${title}`;
    }
  }, [isFaceVoiceModeOpen, isSettingsOpen, isGenerating, messages, history, activeChatId]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      setSettings((s) => ({ ...s, isDarkMode: next }));
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("neuriy_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("neuriy_theme", "light");
      }
      return next;
    });
  };

  const handleSaveSettings = (newSettings: SettingsState) => {
    setSettings(newSettings);
    if (newSettings.isDarkMode !== isDarkMode) {
      handleToggleDarkMode();
    }
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  // Start new empty chat
  const handleNewChat = () => {
    const newId = "chat-" + Date.now();
    setActiveChatId(newId);
    setMessages([]);
  };

  // Load exact mockup demo
  const handleLoadMockupDemo = () => {
    setActiveChatId("demo-1");
    setMessages(MOCKUP_CONVERSATION);
  };

  // Select chat from history
  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    if (id === "demo-1") {
      setMessages(MOCKUP_CONVERSATION);
    } else if (id === "demo-2") {
      setMessages([
        {
          id: "c1",
          sender: "user",
          content: "Is contrast strong enough in this UI design?",
        },
        {
          id: "c2",
          sender: "assistant",
          content:
            "Analyzing contrast ratios:\n• Foreground (#1c1c1e) on Background (#ededed) yields a ratio of 14.2:1 (Passes WCAG AAA ✅).\n• Subtle text (#8e8e93) yields 4.6:1 (Passes WCAG AA for normal body text ✅).",
        },
      ]);
    } else {
      setMessages([]);
    }
  };

  // Delete chat item
  const handleDeleteChat = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (activeChatId === id) {
      handleNewChat();
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    handleNewChat();
  };

  // Model Display Label
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

  // Send message logic with smart AI responses
  const handleSendMessage = (
    text: string,
    options?: {
      isWebSearch?: boolean;
      isDeepThink?: boolean;
      attachmentName?: string;
    }
  ) => {
    const userMsg: Message = {
      id: "u-" + Date.now(),
      sender: "user",
      content: text,
      attachmentName: options?.attachmentName,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsGenerating(true);

    if (messages.length === 0) {
      const newHistoryItem: ChatHistoryItem = {
        id: activeChatId,
        title: text.slice(0, 30) + (text.length > 30 ? "..." : ""),
        timestamp: "Just now",
        preview: text,
      };
      setHistory((prev) => [newHistoryItem, ...prev]);
    }

    setTimeout(() => {
      let replyText = "";
      const lower = text.toLowerCase();

      if (lower.includes("error") || lower.includes("causing")) {
        replyText =
          "Let's trace the root cause! 🔍⚡\n1. Check your browser console or terminal logs for exact stack traces.\n2. Ensure all package dependencies are synchronized (`npm install`).\n3. Verify component prop types and undefined state references.";
      } else if (lower.includes("contrast") || lower.includes("color")) {
        replyText =
          "Great design check! 🎨✨\nYour primary text (#1c1c1e) against background (#ededed) achieves a crisp 14:1 contrast ratio, ensuring high legibility across screens.";
      } else if (lower.includes("space") || lower.includes("disk")) {
        replyText =
          "Freeing up disk space will drastically improve system responsiveness! 🚀\nTry cleaning up large files or offloading to the cloud.";
      } else {
        replyText = `Got it! Powered by ${getModelLabel()} ✨\n${
          options?.isDeepThink || settings.model === "reasoning"
            ? "Neuriy Deep reasoning complete 💡\n"
            : ""
        }${
          options?.isWebSearch || settings.webSearchDefault
            ? "Searched the web 🌐\n"
            : ""
        }Here is a breakdown for "${text}":\n• Clean modular component structure.\n• Crisp legibility & organic rounded containers.\n• Ask anything else whenever you're ready! 🥷✨`;
      }

      const assistantMsg: Message = {
        id: "a-" + Date.now(),
        sender: "assistant",
        content: replyText,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsGenerating(false);
    }, 900);
  };

  const handleSelectSuggestion = (suggestionText: string) => {
    handleSendMessage(suggestionText);
  };

  const handleRegenerate = () => {
    if (messages.length === 0) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === "user");
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#ededed] dark:bg-[#121214] text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      {/* Full-Screen Interactive AI Face Voice Mode */}
      {isFaceVoiceModeOpen && (
        <AIFaceVoiceMode
          onClose={() => setIsFaceVoiceModeOpen(false)}
          onSendMessage={handleSendMessage}
        />
      )}

      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        history={history}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeModelName={getModelLabel()}
      />

      {/* Settings Popup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onClearHistory={handleClearHistory}
      />

      {/* Clean Top Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onNewChat={handleNewChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Web Application View */}
      <main className="flex-1 flex flex-col justify-between max-w-3xl w-full mx-auto px-4 pt-4 pb-2">
        {/* Messages or Empty State */}
        {messages.length === 0 ? (
          /* Empty State matching left screen of mockup */
          <div className="flex-1 flex flex-col justify-between py-12 items-center text-center my-auto">
            <div className="my-auto space-y-3">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                What can I help with?
              </h1>
              <p className="text-sm text-neutral-500 max-w-md mx-auto">
                Type a prompt below or pick a quick suggestion to begin.
              </p>
            </div>

            {/* Suggestion Pills */}
            <div className="w-full mt-auto pt-8">
              <SuggestionPills onSelectSuggestion={handleSelectSuggestion} />
            </div>
          </div>
        ) : (
          /* Active Message Thread matching right screen of mockup */
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto py-6 px-2 space-y-4 max-h-[calc(100vh-210px)]"
          >
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onRegenerate={
                  msg.sender === "assistant" ? handleRegenerate : undefined
                }
              />
            ))}

            {isGenerating && (
              <div className="flex items-center gap-2 text-xs text-neutral-400 py-2 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-600 dark:text-neutral-300" />
                <span>Neuriy AI is typing response...</span>
              </div>
            )}
          </div>
        )}

        {/* Bottom Floating Input Bar */}
        <div className="sticky bottom-0 pt-2 bg-gradient-to-t from-[#ededed] via-[#ededed] dark:from-[#121214] dark:via-[#121214] to-transparent">
          <ChatInput
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            onOpenFaceVoiceMode={() => setIsFaceVoiceModeOpen(true)}
          />
        </div>
      </main>
    </div>
  );
}
