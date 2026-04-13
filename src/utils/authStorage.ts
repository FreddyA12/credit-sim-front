const TOKEN_KEY = 'token';
const USER_KEY = 'user';

function migrateFromLegacyLocalStorage(): void {
  if (sessionStorage.getItem(TOKEN_KEY)) return;
  const legacyToken = localStorage.getItem(TOKEN_KEY);
  const legacyUser = localStorage.getItem(USER_KEY);
  if (!legacyToken) return;
  sessionStorage.setItem(TOKEN_KEY, legacyToken);
  if (legacyUser) sessionStorage.setItem(USER_KEY, legacyUser);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthToken(): string | null {
  migrateFromLegacyLocalStorage();
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getAuthUserJson(): string | null {
  migrateFromLegacyLocalStorage();
  return sessionStorage.getItem(USER_KEY);
}

export function setAuthSession(accessToken: string, userJson: string): void {
  sessionStorage.setItem(TOKEN_KEY, accessToken);
  sessionStorage.setItem(USER_KEY, userJson);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
