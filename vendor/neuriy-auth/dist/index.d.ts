import { Unsubscribe } from 'firebase/auth';
import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';

interface NeuriyAuthConfig {
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
interface NeuriyUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
}

/**
 * Initialise the Neuriy auth SDK with your Firebase config.
 * Call this once at the top level of your app (e.g. _app.tsx / layout.tsx).
 */
declare function initNeuriyAuth(config: NeuriyAuthConfig): void;

/**
 * Sign in with email + password.
 * If the user doesn't exist, automatically creates an account.
 */
declare function signInWithEmail(email: string, password: string): Promise<NeuriyUser>;
/**
 * Sign in with Google popup.
 */
declare function signInWithGoogle(): Promise<NeuriyUser>;
/**
 * Sign in with Yahoo popup.
 */
declare function signInWithYahoo(): Promise<NeuriyUser>;
/**
 * Sign out the current user.
 */
declare function signOut(): Promise<void>;
/**
 * Send a password reset email.
 */
declare function resetPassword(email: string): Promise<void>;
/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
declare function onUserChanged(callback: (user: NeuriyUser | null) => void): Unsubscribe;
/**
 * Get the current user synchronously (may be null before auth resolves).
 */
declare function getCurrentUser(): NeuriyUser | null;
/**
 * Redirect to Neuriy nID login page and come back to current URL after auth.
 * @param nidBaseUrl Base URL of your nID deployment (default: https://id.neuriy.com)
 */
declare function redirectToNeuriyLogin(nidBaseUrl?: string): void;

interface NeuriyAuthContextValue {
    user: NeuriyUser | null;
    loading: boolean;
}
interface NeuriyAuthProviderProps {
    children: ReactNode;
}
/**
 * Wrap your app (or layout) with this provider to enable useNeuriyAuth().
 *
 * @example
 * // layout.tsx
 * import { NeuriyAuthProvider } from '@neuriy/auth/react';
 *
 * export default function RootLayout({ children }) {
 *   return <NeuriyAuthProvider>{children}</NeuriyAuthProvider>;
 * }
 */
declare function NeuriyAuthProvider({ children }: NeuriyAuthProviderProps): react_jsx_runtime.JSX.Element;
/**
 * Access the current Neuriy auth state inside any React component.
 *
 * @example
 * const { user, loading } = useNeuriyAuth();
 * if (loading) return <Spinner />;
 * if (!user) return <LoginButton />;
 * return <Dashboard user={user} />;
 */
declare function useNeuriyAuth(): NeuriyAuthContextValue;
interface WithAuthProps {
    /** Component to render while loading */
    fallback?: ReactNode;
    /** Component to render if unauthenticated */
    unauthenticated?: ReactNode;
    children: (user: NeuriyUser) => ReactNode;
}
/**
 * Render children only when the user is authenticated.
 *
 * @example
 * <NeuriyAuthGuard
 *   fallback={<Spinner />}
 *   unauthenticated={<LoginPage />}
 * >
 *   {(user) => <Dashboard user={user} />}
 * </NeuriyAuthGuard>
 */
declare function NeuriyAuthGuard({ children, fallback, unauthenticated }: WithAuthProps): react_jsx_runtime.JSX.Element;

export { type NeuriyAuthConfig, NeuriyAuthGuard, NeuriyAuthProvider, type NeuriyUser, getCurrentUser, initNeuriyAuth, onUserChanged, redirectToNeuriyLogin, resetPassword, signInWithEmail, signInWithGoogle, signInWithYahoo, signOut, useNeuriyAuth };
