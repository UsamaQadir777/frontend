import { apiFetch } from "./apiClient";
import { toApiDateString } from "./formatters";

async function readApiError(res, fallback) {
  try {
    const data = await res.json();
    if (data?.message) return data.message;
    if (data?.detail) return data.detail;

    const fieldErrors = Object.entries(data || {})
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(", ") : value}`)
      .join("\n");

    return fieldErrors || fallback;
  } catch (error) {
    return fallback;
  }
}

// Fetch foods from the authenticated catalog
export async function fetchFoods(params = {}) {
  const query = [];
  if (params.search) query.push(`search=${encodeURIComponent(params.search)}`);
  if (params.category) query.push(`category=${encodeURIComponent(String(params.category))}`);

  const res = await apiFetch(`/foods/${query.length ? `?${query.join("&")}` : ""}`, { method: "GET" });
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to fetch foods"));
  }

  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

// Fetch meals by date
export async function fetchMeals(date) {
  const res = await apiFetch(`/meals/?date=${toApiDateString(date)}`, { method: "GET" });
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to fetch meals"));
  }

  return res.json();
}

// Add meal
export async function addMeal(foodData) {
  const payload = foodData?.date ? { ...foodData, date: toApiDateString(foodData.date) } : foodData;

  const res = await apiFetch("/meals/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to add meal"));
  }

  return res.json();
}

// Dashboard (goal, calories, water)
export async function fetchDashboard(date) {
  const res = await apiFetch(`/dashboard/?date=${toApiDateString(date)}`, { method: "GET" });
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to fetch dashboard"));
  }

  return res.json();
}

// Progress over a date range
export async function fetchProgress({ start, end } = {}) {
  const query = [];
  if (start) query.push(`start=${encodeURIComponent(toApiDateString(start))}`);
  if (end) query.push(`end=${encodeURIComponent(toApiDateString(end))}`);

  const res = await apiFetch(`/progress/${query.length ? `?${query.join("&")}` : ""}`, { method: "GET" });
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to fetch progress"));
  }

  return res.json();
}

// Water intake
export async function updateWater(date, amountMl) {
  const res = await apiFetch("/water/", {
    method: "POST",
    body: JSON.stringify({ date: toApiDateString(date), amount_ml: amountMl }),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to update water"));
  }

  return res.json();
}
