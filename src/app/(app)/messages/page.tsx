import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import MessagesClient from "./MessagesClient";
import type { Database } from "@/types/database";

type SessionRow = { id: string; created_at: string; song: { title: string } };
type AnswerRow = Database["public"]["Tables"]["answers"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type MsgRow = {
  roomId: string | null; // answer_id。まだアンサーが無いセッションは null(ルーム未生成)
  sessionId: string;
  sessionTitle: string;
  partnerNickname: string;
  partnerUserId: string;
  partnerAvatarUrl: string | null;
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

  // 自分のプロフィール（アンサーがまだ無いセッション行のアバター用）
  const { data: myProfileRaw } = await supabase
    .from("profiles")
    .select("nickname, avatar_url")
    .eq("id", currentUserId)
    .maybeSingle();
  const myProfile = myProfileRaw as Pick<ProfileRow, "nickname" | "avatar_url"> | null;

  // ── ホスト行: 自分が投稿したセッションに届いた「1アンサー = 1ルーム」 ──────
  const { data: mySessionsRaw } = await supabase
    .from("sessions")
    .select("id, created_at, song:songs(title)")
    .eq("author_id", currentUserId)
    .order("created_at", { ascending: false });

  const mySessions = (mySessionsRaw as unknown as SessionRow[] | null) ?? [];
  const mySessionIds = mySessions.map((s) => s.id);
  const mySessionMap = new Map(mySessions.map((s) => [s.id, s]));

  if (mySessionIds.length > 0) {
    const { data: allAnswersRaw } = await supabase
      .from("answers")
      .select("id, session_id, sender_id, status, created_at")
      .in("session_id", mySessionIds)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false });

    const allAnswers =
      (allAnswersRaw as Pick<AnswerRow, "id" | "session_id" | "sender_id" | "status" | "created_at">[] | null) ?? [];

    const answerSenderIds = [...new Set(allAnswers.map((a) => a.sender_id))];
    let answerSenderMap = new Map<string, ProfileRow>();
    if (answerSenderIds.length > 0) {
      const { data: sendersRaw } = await supabase
        .from("profiles")
        .select("*")
        .in("id", answerSenderIds);
      answerSenderMap = new Map(
        ((sendersRaw as ProfileRow[] | null) ?? []).map((p) => [p.id, p])
      );
    }

    const sessionsWithAnswer = new Set<string>();

    for (const answer of allAnswers) {
      const session = mySessionMap.get(answer.session_id);
      const sender = answerSenderMap.get(answer.sender_id);
      if (!session || !sender) continue;
      sessionsWithAnswer.add(answer.session_id);

      const isPending = answer.status === "pending";
      rows.push({
        roomId: answer.id,
        sessionId: session.id,
        sessionTitle: session.song.title,
        partnerNickname: sender.nickname,
        partnerUserId: sender.id,
        partnerAvatarUrl: sender.avatar_url,
        role: "host",
        previewText: isPending ? "新しいアンサーが届きました" : "チャット進行中",
        previewState: isPending ? "alert" : "normal",
        rawTime: answer.created_at,
        badge: isPending ? 1 : 0,
      });
    }

    // アンサーがまだ1件も無いセッションは「まだいません」のプレースホルダー行を出す
    for (const session of mySessions) {
      if (sessionsWithAnswer.has(session.id)) continue;
      rows.push({
        roomId: null,
        sessionId: session.id,
        sessionTitle: session.song.title,
        partnerNickname: myProfile?.nickname ?? "あなた",
        partnerUserId: currentUserId,
        partnerAvatarUrl: myProfile?.avatar_url ?? null,
        role: "host",
        previewText: "セッションアンサーはまだいません",
        previewState: "empty",
        rawTime: session.created_at,
        badge: 0,
      });
    }
  }

  // ── ゲスト行: 自分が送ったアンサー（自分のセッションは除外）──────
  const { data: myAnswersRaw } = await supabase
    .from("answers")
    .select("id, session_id, status, created_at")
    .eq("sender_id", currentUserId)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false });

  const myAnswers = (myAnswersRaw as Pick<AnswerRow, "id" | "session_id" | "status" | "created_at">[] | null) ?? [];
  const mySessionIdSet = new Set(mySessionIds);

  const guestAnswers = myAnswers.filter((a) => !mySessionIdSet.has(a.session_id));

  if (guestAnswers.length > 0) {
    const guestSessionIds = [...new Set(guestAnswers.map((a) => a.session_id))];

    const { data: guestSessionsRaw } = await supabase
      .from("sessions")
      .select("id, author_id, created_at, song:songs(title)")
      .in("id", guestSessionIds);

    const guestSessions = (guestSessionsRaw as unknown as (SessionRow & { author_id: string })[] | null) ?? [];
    const authorIds = [...new Set(guestSessions.map((s) => s.author_id))];

    let authorMap = new Map<string, ProfileRow>();
    if (authorIds.length > 0) {
      const { data: authorsRaw } = await supabase
        .from("profiles")
        .select("id, nickname, avatar_url")
        .in("id", authorIds);
      authorMap = new Map(
        ((authorsRaw as Pick<ProfileRow, "id" | "nickname" | "avatar_url">[] | null) ?? []).map(
          (p) => [p.id, p as ProfileRow]
        )
      );
    }

    const guestSessionMap = new Map(guestSessions.map((s) => [s.id, s]));

    for (const answer of guestAnswers) {
      const session = guestSessionMap.get(answer.session_id);
      if (!session) continue;
      const author = authorMap.get(session.author_id);
      if (!author) continue;

      const role: MsgRow["role"] = answer.status === "approved" ? "guest" : "pending";

      rows.push({
        roomId: answer.id,
        sessionId: session.id,
        sessionTitle: session.song.title,
        partnerNickname: author.nickname,
        partnerUserId: author.id,
        partnerAvatarUrl: author.avatar_url,
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
