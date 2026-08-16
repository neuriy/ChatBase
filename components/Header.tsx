"use client";

import React from "react";
import { Moon, Sun, Plus, Store } from "lucide-react";
import { NeuriyLogo } from "./NeuriyLogo";

interface HeaderProps {
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenMarketplace?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isDarkMode,
  onToggleDarkMode,
  onNewChat,
  onOpenSettings,
  onOpenMarketplace,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#ededed]/90 dark:bg-[#141414]/90 backdrop-blur-md transition-colors border-b border-neutral-200/40 dark:border-neutral-800/40">
      {/* Left section: Sidebar toggle & Neuriy Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
          className="p-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-xl transition-all active:scale-95 flex items-center justify-center"
        >
          {/* Custom sidebar icon matching mockup */}
          <div className="w-5 h-5 border-[1.8px] border-neutral-700 dark:border-neutral-300 rounded-[5px] flex items-center p-[2px]">
            <div className="w-[5px] h-full bg-neutral-700 dark:bg-neutral-300 rounded-[1px]" />
          </div>
        </button>

        {/* Neuriy Logo & Title */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={onNewChat}>
          <NeuriyLogo size={20} showText={true} />
          <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full">
            chat.neuriy.com
          </span>
        </div>
      </div>

      {/* Right section: Marketplace, New Chat, Theme, Settings */}
      <div className="flex items-center gap-2">
        {onOpenMarketplace && (
          <button
            onClick={onOpenMarketplace}
            title="Neuriy Marketplace"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold text-[#1e6fff] bg-[#e8f1ff] dark:bg-blue-950/40 hover:opacity-90 items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5" />
            Marketplace
          </button>
        )}

        <button
          onClick={onNewChat}
          title="New Chat"
          aria-label="New Chat"
          className="px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs font-semibold shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>

        <button
          onClick={onToggleDarkMode}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-xl transition-all active:scale-95"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenSettings}
          title="Neuriy Settings"
          className="w-8 h-8 rounded-full metallic-orb border border-white/40 cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0"
        />
      </div>
    </header>
  );
};
