import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import IncomingAnswerList from "@/components/answer/IncomingAnswerList";
import type { Database } from "@/types/database";

type AnswerRow = Database["public"]["Tables"]["answers"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

export type AnswerWithContext = AnswerRow & {
  sender: ProfileRow;
  session: Pick<SessionRow, "id" | "title">;
};

type ActiveChat = {
  sessionId: string;
  sessionTitle: string;
  partnerNickname: string;
};

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

  // --- アクティブチャット（承認済み会話） ---
  // パターン1: 自分が投稿者のセッションに承認済みアンサーがある
  const activeChats: ActiveChat[] = [];
  const chatSessionIds = new Set<string>();

  if (mySessionIds.length > 0) {
    const { data: approvedAsAuthor } = await supabase
      .from("answers")
      .select("session_id, sender_id")
      .in("session_id", mySessionIds)
      .eq("status", "approved");

    const rows = (approvedAsAuthor as { session_id: string; sender_id: string }[] | null) ?? [];
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
      if (chatSessionIds.has(row.session_id)) continue;
      const session = sessionMap.get(row.session_id);
      const partner = partnerMap.get(row.sender_id);
      if (session && partner) {
        chatSessionIds.add(row.session_id);
        activeChats.push({
          sessionId: row.session_id,
          sessionTitle: session.title,
          partnerNickname: partner.nickname,
        });
      }
    }
  }

  // パターン2: 自分がアンサー送信者として承認されたセッション
  const { data: approvedAsSender } = await supabase
    .from("answers")
    .select("session_id")
    .eq("sender_id", currentUserId)
    .eq("status", "approved");

  const senderApprovedIds = (approvedAsSender as { session_id: string }[] | null) ?? [];

  if (senderApprovedIds.length > 0) {
    const newSessionIds = senderApprovedIds
      .map((r) => r.session_id)
      .filter((id) => !chatSessionIds.has(id));

    if (newSessionIds.length > 0) {
      const { data: sessionsRaw } = await supabase
        .from("sessions")
        .select("id, title, author_id")
        .in("id", newSessionIds);

      const sessionRows = (sessionsRaw as (Pick<SessionRow, "id" | "title"> & { author_id: string })[] | null) ?? [];
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

      for (const s of sessionRows) {
        if (chatSessionIds.has(s.id)) continue;
        const author = authorMap.get(s.author_id);
        if (author) {
          chatSessionIds.add(s.id);
          activeChats.push({
            sessionId: s.id,
            sessionTitle: s.title,
            partnerNickname: author.nickname,
          });
        }
      }
    }
  }

  const hasContent = pendingAnswers.length > 0 || activeChats.length > 0;

  return (
    <main style={{ padding: "0 20px 100px" }}>
      <div style={{ padding: "10px 4px 14px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>
          通知
        </h1>
      </div>

      {!hasContent && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", gap: "12px", color: "var(--text3)", fontSize: "13px", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
            🔔
          </div>
          <div>
            <div style={{ color: "var(--text2)", fontWeight: 600, marginBottom: "4px" }}>通知はまだありません</div>
            <div>アンサーが届いたらここに表示されます。</div>
          </div>
        </div>
      )}

      {pendingAnswers.length > 0 && (
        <section style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
            届いたアンサー
          </div>
          <IncomingAnswerList answers={pendingAnswers} currentUserId={currentUserId} />
        </section>
      )}

      {activeChats.length > 0 && (
        <section>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
            チャット中
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {activeChats.map((chat) => (
              <Link
                key={chat.sessionId}
                href={`/chat/${chat.sessionId}`}
                style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "14px 16px", textDecoration: "none", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
              >
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--card2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "16px" }}>
                  🎵
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {chat.partnerNickname}さんと
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    ↳ {chat.sessionTitle}
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--red2)", fontWeight: 600, flexShrink: 0 }}>
                  チャットへ →
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
