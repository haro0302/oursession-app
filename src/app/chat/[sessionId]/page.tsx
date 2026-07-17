import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import ChatRoom from "@/components/chat/ChatRoom";
import type { Database } from "@/types/database";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type AnswerRow = Database["public"]["Tables"]["answers"]["Row"];

export type MessageWithSender = MessageRow & { sender: ProfileRow };
export type PendingAnswerWithSender = AnswerRow & { sender: ProfileRow };

export default async function ChatPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createServerSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/timeline");

  const currentUserId = authData.user.id;

  // セッション + 投稿者プロフィール
  const { data: sessionRaw } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  const session = sessionRaw as SessionRow | null;
  if (!session) redirect("/messages");

  const { data: authorProfileRaw } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", session.author_id)
    .maybeSingle();
  const authorNickname = (authorProfileRaw as Pick<ProfileRow, "nickname"> | null)?.nickname ?? "";

  const isAuthor = session.author_id === currentUserId;

  let role: "host" | "guest" | "pending" = "host";

  if (!isAuthor) {
    // 承認済みかチェック
    const { data: approvedAnswer } = await supabase
      .from("answers")
      .select("id")
      .eq("session_id", sessionId)
      .eq("sender_id", currentUserId)
      .eq("status", "approved")
      .maybeSingle();

    if (approvedAnswer) {
      role = "guest";
    } else {
      // 保留中かチェック
      const { data: pendingAnswer } = await supabase
        .from("answers")
        .select("id")
        .eq("session_id", sessionId)
        .eq("sender_id", currentUserId)
        .eq("status", "pending")
        .maybeSingle();

      if (pendingAnswer) {
        role = "pending";
      } else {
        redirect("/messages");
      }
    }
  }

  // 未承認アンサー（ホストのみ取得）
  let pendingAnswers: PendingAnswerWithSender[] = [];
  if (role === "host") {
    const { data: pendingRaw } = await supabase
      .from("answers")
      .select("*")
      .eq("session_id", sessionId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    const rawPending = (pendingRaw as AnswerRow[] | null) ?? [];
    const senderIds = [...new Set(rawPending.map((a) => a.sender_id))];

    let senderMap = new Map<string, ProfileRow>();
    if (senderIds.length > 0) {
      const { data: sendersRaw } = await supabase
        .from("profiles")
        .select("*")
        .in("id", senderIds);
      senderMap = new Map(
        ((sendersRaw as ProfileRow[] | null) ?? []).map((p) => [p.id, p])
      );
    }

    pendingAnswers = rawPending
      .map((a) => {
        const sender = senderMap.get(a.sender_id);
        if (!sender) return null;
        return { ...a, sender };
      })
      .filter((a): a is PendingAnswerWithSender => a !== null);
  }

  // 承認済みアンサー数（メンバー人数用）
  const { data: approvedCountRaw } = await supabase
    .from("answers")
    .select("id")
    .eq("session_id", sessionId)
    .eq("status", "approved");
  const memberCount = ((approvedCountRaw as { id: string }[] | null) ?? []).length + 1;

  // メッセージ取得（RLSで承認済み参加者のみ）
  let messages: MessageWithSender[] = [];
  if (role !== "pending") {
    const { data: messagesRaw } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(50);

    const rawMessages = (messagesRaw as MessageRow[] | null) ?? [];
    const senderIds = [...new Set(rawMessages.map((m) => m.sender_id))];

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

    if (!profileMap.has(currentUserId)) {
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUserId)
        .single();
      if (myProfile) profileMap.set(currentUserId, myProfile as ProfileRow);
    }

    messages = rawMessages
      .map((m) => {
        const sender = profileMap.get(m.sender_id);
        if (!sender) return null;
        return { ...m, sender };
      })
      .filter((m): m is MessageWithSender => m !== null);
  }

  return (
    <ChatRoom
      sessionId={sessionId}
      sessionTitle={session.title}
      sessionAudioUrl={session.audio_url}
      sessionAuthorNickname={authorNickname}
      initialMessages={messages}
      currentUserId={currentUserId}
      role={role}
      pendingAnswers={pendingAnswers}
      initialMemberCount={memberCount}
    />
  );
}
