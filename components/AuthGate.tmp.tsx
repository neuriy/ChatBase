"use client";

import React, { useEffect, useState } from "react";
import {
  NeuriyAuthProvider,
  useNeuriyAuth,
} from "@neuriy/auth";
import { ensureNeuriyAuth } from "@/lib/auth/client";
import { NeuriyLogoMark } from "@/components/NeuriyLogo";

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "1";

ensureNeuriyAuth();

async function enableDevSession() {
  document.cookie = `neuriy_session=dev:local-tester; path=/; SameSite=Lax`;
  document.cookie = `neuriy_csrf=dev-csrf-token; path=/; SameSite=Lax`;
}

export function AuthProviders({ children }: { children: React.ReactNode }) {
  ensureNeuriyAuth();
  return <NeuriyAuthProvider>{children}</NeuriyAuthProvider>;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [sessionReady, setSessionReady] = useState(false);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    async function run() {
      if (DEV_BYPASS) {
        await enableDevSession();
        setDevMode(true);
        setSessionReady(true);
        return;
      }
    }
    run();
  }, []);

  if (!devMode || !sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ededed] dark:bg-[#121214]">
        <div className="text-sm text-neutral-500 animate-pulse">
          Neuriy Auth Gate…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export async function logoutNeuriy() {
  document.cookie = "neuriy_session=; path=/; Max-Age=0";
  document.cookie = "neuriy_csrf=; path=/; Max-Age=0";
  await fetch("/api/auth/session", { method: "DELETE" });
}
