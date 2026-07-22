import { createClient } from "@/lib/supabase";
import type { Database } from "@/types/database";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export interface RoomMessageEvent {
  roomId: string;
  createdAt: string;
}

const MAX_MESSAGES = 300;

export async function fetchOtherPartyMessages(
  userId: string,
  roomIds: string[]
): Promise<RoomMessageEvent[]> {
  if (roomIds.length === 0) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select("answer_id, created_at")
    .in("answer_id", roomIds)
    .neq("sender_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_MESSAGES);

  const rows = (data as Pick<MessageRow, "answer_id" | "created_at">[] | null) ?? [];
  return rows.map((r) => ({ roomId: r.answer_id, createdAt: r.created_at }));
}
