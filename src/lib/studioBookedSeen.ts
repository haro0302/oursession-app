const SEEN_PREFIX = "studio_booked_seen:";

// 「スタジオが決定しました！」ポップアップを既に見たかどうか(端末のlocalStorage)。
// アプリを閉じていて見逃した場合、次に部屋を開いたときに一度だけ出す。
export function hasSeenStudioBooked(proposalId: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SEEN_PREFIX + proposalId) === "1";
}

export function markStudioBookedSeen(proposalId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEEN_PREFIX + proposalId, "1");
}
