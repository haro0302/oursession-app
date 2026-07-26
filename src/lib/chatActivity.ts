import { createClient } from "@/lib/supabase";
import type { Database } from "@/types/database";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export interface RoomMessageEvent {
  roomId: string;
  senderId: string;
  createdAt: string;
}

const MAX_MESSAGES = 300;

// 送信者を問わず(自分の送信分も含めて)全メッセージを返す。
// 「並び替え」は最終活動時刻(誰が送ったかを問わない)、
// 「未読バッジ」は相手からの分だけ、と呼び出し側で用途を分けて使う。
export async function fetchRoomMessageEvents(
  roomIds: string[]
): Promise<RoomMessageEvent[]> {
  if (roomIds.length === 0) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select("answer_id, sender_id, created_at")
    .in("answer_id", roomIds)
    .order("created_at", { ascending: false })
    .limit(MAX_MESSAGES);

  const rows = (data as Pick<MessageRow, "answer_id" | "sender_id" | "created_at">[] | null) ?? [];
  return rows.map((r) => ({ roomId: r.answer_id, senderId: r.sender_id, createdAt: r.created_at }));
}
