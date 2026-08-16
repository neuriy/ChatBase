# @neuriy/auth

**Neuriy nID Authentication SDK** — plug-and-play Firebase authentication for any React, Next.js, or vanilla JS app.

---

## Installation

```bash
npm install @neuriy/auth
# or
yarn add @neuriy/auth
```

---

## Quick Start

### 1. Initialise (once, at app root)

```ts
import { initNeuriyAuth } from '@neuriy/auth';

initNeuriyAuth({
  apiKey:            'YOUR_FIREBASE_API_KEY',
  authDomain:        'YOUR_PROJECT.firebaseapp.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT.appspot.com',
  messagingSenderId: '123456789',
  appId:             '1:123456789:web:abc123',
  // Optional: where to send users after login
  redirectUrl:       'https://chat.neuriy.com',
});
```

---

### 2. React / Next.js — Provider

Wrap your app (or root layout) with `NeuriyAuthProvider`:

```tsx
// app/layout.tsx  (Next.js App Router)
import { NeuriyAuthProvider } from '@neuriy/auth';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NeuriyAuthProvider>{children}</NeuriyAuthProvider>
      </body>
    </html>
  );
}
```

---

### 3. React Hook — `useNeuriyAuth`

```tsx
import { useNeuriyAuth } from '@neuriy/auth';

export default function Header() {
  const { user, loading } = useNeuriyAuth();

  if (loading) return <p>Loading...</p>;
  if (!user)   return <a href="/auth/login">Sign in</a>;

  return <p>Hello, {user.displayName ?? user.email}!</p>;
}
```

---

### 4. Auth Guard Component

Protect pages or sections with `NeuriyAuthGuard`:

```tsx
import { NeuriyAuthGuard } from '@neuriy/auth';

export default function DashboardPage() {
  return (
    <NeuriyAuthGuard
      fallback={<p>Loading...</p>}
      unauthenticated={<p>Please sign in.</p>}
    >
      {(user) => <Dashboard user={user} />}
    </NeuriyAuthGuard>
  );
}
```

---

### 5. Auth Actions

```ts
import {
  signInWithEmail,
  signInWithGoogle,
  signOut,
  resetPassword,
  onUserChanged,
  getCurrentUser,
  redirectToNeuriyLogin,
} from '@neuriy/auth';

// Sign in / auto-register with email + password
const user = await signInWithEmail('user@example.com', 'password123');

// Google sign-in popup
const user = await signInWithGoogle();

// Sign out
await signOut();

// Send password reset email
await resetPassword('user@example.com');

// Listen to auth state changes (vanilla JS)
const unsubscribe = onUserChanged((user) => {
  if (user) console.log('Logged in:', user.uid);
  else console.log('Logged out');
});

// Redirect to Neuriy nID login page (returns after auth)
redirectToNeuriyLogin('https://id.neuriy.com');
```

---

## API Reference

### `initNeuriyAuth(config)` → `void`
Initialise the SDK. **Must be called before any other function.**

| Option | Type | Required | Description |
|---|---|---|---|
| `apiKey` | `string` | ✅ | Firebase API key |
| `authDomain` | `string` | ✅ | Firebase auth domain |
| `projectId` | `string` | ✅ | Firebase project ID |
| `storageBucket` | `string` | — | Firebase storage bucket |
| `messagingSenderId` | `string` | — | Firebase messaging sender ID |
| `appId` | `string` | — | Firebase app ID |
| `redirectUrl` | `string` | — | URL to redirect after login |

---

### React Exports

| Export | Type | Description |
|---|---|---|
| `NeuriyAuthProvider` | Component | Context provider — wrap your app |
| `useNeuriyAuth()` | Hook | Returns `{ user, loading }` |
| `NeuriyAuthGuard` | Component | Render-gate for authenticated content |

---

### Auth Action Exports

| Export | Returns | Description |
|---|---|---|
| `signInWithEmail(email, password)` | `Promise<NeuriyUser>` | Sign in or auto-create account |
| `signInWithGoogle()` | `Promise<NeuriyUser>` | Google popup sign-in |
| `signOut()` | `Promise<void>` | Sign out current user |
| `resetPassword(email)` | `Promise<void>` | Send password reset email |
| `onUserChanged(callback)` | `Unsubscribe` | Subscribe to auth state |
| `getCurrentUser()` | `NeuriyUser \| null` | Get current user synchronously |
| `redirectToNeuriyLogin(url?)` | `void` | Redirect to Neuriy nID login |

---

### `NeuriyUser` type

```ts
interface NeuriyUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}
```

---

## Publishing to npm

```bash
cd sdk
npm run build
npm publish --access public
```

---

## License

MIT © Neuriy
