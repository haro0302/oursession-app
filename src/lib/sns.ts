export function normalizeUsername(input: string): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/[^/]+\//, "")
    .replace(/\/$/, "");
}
