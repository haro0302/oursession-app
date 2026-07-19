export function normalizeUsername(input: string): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/[^/]+\//, "")
    .replace(/\/$/, "");
}

export function soundcloudHref(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
