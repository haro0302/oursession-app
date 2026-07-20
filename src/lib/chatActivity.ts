import { createClient } from "@/lib/supabase";
import type { Database } from "@/types/database";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export interface SessionMessageEvent {
  sessionId: string;
  createdAt: string;
}

const MAX_MESSAGES = 300;

export async function fetchOtherPartyMessages(
  userId: string,
  sessionIds: string[]
): Promise<SessionMessageEvent[]> {
  if (sessionIds.length === 0) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select("session_id, created_at")
    .in("session_id", sessionIds)
    .neq("sender_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_MESSAGES);

  const rows = (data as Pick<MessageRow, "session_id" | "created_at">[] | null) ?? [];
  return rows.map((r) => ({ sessionId: r.session_id, createdAt: r.created_at }));
}
