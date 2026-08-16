// ─────────────────────────────────────────────────────────────────────────────
// @neuriy/auth — React hooks & context provider
// ─────────────────────────────────────────────────────────────────────────────

'use client'; // Next.js App Router compatible

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { onUserChanged } from './auth';
import type { NeuriyUser } from './types';

// ── Context ───────────────────────────────────────────────────────────────────

interface NeuriyAuthContextValue {
  user: NeuriyUser | null;
  loading: boolean;
}

const NeuriyAuthContext = createContext<NeuriyAuthContextValue>({
  user: null,
  loading: true,
});

// ── Provider ──────────────────────────────────────────────────────────────────

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
export function NeuriyAuthProvider({ children }: NeuriyAuthProviderProps) {
  const [user, setUser] = useState<NeuriyUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onUserChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <NeuriyAuthContext.Provider value={{ user, loading }}>
      {children}
    </NeuriyAuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Access the current Neuriy auth state inside any React component.
 *
 * @example
 * const { user, loading } = useNeuriyAuth();
 * if (loading) return <Spinner />;
 * if (!user) return <LoginButton />;
 * return <Dashboard user={user} />;
 */
export function useNeuriyAuth(): NeuriyAuthContextValue {
  const ctx = useContext(NeuriyAuthContext);
  if (!ctx) {
    throw new Error('[neuriy/auth] useNeuriyAuth must be used inside <NeuriyAuthProvider>');
  }
  return ctx;
}

// ── Guard HOC ─────────────────────────────────────────────────────────────────

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
export function NeuriyAuthGuard({ children, fallback, unauthenticated }: WithAuthProps) {
  const { user, loading } = useNeuriyAuth();
  if (loading) return <>{fallback ?? null}</>;
  if (!user) return <>{unauthenticated ?? null}</>;
  return <>{children(user)}</>;
}
