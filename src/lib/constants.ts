export const FOCUS_AREAS = [
  "Rudiments",
  "Groove",
  "Fills",
  "Independence",
  "Speed",
  "Song Learning",
  "Free Play",
] as const;

export type FocusArea = (typeof FOCUS_AREAS)[number];

export const FOCUS_AREA_COLORS: Record<string, string> = {
  Rudiments: "bg-blue-500/15 text-blue-700 border-blue-200",
  Groove: "bg-green-500/15 text-green-700 border-green-200",
  Fills: "bg-yellow-500/15 text-yellow-700 border-yellow-200",
  Independence: "bg-purple-500/15 text-purple-700 border-purple-200",
  Speed: "bg-orange-500/15 text-orange-700 border-orange-200",
  "Song Learning": "bg-teal-500/15 text-teal-700 border-teal-200",
  "Free Play": "bg-gray-500/15 text-gray-700 border-gray-200",
};

export function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}
