import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import ChatRoom from "@/components/chat/ChatRoom";
import type { Database } from "@/types/database";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

export type MessageWithSender = MessageRow & { sender: ProfileRow };

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

  const { data: sessionRaw } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  const session = sessionRaw as SessionRow | null;
  if (!session) redirect("/timeline");

  // 参加者チェック: 投稿者 OR 承認済みアンサー送信者
  const isAuthor = session.author_id === currentUserId;
  if (!isAuthor) {
    const { data: approvedAnswer } = await supabase
      .from("answers")
      .select("id")
      .eq("session_id", sessionId)
      .eq("sender_id", currentUserId)
      .eq("status", "approved")
      .single();
    if (!approvedAnswer) redirect("/timeline");
  }

  // 初期メッセージ取得（直近50件、昇順）
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

  const messages: MessageWithSender[] = rawMessages
    .map((m) => {
      const sender = profileMap.get(m.sender_id);
      if (!sender) return null;
      return { ...m, sender };
    })
    .filter((m): m is MessageWithSender => m !== null);

  return (
    <ChatRoom
      sessionId={sessionId}
      sessionTitle={session.title}
      initialMessages={messages}
      currentUserId={currentUserId}
    />
  );
}
