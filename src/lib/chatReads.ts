const CHAT_READ_AT_PREFIX = "chat_read_at:";

export function getChatReadAt(sessionId: string): Date | null {
  if (typeof window === "undefined") return null;
  const val = localStorage.getItem(CHAT_READ_AT_PREFIX + sessionId);
  return val ? new Date(val) : null;
}

export function markChatRead(sessionId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAT_READ_AT_PREFIX + sessionId, new Date().toISOString());
}
