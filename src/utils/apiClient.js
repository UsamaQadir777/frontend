import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../constants/api";

export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
const LEGACY_ACCESS_TOKEN_KEY = "token";

let refreshPromise = null;
let authFailureHandler = null;

export function setAuthFailureHandler(handler) {
  authFailureHandler = handler;
}

export async function getAccessToken() {
  return (await AsyncStorage.getItem(ACCESS_TOKEN_KEY)) || (await AsyncStorage.getItem(LEGACY_ACCESS_TOKEN_KEY));
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function storeAuthTokens({ access, refresh }) {
  if (access) {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, access],
      [LEGACY_ACCESS_TOKEN_KEY, access],
    ]);
  }

  if (refresh) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
}

export async function clearAuthTokens() {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, LEGACY_ACCESS_TOKEN_KEY]);
}

async function refreshAccessToken() {
  const refresh = await getRefreshToken();

  if (!refresh) {
    throw new Error("Missing refresh token");
  }

  const res = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    throw new Error("Refresh token expired");
  }

  const data = await res.json();
  if (!data.access) {
    throw new Error("Refresh response did not include an access token");
  }

  await storeAuthTokens({ access: data.access, refresh: data.refresh });
  return data.access;
}

async function getFreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

function buildUrl(path) {
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

async function buildHeaders(headers = {}) {
  const token = await getAccessToken();
  return {
    "Content-Type": "application/json",
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch(path, options = {}, retryOnUnauthorized = true) {
  const res = await fetch(buildUrl(path), {
    ...options,
    headers: await buildHeaders(options.headers),
  });

  if (res.status !== 401 || !retryOnUnauthorized) {
    return res;
  }

  try {
    const access = await getFreshAccessToken();
    return fetch(buildUrl(path), {
      ...options,
      headers: {
        ...(await buildHeaders(options.headers)),
        Authorization: `Bearer ${access}`,
      },
    });
  } catch (error) {
    await clearAuthTokens();
    authFailureHandler?.();
    return res;
  }
}
