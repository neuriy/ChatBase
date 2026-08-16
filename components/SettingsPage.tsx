"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  User,
  Sparkles,
  Check,
  Moon,
  Sun,
  Shield,
  Trash2,
  Globe,
  Brain,
  Terminal,
  Store,
} from "lucide-react";
import { logoutNeuriy } from "./AuthGate";

export interface SettingsState {
  model: "pro" | "flash" | "reasoning" | "code";
  temperature: number;
  webSearchDefault: boolean;
  systemPrompt: string;
  userName: string;
  isDarkMode: boolean;
}

const STORAGE_KEY = "neuriy_settings";

export function loadSettings(): SettingsState {
  if (typeof window === "undefined") {
    return {
      model: "pro",
      temperature: 0.7,
      webSearchDefault: false,
      systemPrompt: "",
      userName: "User",
      isDarkMode: false,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...loadSettingsDefaults(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return loadSettingsDefaults();
}

function loadSettingsDefaults(): SettingsState {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  return {
    model: "pro",
    temperature: 0.7,
    webSearchDefault: false,
    systemPrompt: "",
    userName: "User",
    isDarkMode: isDark,
  };
}

export function saveSettings(settings: SettingsState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  if (settings.isDarkMode) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("neuriy_theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("neuriy_theme", "light");
  }
}

function ModelCard({
  active,
  title,
  desc,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3.5 rounded-2xl border transition-all ${
        active
          ? "bg-neutral-50 dark:bg-neutral-800 border-neutral-900 dark:border-white shadow-md"
          : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-xs flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        {active && <Check className="w-3.5 h-3.5 text-emerald-500" />}
      </div>
      <p className="text-[11px] text-neutral-500">{desc}</p>
    </button>
  );
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"model" | "user" | "data">("model");
  const [localSettings, setLocalSettings] = useState<SettingsState>(loadSettingsDefaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(loadSettings());
  }, []);

  const handleSave = () => {
    saveSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const clearHistory = () => {
    localStorage.removeItem("neuriy_chat_history");
    window.dispatchEvent(new Event("neuriy:clear-history"));
  };

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-6 pb-16 animate-fade-in space-y-4">
      <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#1c1c1e] overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200/60 dark:border-neutral-800">
          <h1 className="text-lg font-semibold tracking-tight">Neuriy Settings</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage AI models, profile, and privacy — as a page, not a popup.
          </p>
        </div>

        <div className="flex flex-wrap items-center px-4 pt-3 pb-2 gap-2 text-xs font-medium border-b border-neutral-100 dark:border-neutral-800">
          {(
            [
              ["model", "AI Model", Zap],
              ["user", "User Profile", User],
              ["data", "Data & Privacy", Shield],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                activeTab === id
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
          <Link
            href="/marketplace"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Store className="w-3.5 h-3.5" />
            Marketplace
          </Link>
        </div>

        <div className="p-6 space-y-5">
          {activeTab === "model" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ModelCard
                  active={localSettings.model === "pro"}
                  title="Neuriy 1.1 Pro"
                  desc="Best balanced model for general tasks."
                  icon={<Zap className="w-3.5 h-3.5 text-emerald-500" />}
                  onClick={() => setLocalSettings({ ...localSettings, model: "pro" })}
                />
                <ModelCard
                  active={localSettings.model === "flash"}
                  title="Neuriy 1.1 Flash"
                  desc="Ultra-fast real-time responses."
                  icon={<Sparkles className="w-3.5 h-3.5 text-blue-500" />}
                  onClick={() => setLocalSettings({ ...localSettings, model: "flash" })}
                />
                <ModelCard
                  active={localSettings.model === "reasoning"}
                  title="Neuriy DeepReasoning"
                  desc="Step-by-step logic for complex problems."
                  icon={<Brain className="w-3.5 h-3.5 text-amber-500" />}
                  onClick={() =>
                    setLocalSettings({ ...localSettings, model: "reasoning" })
                  }
                />
                <ModelCard
                  active={localSettings.model === "code"}
                  title="Neuriy Code 1.1"
                  desc="Optimized for architecture & debugging."
                  icon={<Terminal className="w-3.5 h-3.5 text-purple-500" />}
                  onClick={() => setLocalSettings({ ...localSettings, model: "code" })}
                />
              </div>

              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">Creativity (Temperature)</span>
                  <span className="font-mono text-neutral-500">
                    {localSettings.temperature}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localSettings.temperature}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-neutral-900 dark:accent-white"
                />
              </div>

              <label className="flex items-center justify-between p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs font-semibold">Web Search by Default</p>
                    <p className="text-[11px] text-neutral-500">
                      Prefer live context when available.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.webSearchDefault}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      webSearchDefault: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-neutral-900"
                />
              </label>
            </div>
          )}

          {activeTab === "user" && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                <label className="block text-xs font-semibold">Display name</label>
                <input
                  type="text"
                  value={localSettings.userName}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, userName: e.target.value })
                  }
                  className="w-full bg-neutral-100 dark:bg-neutral-800 px-3 py-2 rounded-xl text-xs outline-none"
                />
              </div>
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                <span className="block text-xs font-semibold">Theme</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings({ ...localSettings, isDarkMode: false })
                    }
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium ${
                      !localSettings.isDarkMode
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "bg-neutral-100 dark:bg-neutral-800"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" /> Light
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings({ ...localSettings, isDarkMode: true })
                    }
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium ${
                      localSettings.isDarkMode
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "bg-neutral-100 dark:bg-neutral-800"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" /> Dark
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <h4 className="text-xs font-semibold">Clear chat history</h4>
                <p className="text-[11px] text-neutral-500">
                  Remove saved conversations from this browser.
                </p>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/50 text-red-600 rounded-xl text-xs font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear all history
                </button>
              </div>
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <h4 className="text-xs font-semibold">Account (IDHook)</h4>
                <p className="text-[11px] text-neutral-500">
                  Sign-in is required to use Neuriy AI and Marketplace tools.
                </p>
                <button
                  type="button"
                  onClick={() => void logoutNeuriy()}
                  className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-semibold"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200/60 dark:border-neutral-800">
          <span className="text-[11px] text-neutral-400">
            {saved ? "Saved" : "chat.neuriy.com"}
          </span>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl text-xs font-semibold"
          >
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  );
}
