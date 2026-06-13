import { API_URL } from "../constants/api";
import { apiFetch, clearAuthTokens, getAccessToken, storeAuthTokens } from "./apiClient";

// Signup
export async function signup(userData) {
  const res = await fetch(`${API_URL}/auth/signup/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return res.json();
}

// Login
export async function login(credentials) {
  const res = await fetch(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (data.access) {
    await storeAuthTokens({ access: data.access, refresh: data.refresh });
  }
  return data;
}

// Logout
export async function logout() {
  const token = await getAccessToken();
  try {
    await apiFetch("/auth/logout/", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } finally {
    await clearAuthTokens();
  }
}
