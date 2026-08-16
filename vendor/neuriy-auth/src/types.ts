// ─────────────────────────────────────────────────────────────────────────────
// @neuriy/auth — Core types
// ─────────────────────────────────────────────────────────────────────────────

export interface NeuriyAuthConfig {
  /** Your Firebase project API key */
  apiKey: string;
  /** Your Firebase auth domain */
  authDomain: string;
  /** Your Firebase project ID */
  projectId: string;
  /** (Optional) Storage bucket */
  storageBucket?: string;
  /** (Optional) Messaging sender ID */
  messagingSenderId?: string;
  /** (Optional) App ID */
  appId?: string;
  /** (Optional) Redirect URL after successful login — defaults to current origin */
  redirectUrl?: string;
}

export interface NeuriyUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}
