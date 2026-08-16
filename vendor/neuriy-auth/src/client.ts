// ─────────────────────────────────────────────────────────────────────────────
// @neuriy/auth — Firebase client (singleton, safe for Next.js SSR)
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  type Auth,
} from 'firebase/auth';
import type { NeuriyAuthConfig } from './types';

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _googleProvider: GoogleAuthProvider | null = null;
let _yahooProvider: OAuthProvider | null = null;
let _config: NeuriyAuthConfig | null = null;

/**
 * Initialise the Neuriy auth SDK with your Firebase config.
 * Call this once at the top level of your app (e.g. _app.tsx / layout.tsx).
 */
export function initNeuriyAuth(config: NeuriyAuthConfig): void {
  _config = config;

  if (getApps().length > 0) {
    _app = getApp();
  } else {
    _app = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });
  }

  _auth = getAuth(_app);
  _googleProvider = new GoogleAuthProvider();
  _yahooProvider = new OAuthProvider('yahoo.com');
  _yahooProvider.addScope('email');
  _yahooProvider.addScope('profile');
  _yahooProvider.setCustomParameters({
    prompt: 'login',
  });
}

export function getFirebaseAuth(): Auth {
  if (!_auth) throw new Error('[neuriy/auth] Call initNeuriyAuth() before using auth.');
  return _auth;
}

export function getGoogleProvider(): GoogleAuthProvider {
  if (!_googleProvider) throw new Error('[neuriy/auth] Call initNeuriyAuth() before using providers.');
  return _googleProvider;
}

export function getYahooProvider(): OAuthProvider {
  if (!_yahooProvider) throw new Error('[neuriy/auth] Call initNeuriyAuth() before using providers.');
  return _yahooProvider;
}

export function getNeuriyConfig(): NeuriyAuthConfig {
  if (!_config) throw new Error('[neuriy/auth] Call initNeuriyAuth() before accessing config.');
  return _config;
}
