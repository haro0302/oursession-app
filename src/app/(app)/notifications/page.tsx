import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import NotificationsView, {
  type AnswerWithContext,
  type ActiveChat,
} from "@/components/notifications/NotificationsView";
import type { Database } from "@/types/database";

type AnswerRow = Database["public"]["Tables"]["answers"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

export default async function NotificationsPage() {
  const supabase = await createServerSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/timeline");

  const currentUserId = authData.user.id;

  // 自分のセッション一覧
  const { data: mySessions } = await supabase
    .from("sessions")
    .select("id, title")
    .eq("author_id", currentUserId);

  const mySessionRows = (mySessions as Pick<SessionRow, "id" | "title">[] | null) ?? [];
  const mySessionIds = mySessionRows.map((s) => s.id);
  const sessionMap = new Map(mySessionRows.map((s) => [s.id, s]));

  // --- 未対応アンサー（pending） ---
  let pendingAnswers: AnswerWithContext[] = [];

  if (mySessionIds.length > 0) {
    const { data: answersRaw } = await supabase
      .from("answers")
      .select("*")
      .in("session_id", mySessionIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const rawAnswers = (answersRaw as AnswerRow[] | null) ?? [];
    const senderIds = [...new Set(rawAnswers.map((a) => a.sender_id))];

    let profileMap = new Map<string, ProfileRow>();
    if (senderIds.length > 0) {
      const { data: profilesRaw } = await supabase
        .from("profiles")
        .select("*")
        .in("id", senderIds);
      profileMap = new Map(
        ((profilesRaw as ProfileRow[] | null) ?? []).map((p) => [p.id, p])
      );
    }

    pendingAnswers = rawAnswers
      .map((a) => {
        const sender = profileMap.get(a.sender_id);
        const session = sessionMap.get(a.session_id);
        if (!sender || !session) return null;
        return { ...a, sender, session };
      })
      .filter((a): a is AnswerWithContext => a !== null);
  }

  // --- アクティブチャット（承認済みルーム。1アンサー = 1ルーム） ---
  // パターン1: 自分が投稿者のセッションに届いた承認済みアンサー
  const activeChats: ActiveChat[] = [];

  if (mySessionIds.length > 0) {
    const { data: approvedAsAuthor } = await supabase
      .from("answers")
      .select("id, session_id, sender_id")
      .in("session_id", mySessionIds)
      .eq("status", "approved");

    const rows = (approvedAsAuthor as { id: string; session_id: string; sender_id: string }[] | null) ?? [];
    const partnerIds = [...new Set(rows.map((r) => r.sender_id))];

    let partnerMap = new Map<string, ProfileRow>();
    if (partnerIds.length > 0) {
      const { data: partnersRaw } = await supabase
        .from("profiles")
        .select("*")
        .in("id", partnerIds);
      partnerMap = new Map(
        ((partnersRaw as ProfileRow[] | null) ?? []).map((p) => [p.id, p])
      );
    }

    for (const row of rows) {
      const session = sessionMap.get(row.session_id);
      const partner = partnerMap.get(row.sender_id);
      if (session && partner) {
        activeChats.push({
          answerId: row.id,
          sessionTitle: session.title,
          partnerNickname: partner.nickname,
          partnerAvatarUrl: partner.avatar_url,
          partnerIsPractice: partner.is_practice ?? false,
        });
      }
    }
  }

  // パターン2: 自分がアンサー送信者として承認されたルーム
  const { data: approvedAsSender } = await supabase
    .from("answers")
    .select("id, session_id")
    .eq("sender_id", currentUserId)
    .eq("status", "approved");

  const senderApprovedRows = (approvedAsSender as { id: string; session_id: string }[] | null) ?? [];

  if (senderApprovedRows.length > 0) {
    const senderSessionIds = [...new Set(senderApprovedRows.map((r) => r.session_id))];

    const { data: sessionsRaw } = await supabase
      .from("sessions")
      .select("id, title, author_id")
      .in("id", senderSessionIds);

    const sessionRows = (sessionsRaw as (Pick<SessionRow, "id" | "title"> & { author_id: string })[] | null) ?? [];
    const sessionInfoMap = new Map(sessionRows.map((s) => [s.id, s]));
    const authorIds = [...new Set(sessionRows.map((s) => s.author_id))];

    let authorMap = new Map<string, ProfileRow>();
    if (authorIds.length > 0) {
      const { data: authorsRaw } = await supabase
        .from("profiles")
        .select("*")
        .in("id", authorIds);
      authorMap = new Map(
        ((authorsRaw as ProfileRow[] | null) ?? []).map((p) => [p.id, p])
      );
    }

    for (const row of senderApprovedRows) {
      const s = sessionInfoMap.get(row.session_id);
      if (!s) continue;
      const author = authorMap.get(s.author_id);
      if (author) {
        activeChats.push({
          answerId: row.id,
          sessionTitle: s.title,
          partnerNickname: author.nickname,
          partnerAvatarUrl: author.avatar_url,
          partnerIsPractice: author.is_practice ?? false,
        });
      }
    }
  }

  return (
    <NotificationsView
      pendingAnswers={pendingAnswers}
      activeChats={activeChats}
      currentUserId={currentUserId}
    />
  );
}
