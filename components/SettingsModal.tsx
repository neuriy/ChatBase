"use client";

import React, { useState } from "react";
import {
  X,
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
import { NeuriyLogoMark } from "./NeuriyLogo";
import { MarketplaceSettingsPanel } from "./MarketplaceSettings";
import { logoutNeuriy } from "./AuthGate";
import { useNeuriyAuth } from "@neuriy/auth";

export interface SettingsState {
  model: "pro" | "flash" | "reasoning" | "code";
  temperature: number;
  webSearchDefault: boolean;
  systemPrompt: string;
  userName: string;
  isDarkMode: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsState;
  onSaveSettings: (newSettings: SettingsState) => void;
  onClearHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<
    "model" | "user" | "data" | "marketplace"
  >("model");
  const [localSettings, setLocalSettings] = useState<SettingsState>(settings);
  const { user } = useNeuriyAuth();

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-[#ededed] dark:bg-[#18181a] rounded-[32px] border border-neutral-200/80 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 bg-white dark:bg-[#1c1c1e] border-b border-neutral-200/60 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
                <NeuriyLogoMark size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
                  Neuriy Settings
                </h2>
                <p className="text-xs text-neutral-500">
                  Manage AI models, user preferences & data
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center px-6 pt-3 pb-2 bg-white dark:bg-[#1c1c1e] border-b border-neutral-200/40 dark:border-neutral-800/40 gap-2 text-xs font-medium">
            <button
              onClick={() => setActiveTab("model")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                activeTab === "model"
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>AI Model</span>
            </button>

            <button
              onClick={() => setActiveTab("user")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                activeTab === "user"
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>User Profile</span>
            </button>

            <button
              onClick={() => setActiveTab("data")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                activeTab === "data"
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Data & Privacy</span>
            </button>

            <button
              onClick={() => setActiveTab("marketplace")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                activeTab === "marketplace"
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Neuriy Marketplace</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* AI Model Tab */}
            {activeTab === "model" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                    Active Neuriy Model
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Pro */}
                    <div
                      onClick={() =>
                        setLocalSettings({ ...localSettings, model: "pro" })
                      }
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        localSettings.model === "pro"
                          ? "bg-white dark:bg-neutral-800 border-neutral-900 dark:border-white shadow-md"
                          : "bg-white/60 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 hover:bg-white dark:hover:bg-neutral-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-emerald-500" />
                          Neuriy 1.1 Pro
                        </span>
                        {localSettings.model === "pro" && (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Best balanced model for general tasks & troubleshooting.
                      </p>
                    </div>

                    {/* Flash */}
                    <div
                      onClick={() =>
                        setLocalSettings({ ...localSettings, model: "flash" })
                      }
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        localSettings.model === "flash"
                          ? "bg-white dark:bg-neutral-800 border-neutral-900 dark:border-white shadow-md"
                          : "bg-white/60 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 hover:bg-white dark:hover:bg-neutral-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          Neuriy 1.1 Flash
                        </span>
                        {localSettings.model === "flash" && (
                          <Check className="w-3.5 h-3.5 text-blue-500" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Ultra-fast real-time responses.
                      </p>
                    </div>

                    {/* Reasoning */}
                    <div
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          model: "reasoning",
                        })
                      }
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        localSettings.model === "reasoning"
                          ? "bg-white dark:bg-neutral-800 border-neutral-900 dark:border-white shadow-md"
                          : "bg-white/60 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 hover:bg-white dark:hover:bg-neutral-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5 text-amber-500" />
                          Neuriy DeepReasoning
                        </span>
                        {localSettings.model === "reasoning" && (
                          <Check className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Step-by-step logic for complex problems.
                      </p>
                    </div>

                    {/* Code */}
                    <div
                      onClick={() =>
                        setLocalSettings({ ...localSettings, model: "code" })
                      }
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        localSettings.model === "code"
                          ? "bg-white dark:bg-neutral-800 border-neutral-900 dark:border-white shadow-md"
                          : "bg-white/60 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 hover:bg-white dark:hover:bg-neutral-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-purple-500" />
                          Neuriy Code 1.1
                        </span>
                        {localSettings.model === "code" && (
                          <Check className="w-3.5 h-3.5 text-purple-500" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Optimized for software architecture & debugging.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Temperature Slider */}
                <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      Creativity (Temperature)
                    </span>
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
                    className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>Precise / Logical</span>
                    <span>Creative / Experimental</span>
                  </div>
                </div>

                {/* Web Search Default */}
                <div className="flex items-center justify-between bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                        Enable Web Search by Default
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Automatically query current web data for responses.
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
                    className="w-4 h-4 accent-neutral-900 dark:accent-white rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* User Profile Tab */}
            {activeTab === "user" && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 space-y-3">
                  <label className="block text-xs font-semibold text-neutral-900 dark:text-white">
                    User Display Name
                  </label>
                  <input
                    type="text"
                    value={localSettings.userName}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        userName: e.target.value,
                      })
                    }
                    className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2 rounded-xl text-xs outline-none border border-neutral-200 dark:border-neutral-700"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Appearance Theme */}
                <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 space-y-3">
                  <span className="block text-xs font-semibold text-neutral-900 dark:text-white">
                    Theme Preference
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        setLocalSettings({ ...localSettings, isDarkMode: false })
                      }
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                        !localSettings.isDarkMode
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-semibold"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-transparent"
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Light Mode</span>
                    </button>

                    <button
                      onClick={() =>
                        setLocalSettings({ ...localSettings, isDarkMode: true })
                      }
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                        localSettings.isDarkMode
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-semibold"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-transparent"
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Dark Mode</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Privacy Tab */}
            {activeTab === "data" && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 space-y-2">
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Clear Chat History
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Remove all saved active conversations from local storage.
                  </p>
                  <button
                    onClick={() => {
                      onClearHistory();
                      onClose();
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors mt-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All History</span>
                  </button>
                </div>

                <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 space-y-2">
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Account
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    {user?.email || user?.uid || "Ingelogd via IDHook"}
                  </p>
                  <button
                    onClick={async () => {
                      await logoutNeuriy();
                      onClose();
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-semibold mt-2"
                  >
                    Uitloggen
                  </button>
                </div>
              </div>
            )}

            {activeTab === "marketplace" && <MarketplaceSettingsPanel />}
          </div>

          {/* Footer Save Actions */}
          <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#1c1c1e] border-t border-neutral-200/60 dark:border-neutral-800">
            <span className="text-[11px] text-neutral-400">chat.neuriy.com</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl text-xs font-semibold hover:opacity-95 transition-all shadow-sm active:scale-95"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
