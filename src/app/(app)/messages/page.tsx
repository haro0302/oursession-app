import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import MessagesClient from "./MessagesClient";
import type { Database } from "@/types/database";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type AnswerRow = Database["public"]["Tables"]["answers"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type MsgRow = {
  sessionId: string;
  sessionTitle: string;
  partnerNickname: string;
  partnerUserId: string;
  partnerAvatarUrl: string | null;
  partnerIsPractice: boolean;
  role: "host" | "guest" | "pending";
  previewText: string;
  previewState: "alert" | "pending" | "normal" | "empty";
  rawTime: string;
  badge: number;
};

export default async function MessagesPage() {
  const supabase = await createServerSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/timeline");

  const currentUserId = authData.user.id;
  const rows: MsgRow[] = [];

  // 自分のプロフィール（ホスト行のアバター用）
  const { data: myProfileRaw } = await supabase
    .from("profiles")
    .select("nickname, avatar_url, is_practice")
    .eq("id", currentUserId)
    .maybeSingle();
  const myProfile = myProfileRaw as Pick<ProfileRow, "nickname" | "avatar_url" | "is_practice"> | null;

  // ── ホスト行: 自分が投稿したセッション ──────────────────────────
  const { data: mySessionsRaw } = await supabase
    .from("sessions")
    .select("id, title, created_at")
    .eq("author_id", currentUserId)
    .order("created_at", { ascending: false });

  const mySessions = (mySessionsRaw as Pick<SessionRow, "id" | "title" | "created_at">[] | null) ?? [];
  const mySessionIds = mySessions.map((s) => s.id);

  if (mySessionIds.length > 0) {
    // セッションへの全アンサー（pending + approved）を一括取得
    const { data: allAnswersRaw } = await supabase
      .from("answers")
      .select("session_id, status, created_at")
      .in("session_id", mySessionIds)
      .in("status", ["pending", "approved"]);

    const allAnswers = (allAnswersRaw as Pick<AnswerRow, "session_id" | "status" | "created_at">[] | null) ?? [];

    // セッションごとに集計
    const answerSummary = new Map<string, { pendingCount: number; hasActivity: boolean; latestTime: string }>();
    for (const a of allAnswers) {
      const entry = answerSummary.get(a.session_id) ?? { pendingCount: 0, hasActivity: false, latestTime: "" };
      if (a.status === "pending") entry.pendingCount++;
      entry.hasActivity = true;
      if (!entry.latestTime || a.created_at > entry.latestTime) entry.latestTime = a.created_at;
      answerSummary.set(a.session_id, entry);
    }

    for (const session of mySessions) {
      const summary = answerSummary.get(session.id);
      const pendingCount = summary?.pendingCount ?? 0;
      const rawTime = summary?.latestTime || session.created_at;

      let previewText: string;
      let previewState: MsgRow["previewState"];
      let badge = 0;

      if (pendingCount > 0) {
        previewText = `新しいアンサー · ${pendingCount}件`;
        previewState = "alert";
        badge = pendingCount;
      } else if (summary?.hasActivity) {
        previewText = "チャット進行中";
        previewState = "normal";
      } else {
        previewText = "セッションアンサーはまだいません";
        previewState = "empty";
      }

      rows.push({
        sessionId: session.id,
        sessionTitle: session.title,
        partnerNickname: myProfile?.nickname ?? "あなた",
        partnerUserId: currentUserId,
        partnerAvatarUrl: myProfile?.avatar_url ?? null,
        partnerIsPractice: myProfile?.is_practice ?? false,
        role: "host",
        previewText,
        previewState,
        rawTime,
        badge,
      });
    }
  }

  // ── ゲスト行: 自分が送ったアンサー（自分のセッションは除外）──────
  const { data: myAnswersRaw } = await supabase
    .from("answers")
    .select("session_id, status, created_at")
    .eq("sender_id", currentUserId)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false });

  const myAnswers = (myAnswersRaw as Pick<AnswerRow, "session_id" | "status" | "created_at">[] | null) ?? [];
  const mySessionIdSet = new Set(mySessionIds);

  const guestAnswers = myAnswers.filter((a) => !mySessionIdSet.has(a.session_id));

  if (guestAnswers.length > 0) {
    const guestSessionIds = [...new Set(guestAnswers.map((a) => a.session_id))];

    const { data: guestSessionsRaw } = await supabase
      .from("sessions")
      .select("id, title, author_id, created_at")
      .in("id", guestSessionIds);

    const guestSessions = (guestSessionsRaw as Pick<SessionRow, "id" | "title" | "author_id" | "created_at">[] | null) ?? [];
    const authorIds = [...new Set(guestSessions.map((s) => s.author_id))];

    let authorMap = new Map<string, ProfileRow>();
    if (authorIds.length > 0) {
      const { data: authorsRaw } = await supabase
        .from("profiles")
        .select("id, nickname, avatar_url, is_practice")
        .in("id", authorIds);
      authorMap = new Map(
        ((authorsRaw as Pick<ProfileRow, "id" | "nickname" | "avatar_url" | "is_practice">[] | null) ?? []).map(
          (p) => [p.id, p as ProfileRow]
        )
      );
    }

    const guestSessionMap = new Map(guestSessions.map((s) => [s.id, s]));
    const seenSessions = new Set<string>();

    for (const answer of guestAnswers) {
      if (seenSessions.has(answer.session_id)) continue;
      seenSessions.add(answer.session_id);

      const session = guestSessionMap.get(answer.session_id);
      if (!session) continue;
      const author = authorMap.get(session.author_id);
      if (!author) continue;

      const role: MsgRow["role"] = answer.status === "approved" ? "guest" : "pending";

      rows.push({
        sessionId: session.id,
        sessionTitle: session.title,
        partnerNickname: author.nickname,
        partnerUserId: author.id,
        partnerAvatarUrl: author.avatar_url,
        partnerIsPractice: author.is_practice,
        role,
        previewText: role === "pending" ? "↳ アンサー送信済み · 承認待ち" : "チャット中",
        previewState: role === "pending" ? "pending" : "normal",
        rawTime: answer.created_at,
        badge: 0,
      });
    }
  }

  rows.sort((a, b) => (a.rawTime > b.rawTime ? -1 : 1));

  return <MessagesClient rows={rows} currentUserId={currentUserId} />;
}
