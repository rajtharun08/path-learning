import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_STORAGE_KEY = 'auth_session';

export async function saveAuthSession(session) {
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export async function getAuthSession() {
  const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function getCurrentUser() {
  const session = await getAuthSession();
  return session?.user || null;
}

export async function getCurrentUserId() {
  const user = await getCurrentUser();
  return user?.id || null;
}

export async function getCurrentUserRole() {
  const session = await getAuthSession();
  return session?.role || session?.user?.role || 'student';
}

export async function getScopedStorageKey(baseKey) {
  const userId = await getCurrentUserId();
  return userId ? `${baseKey}:${userId}` : baseKey;
}

export async function clearAuthSession() {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function getAuthHeaders() {
  const session = await getAuthSession();
  if (!session?.access_token) {
    return {};
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}
