// src/client.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider
} from "firebase/auth";
var _app = null;
var _auth = null;
var _googleProvider = null;
var _yahooProvider = null;
var _config = null;
function initNeuriyAuth(config) {
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
      appId: config.appId
    });
  }
  _auth = getAuth(_app);
  _googleProvider = new GoogleAuthProvider();
  _yahooProvider = new OAuthProvider("yahoo.com");
  _yahooProvider.addScope("email");
  _yahooProvider.addScope("profile");
  _yahooProvider.setCustomParameters({
    prompt: "login"
  });
}
function getFirebaseAuth() {
  if (!_auth) throw new Error("[neuriy/auth] Call initNeuriyAuth() before using auth.");
  return _auth;
}
function getGoogleProvider() {
  if (!_googleProvider) throw new Error("[neuriy/auth] Call initNeuriyAuth() before using providers.");
  return _googleProvider;
}
function getYahooProvider() {
  if (!_yahooProvider) throw new Error("[neuriy/auth] Call initNeuriyAuth() before using providers.");
  return _yahooProvider;
}
function getNeuriyConfig() {
  if (!_config) throw new Error("[neuriy/auth] Call initNeuriyAuth() before accessing config.");
  return _config;
}

// src/auth.ts
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";
function mapUser(user) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified
  };
}
async function signInWithEmail(email, password) {
  const auth = getFirebaseAuth();
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(result.user);
  } catch (err) {
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return mapUser(result.user);
    }
    throw new Error(err.message.replace("Firebase: ", ""));
  }
}
async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  const provider = getGoogleProvider();
  const result = await signInWithPopup(auth, provider);
  return mapUser(result.user);
}
async function signInWithYahoo() {
  const auth = getFirebaseAuth();
  const provider = getYahooProvider();
  const result = await signInWithPopup(auth, provider);
  return mapUser(result.user);
}
async function signOut() {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}
async function resetPassword(email) {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
}
function onUserChanged(callback) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (firebaseUser) => {
    callback(firebaseUser ? mapUser(firebaseUser) : null);
  });
}
function getCurrentUser() {
  const auth = getFirebaseAuth();
  const u = auth.currentUser;
  return u ? mapUser(u) : null;
}
function redirectToNeuriyLogin(nidBaseUrl = "https://id.neuriy.com") {
  var _a;
  const config = getNeuriyConfig();
  const returnUrl = (_a = config.redirectUrl) != null ? _a : window.location.href;
  window.location.href = `${nidBaseUrl}/auth/login?return=${encodeURIComponent(returnUrl)}`;
}

// src/react.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import { Fragment, jsx } from "react/jsx-runtime";
var NeuriyAuthContext = createContext({
  user: null,
  loading: true
});
function NeuriyAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onUserChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  return /* @__PURE__ */ jsx(NeuriyAuthContext.Provider, { value: { user, loading }, children });
}
function useNeuriyAuth() {
  const ctx = useContext(NeuriyAuthContext);
  if (!ctx) {
    throw new Error("[neuriy/auth] useNeuriyAuth must be used inside <NeuriyAuthProvider>");
  }
  return ctx;
}
function NeuriyAuthGuard({ children, fallback, unauthenticated }) {
  const { user, loading } = useNeuriyAuth();
  if (loading) return /* @__PURE__ */ jsx(Fragment, { children: fallback != null ? fallback : null });
  if (!user) return /* @__PURE__ */ jsx(Fragment, { children: unauthenticated != null ? unauthenticated : null });
  return /* @__PURE__ */ jsx(Fragment, { children: children(user) });
}
export {
  NeuriyAuthGuard,
  NeuriyAuthProvider,
  getCurrentUser,
  initNeuriyAuth,
  onUserChanged,
  redirectToNeuriyLogin,
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
  signInWithYahoo,
  signOut,
  useNeuriyAuth
};
