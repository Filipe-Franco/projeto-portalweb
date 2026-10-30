import type { AuthRole, AuthUser } from './authApi';

const STORAGE_KEY = 'portalweb.auth';
const SESSION_EVENT = 'portalweb.auth.changed';

function notifyAuthSessionChanged() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function onAuthSessionChanged(listener: () => void) {
  window.addEventListener(SESSION_EVENT, listener);
  return () => window.removeEventListener(SESSION_EVENT, listener);
}

type StoredSession = {
  token: string;
  user: AuthUser;
};

function readSession(): StoredSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY) || window.sessionStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function saveAuthSession(session: StoredSession, remember: boolean) {
  clearAuthSession();
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(STORAGE_KEY, JSON.stringify(session));
  notifyAuthSessionChanged();
}

export function clearAuthSession() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
  notifyAuthSessionChanged();
}

export function getAuthSession() {
  return readSession();
}

export function getAuthToken() {
  return readSession()?.token || null;
}

export function getAuthUser() {
  return readSession()?.user || null;
}

export function updateAuthUser(partial: Partial<AuthUser>) {
  const current = readSession();
  if (!current) return;
  const remember = Boolean(window.localStorage.getItem(STORAGE_KEY));
  saveAuthSession({ ...current, user: { ...current.user, ...partial } }, remember);
}

export function hasRole(role: AuthRole) {
  return readSession()?.user.role === role;
}
