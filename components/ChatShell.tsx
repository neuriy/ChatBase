"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar, ChatHistoryItem } from "@/components/Sidebar";

type ChatShellProps = {
  children: React.ReactNode;
  history?: ChatHistoryItem[];
  activeChatId?: string | null;
  onSelectChat?: (id: string) => void;
  onNewChat?: () => void;
  onDeleteChat?: (id: string) => void;
  activeModelName?: string;
};

/**
 * Shared Neuriy chat chrome for Chat / Marketplace / Settings pages (no popups).
 */
export function ChatShell({
  children,
  history = [],
  activeChatId = null,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  activeModelName = "Neuriy 1.1 Pro",
}: ChatShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("neuriy_theme");
    const isDark =
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
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

  const goChat = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#ededed] dark:bg-[#121214] text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        history={history}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          if (onSelectChat) onSelectChat(id);
          else router.push("/");
        }}
        onNewChat={() => {
          if (onNewChat) onNewChat();
          else router.push("/");
        }}
        onDeleteChat={onDeleteChat || (() => undefined)}
        onOpenSettings={() => router.push("/settings")}
        onOpenMarketplace={() => router.push("/marketplace")}
        activeModelName={activeModelName}
        activePath={pathname}
      />

      <Header
        onToggleSidebar={() => setIsSidebarOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onNewChat={goChat}
        onOpenSettings={() => router.push("/settings")}
        onOpenMarketplace={() => router.push("/marketplace")}
      />

      {pathname !== "/" && (
        <nav className="max-w-5xl w-full mx-auto px-4 pt-3 flex items-center gap-2 text-xs">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/70 dark:hover:bg-neutral-800"
          >
            Chat
          </Link>
          <Link
            href="/marketplace"
            className={`px-3 py-1.5 rounded-lg font-medium ${
              pathname.startsWith("/marketplace")
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/70 dark:hover:bg-neutral-800"
            }`}
          >
            Marketplace
          </Link>
          <Link
            href="/settings"
            className={`px-3 py-1.5 rounded-lg font-medium ${
              pathname.startsWith("/settings")
                ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/70 dark:hover:bg-neutral-800"
            }`}
          >
            Settings
          </Link>
        </nav>
      )}

      {children}
    </div>
  );
}
