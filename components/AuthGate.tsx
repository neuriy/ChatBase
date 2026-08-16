"use client";

import React, { useEffect, useState } from "react";
import {
  NeuriyAuthProvider,
  useNeuriyAuth,
  signInWithEmail,
  signInWithGoogle,
  signInWithYahoo,
  signOut as neuriySignOut,
  getCurrentUser,
} from "@neuriy/auth";
import { ensureNeuriyAuth } from "@/lib/auth/client";
import { NeuriyLogoMark } from "@/components/NeuriyLogo";

ensureNeuriyAuth();

async function syncSessionCookie() {
  // Firebase User.getIdToken is on the underlying SDK; @neuriy/auth maps users.
  // Use firebase auth currentUser via dynamic import to refresh silently.
  const { getAuth } = await import("firebase/auth");
  const auth = getAuth();
  const u = auth.currentUser;
  if (!u) {
    await fetch("/api/auth/session", { method: "DELETE" });
    return null;
  }
  const idToken = await u.getIdToken(/* forceRefresh */ false);
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("session_sync_failed");
  return res.json();
}

export function AuthProviders({ children }: { children: React.ReactNode }) {
  ensureNeuriyAuth();
  return <NeuriyAuthProvider>{children}</NeuriyAuthProvider>;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useNeuriyAuth();
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (loading) return;
      if (!user) {
        setSessionReady(false);
        return;
      }
      try {
        await syncSessionCookie();
        if (!cancelled) {
          setSessionReady(true);
          setSessionError(null);
        }
      } catch {
        if (!cancelled) {
          setSessionError(
            "Sessie kon niet worden vastgelegd. Probeer opnieuw in te loggen."
          );
          setSessionReady(false);
        }
      }
    }
    run();
    const interval = setInterval(() => {
      if (getCurrentUser()) syncSessionCookie().catch(() => undefined);
    }, 45 * 60 * 1000); // silent refresh before typical 1h ID token expiry
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ededed] dark:bg-[#121214]">
        <div className="text-sm text-neutral-500 animate-pulse">
          Neuriy Auth Gate…
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ededed] dark:bg-[#121214] px-4">
        <div className="text-sm text-neutral-500">
          {sessionError || "Sessie valideren…"}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login mislukt";
      if (/network|unavailable|fetch/i.test(msg)) {
        setError("Authenticatieservice tijdelijk niet beschikbaar.");
      } else {
        setError("Ongeldige inloggegevens. Controleer e-mail en wachtwoord.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ededed] dark:bg-[#121214] px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-neutral-200 dark:border-neutral-800 p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <NeuriyLogoMark size={22} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Neuriy</h1>
            <p className="text-xs text-neutral-500">
              Auth Gate · IDHook / nID
            </p>
          </div>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Log in om toegang te krijgen tot AI Chat en de Neuriy Marketplace.
        </p>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm outline-none border border-transparent focus:border-neutral-400"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Wachtwoord"
            className="w-full px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm outline-none border border-transparent focus:border-neutral-400"
          />
          <button
            disabled={busy}
            onClick={() => run(() => signInWithEmail(email, password))}
            className="w-full py-2.5 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold disabled:opacity-60"
          >
            Inloggen / Registreren
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={busy}
            onClick={() => run(() => signInWithGoogle())}
            className="py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium"
          >
            Google
          </button>
          <button
            disabled={busy}
            onClick={() => run(() => signInWithYahoo())}
            className="py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium"
          >
            Yahoo
          </button>
        </div>

        <p className="text-[11px] text-neutral-400 text-center">
          Aangedreven door IDHook · chat.neuriy.com
        </p>
      </div>
    </div>
  );
}

export async function logoutNeuriy() {
  await neuriySignOut();
  await fetch("/api/auth/session", { method: "DELETE" });
}
