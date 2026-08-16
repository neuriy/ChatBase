// ─────────────────────────────────────────────────────────────────────────────
// @neuriy/auth — Core auth actions (framework-agnostic)
// ─────────────────────────────────────────────────────────────────────────────

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type Unsubscribe,
} from 'firebase/auth';
import { getFirebaseAuth, getGoogleProvider, getYahooProvider, getNeuriyConfig } from './client';
import type { NeuriyUser } from './types';

function mapUser(user: import('firebase/auth').User): NeuriyUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
}

/**
 * Sign in with email + password.
 * If the user doesn't exist, automatically creates an account.
 */
export async function signInWithEmail(email: string, password: string): Promise<NeuriyUser> {
  const auth = getFirebaseAuth();
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(result.user);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return mapUser(result.user);
    }
    throw new Error(err.message.replace('Firebase: ', ''));
  }
}

/**
 * Sign in with Google popup.
 */
export async function signInWithGoogle(): Promise<NeuriyUser> {
  const auth = getFirebaseAuth();
  const provider = getGoogleProvider();
  const result = await signInWithPopup(auth, provider);
  return mapUser(result.user);
}

/**
 * Sign in with Yahoo popup.
 */
export async function signInWithYahoo(): Promise<NeuriyUser> {
  const auth = getFirebaseAuth();
  const provider = getYahooProvider();
  const result = await signInWithPopup(auth, provider);
  return mapUser(result.user);
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

/**
 * Send a password reset email.
 */
export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onUserChanged(callback: (user: NeuriyUser | null) => void): Unsubscribe {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (firebaseUser) => {
    callback(firebaseUser ? mapUser(firebaseUser) : null);
  });
}

/**
 * Get the current user synchronously (may be null before auth resolves).
 */
export function getCurrentUser(): NeuriyUser | null {
  const auth = getFirebaseAuth();
  const u = auth.currentUser;
  return u ? mapUser(u) : null;
}

/**
 * Redirect to Neuriy nID login page and come back to current URL after auth.
 * @param nidBaseUrl Base URL of your nID deployment (default: https://id.neuriy.com)
 */
export function redirectToNeuriyLogin(nidBaseUrl = 'https://id.neuriy.com'): void {
  const config = getNeuriyConfig();
  const returnUrl = config.redirectUrl ?? window.location.href;
  window.location.href = `${nidBaseUrl}/auth/login?return=${encodeURIComponent(returnUrl)}`;
}
