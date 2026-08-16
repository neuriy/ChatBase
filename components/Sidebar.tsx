"use client";

import React from "react";
import {
  X,
  Plus,
  MessageSquare,
  Trash2,
  Zap,
  Sliders,
  ExternalLink,
  Store,
} from "lucide-react";
import { NeuriyLogo } from "./NeuriyLogo";

export interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  preview: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: ChatHistoryItem[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onOpenSettings: () => void;
  onOpenMarketplace?: () => void;
  activeModelName?: string;
  activePath?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  history,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenSettings,
  onOpenMarketplace,
  activeModelName = "Neuriy 1.1 Pro",
  activePath = null,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Drawer Panel */}
      <aside className="fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-[#1a1a1a] shadow-2xl border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-transform duration-300 ease-out animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <NeuriyLogo size={22} showText={true} />

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl text-xs font-semibold hover:opacity-95 transition-all shadow-sm active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Chat</span>
          </button>
        </div>

        <div className="px-3 pb-2 space-y-2">
          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
              activePath?.startsWith("/settings")
                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                : "bg-neutral-100 dark:bg-neutral-800/60 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>Settings</span>
            </div>
            <span className="text-[10px] opacity-70">Page</span>
          </button>

          {onOpenMarketplace && (
            <button
              onClick={() => {
                onOpenMarketplace();
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                activePath?.startsWith("/marketplace")
                  ? "bg-[#1e6fff] text-white"
                  : "bg-neutral-100 dark:bg-neutral-800/60 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Store className="w-3.5 h-3.5" />
                <span>Marketplace</span>
              </div>
              <span className="text-[10px] opacity-70">Store</span>
            </button>
          )}
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
            Recent Chats
          </div>

          {history.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-neutral-400">
              No previous chats yet.
            </div>
          ) : (
            history.map((item) => {
              const isActive = item.id === activeChatId;
              return (
                <div
                  key={item.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    isActive
                      ? "bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                  onClick={() => {
                    onSelectChat(item.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{item.title}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(item.id);
                    }}
                    title="Delete Chat"
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
          <div
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300 px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800/50 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-xl cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              {activeModelName}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Active</span>
          </div>

          <a
            href="https://chat.neuriy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-2 pt-1 text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          >
            <span>chat.neuriy.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </aside>
    </>
  );
};
