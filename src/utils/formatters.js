export const formatCalories = (value) => `${Math.round(Number(value) || 0).toLocaleString()} Kcal`;

export const formatMacro = (value) => `${Math.round(Number(value) || 0)}g`;

export const formatPercent = (value, total) => {
  if (!total) return "0%";
  return `${Math.min(100, Math.round((value / total) * 100))}%`;
};

export function toApiDateString(date) {
  if (typeof date === "string") return date;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const formatDateKey = (date) => toApiDateString(date);

export const getDateLabel = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

export const getShortDay = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "short"
  });

export const createDateRange = (centerDate = new Date(), radius = 3) =>
  Array.from({ length: radius * 2 + 1 }, (_, index) => {
    const date = new Date(centerDate);
    date.setDate(centerDate.getDate() + index - radius);
    return date;
  });
