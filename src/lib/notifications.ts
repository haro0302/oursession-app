import { createClient } from "@/lib/supabase";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type AnswerRow = Database["public"]["Tables"]["answers"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export type NotifType = "answer" | "approved" | "message";

export interface DerivedNotif {
  id: string;
  type: NotifType;
  fromUserId: string;
  fromNickname: string;
  fromAvatarUrl: string | null;
  contextTitle: string;
  contextId: string;
  createdAt: string;
}

export async function fetchNotifications(userId: string): Promise<DerivedNotif[]> {
  const supabase = createClient();
  const results: DerivedNotif[] = [];

  // 1. 自分のセッションへの未対応アンサー → type='answer'
  const { data: mySessions } = await supabase
    .from("sessions")
    .select("id, title")
    .eq("author_id", userId);

  const mySessionRows = (mySessions as Pick<SessionRow, "id" | "title">[] | null) ?? [];
  const mySessionIds = mySessionRows.map((s) => s.id);
  const sessionTitleMap = new Map(mySessionRows.map((s) => [s.id, s.title]));

  if (mySessionIds.length > 0) {
    const { data: pendingAnswers } = await supabase
      .from("answers")
      .select("id, session_id, sender_id, created_at")
      .in("session_id", mySessionIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const rawPending = (pendingAnswers as Pick<AnswerRow, "id" | "session_id" | "sender_id" | "created_at">[] | null) ?? [];
    const senderIds = [...new Set(rawPending.map((a) => a.sender_id))];

    let profileMap = new Map<string, Pick<ProfileRow, "id" | "nickname" | "avatar_url">>();
    if (senderIds.length > 0) {
      const { data: profilesRaw } = await supabase
        .from("profiles")
        .select("id, nickname, avatar_url")
        .in("id", senderIds);
      profileMap = new Map(
        ((profilesRaw as Pick<ProfileRow, "id" | "nickname" | "avatar_url">[] | null) ?? []).map((p) => [p.id, p])
      );
    }

    for (const a of rawPending) {
      const profile = profileMap.get(a.sender_id);
      if (!profile) continue;
      results.push({
        id: `answer-${a.id}`,
        type: "answer",
        fromUserId: a.sender_id,
        fromNickname: profile.nickname,
        fromAvatarUrl: profile.avatar_url,
        contextTitle: sessionTitleMap.get(a.session_id) ?? "",
        contextId: a.session_id,
        createdAt: a.created_at,
      });
    }
  }

  // 2. 自分が送ったアンサーが承認された → type='approved'
  const { data: approvedAnswers } = await supabase
    .from("answers")
    .select("id, session_id, created_at")
    .eq("sender_id", userId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(20);

  const rawApproved = (approvedAnswers as Pick<AnswerRow, "id" | "session_id" | "created_at">[] | null) ?? [];
  const approvedSessionIds = rawApproved.map((a) => a.session_id);

  type ApprovedSession = Pick<SessionRow, "id" | "title"> & { author_id: string };
  let approvedSessions: ApprovedSession[] = [];

  if (approvedSessionIds.length > 0) {
    const { data: approvedSessionsRaw } = await supabase
      .from("sessions")
      .select("id, title, author_id")
      .in("id", approvedSessionIds);

    approvedSessions = (approvedSessionsRaw as ApprovedSession[] | null) ?? [];
    const authorIds = [...new Set(approvedSessions.map((s) => s.author_id))];

    let authorMap = new Map<string, Pick<ProfileRow, "id" | "nickname" | "avatar_url">>();
    if (authorIds.length > 0) {
      const { data: authorsRaw } = await supabase
        .from("profiles")
        .select("id, nickname, avatar_url")
        .in("id", authorIds);
      authorMap = new Map(
        ((authorsRaw as Pick<ProfileRow, "id" | "nickname" | "avatar_url">[] | null) ?? []).map((p) => [p.id, p])
      );
    }

    const approvedSessionMap = new Map(approvedSessions.map((s) => [s.id, s]));
    for (const a of rawApproved) {
      const sess = approvedSessionMap.get(a.session_id);
      if (!sess) continue;
      const author = authorMap.get(sess.author_id);
      if (!author) continue;
      results.push({
        id: `approved-${a.id}`,
        type: "approved",
        fromUserId: sess.author_id,
        fromNickname: author.nickname,
        fromAvatarUrl: author.avatar_url,
        contextTitle: sess.title,
        contextId: a.session_id,
        createdAt: a.created_at,
      });
    }
  }

  // 3. 自分が参加中のチャットの他者メッセージ → type='message'
  const allChatSessionIds = [
    ...mySessionIds,
    ...approvedSessionIds.filter((id) => !mySessionIds.includes(id)),
  ];

  if (allChatSessionIds.length > 0) {
    const { data: messagesRaw } = await supabase
      .from("messages")
      .select("id, session_id, sender_id, body, created_at")
      .in("session_id", allChatSessionIds)
      .neq("sender_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const msgs = (messagesRaw as Pick<MessageRow, "id" | "session_id" | "sender_id" | "body" | "created_at">[] | null) ?? [];
    const msgSenderIds = [...new Set(msgs.map((m) => m.sender_id))];

    let senderProfileMap = new Map<string, Pick<ProfileRow, "id" | "nickname" | "avatar_url">>();
    if (msgSenderIds.length > 0) {
      const { data: sendersRaw } = await supabase
        .from("profiles")
        .select("id, nickname, avatar_url")
        .in("id", msgSenderIds);
      senderProfileMap = new Map(
        ((sendersRaw as Pick<ProfileRow, "id" | "nickname" | "avatar_url">[] | null) ?? []).map((p) => [p.id, p])
      );
    }

    // 同じセッションで重複しないよう最新1件のみ
    const seenSessions = new Set<string>();
    for (const m of msgs) {
      if (seenSessions.has(m.session_id)) continue;
      seenSessions.add(m.session_id);
      const senderProfile = senderProfileMap.get(m.sender_id);
      const titleOrBody = m.body.slice(0, 40);
      results.push({
        id: `message-${m.id}`,
        type: "message",
        fromUserId: m.sender_id,
        fromNickname: senderProfile?.nickname ?? "不明",
        fromAvatarUrl: senderProfile?.avatar_url ?? null,
        contextTitle: titleOrBody,
        contextId: m.session_id,
        createdAt: m.created_at,
      });
    }
  }

  // 新しい順にソート
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return results;
}

export function getUnreadCount(
  notifs: DerivedNotif[],
  readAt: Date | null,
  blockedIds: Set<string>
): number {
  return notifs.filter(
    (n) => !blockedIds.has(n.fromUserId) && (!readAt || new Date(n.createdAt) > readAt)
  ).length;
}
