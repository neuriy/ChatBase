// ─────────────────────────────────────────────────────────────────────────────
// @neuriy/auth — Public API barrel
// ─────────────────────────────────────────────────────────────────────────────

// Init
export { initNeuriyAuth } from './client';

// Core auth actions (works in any JS/TS app)
export {
  signInWithEmail,
  signInWithGoogle,
  signInWithYahoo,
  signOut,
  resetPassword,
  onUserChanged,
  getCurrentUser,
  redirectToNeuriyLogin,
} from './auth';

// React primitives
export {
  NeuriyAuthProvider,
  useNeuriyAuth,
  NeuriyAuthGuard,
} from './react';

// Types
export type { NeuriyAuthConfig, NeuriyUser } from './types';
