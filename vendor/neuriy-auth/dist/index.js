"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  NeuriyAuthGuard: () => NeuriyAuthGuard,
  NeuriyAuthProvider: () => NeuriyAuthProvider,
  getCurrentUser: () => getCurrentUser,
  initNeuriyAuth: () => initNeuriyAuth,
  onUserChanged: () => onUserChanged,
  redirectToNeuriyLogin: () => redirectToNeuriyLogin,
  resetPassword: () => resetPassword,
  signInWithEmail: () => signInWithEmail,
  signInWithGoogle: () => signInWithGoogle,
  signInWithYahoo: () => signInWithYahoo,
  signOut: () => signOut,
  useNeuriyAuth: () => useNeuriyAuth
});
module.exports = __toCommonJS(index_exports);

// src/client.ts
var import_app = require("firebase/app");
var import_auth = require("firebase/auth");
var _app = null;
var _auth = null;
var _googleProvider = null;
var _yahooProvider = null;
var _config = null;
function initNeuriyAuth(config) {
  _config = config;
  if ((0, import_app.getApps)().length > 0) {
    _app = (0, import_app.getApp)();
  } else {
    _app = (0, import_app.initializeApp)({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId
    });
  }
  _auth = (0, import_auth.getAuth)(_app);
  _googleProvider = new import_auth.GoogleAuthProvider();
  _yahooProvider = new import_auth.OAuthProvider("yahoo.com");
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
var import_auth2 = require("firebase/auth");
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
    const result = await (0, import_auth2.signInWithEmailAndPassword)(auth, email, password);
    return mapUser(result.user);
  } catch (err) {
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      const result = await (0, import_auth2.createUserWithEmailAndPassword)(auth, email, password);
      return mapUser(result.user);
    }
    throw new Error(err.message.replace("Firebase: ", ""));
  }
}
async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  const provider = getGoogleProvider();
  const result = await (0, import_auth2.signInWithPopup)(auth, provider);
  return mapUser(result.user);
}
async function signInWithYahoo() {
  const auth = getFirebaseAuth();
  const provider = getYahooProvider();
  const result = await (0, import_auth2.signInWithPopup)(auth, provider);
  return mapUser(result.user);
}
async function signOut() {
  const auth = getFirebaseAuth();
  await (0, import_auth2.signOut)(auth);
}
async function resetPassword(email) {
  const auth = getFirebaseAuth();
  await (0, import_auth2.sendPasswordResetEmail)(auth, email);
}
function onUserChanged(callback) {
  const auth = getFirebaseAuth();
  return (0, import_auth2.onAuthStateChanged)(auth, (firebaseUser) => {
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
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var NeuriyAuthContext = (0, import_react.createContext)({
  user: null,
  loading: true
});
function NeuriyAuthProvider({ children }) {
  const [user, setUser] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(true);
  (0, import_react.useEffect)(() => {
    const unsubscribe = onUserChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NeuriyAuthContext.Provider, { value: { user, loading }, children });
}
function useNeuriyAuth() {
  const ctx = (0, import_react.useContext)(NeuriyAuthContext);
  if (!ctx) {
    throw new Error("[neuriy/auth] useNeuriyAuth must be used inside <NeuriyAuthProvider>");
  }
  return ctx;
}
function NeuriyAuthGuard({ children, fallback, unauthenticated }) {
  const { user, loading } = useNeuriyAuth();
  if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: fallback != null ? fallback : null });
  if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: unauthenticated != null ? unauthenticated : null });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: children(user) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
