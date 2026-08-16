"use client";

import { initNeuriyAuth } from "@neuriy/auth";

let initialized = false;

/**
 * Client-side IDHook / @neuriy/auth init.
 * Firebase web config is public-by-design (restricted by domain in Firebase console).
 */
export function ensureNeuriyAuth() {
  if (initialized || typeof window === "undefined") return;
  initNeuriyAuth({
    apiKey:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      "AIzaSyB-wfqzVbPcT5Bf1JvJNGKA3j8K6BPyMhw",
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      "robbieart-com.firebaseapp.com",
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "robbieart-com",
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "robbieart-com.firebasestorage.app",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "762094443577",
    appId:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
      "1:762094443577:web:bb725c4d3c8b5c943c41e8",
    redirectUrl:
      typeof window !== "undefined" ? window.location.origin : undefined,
  });
  initialized = true;
}
