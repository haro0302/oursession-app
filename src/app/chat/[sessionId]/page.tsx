import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import ChatRoom from "@/components/chat/ChatRoom";
import type { Database, ScheduleAnswerValue, ScheduleCandidate } from "@/types/database";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type AnswerRow = Database["public"]["Tables"]["answers"]["Row"];
type SchedulePollRow = Database["public"]["Tables"]["schedule_polls"]["Row"];
type SchedulePollResponseRow = Database["public"]["Tables"]["schedule_poll_responses"]["Row"];

export type MessageWithSender = MessageRow & { sender: ProfileRow };
export type PendingAnswerWithSender = AnswerRow & { sender: ProfileRow };
export type SchedulePollWithResponses = Omit<SchedulePollRow, "candidates"> & {
  candidates: ScheduleCandidate[];
  responses: Record<string, Record<string, ScheduleAnswerValue>>; // userId -> candidateId -> answer
};

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
    .select("*")
    .eq("id", session.author_id)
    .maybeSingle();
  const authorProfile = authorProfileRaw as ProfileRow | null;
  const authorNickname = authorProfile?.nickname ?? "";

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

  // 承認済み参加者（ホスト + 承認済みアンサー送信者）のプロフィール一覧
  const { data: approvedAnswersRaw } = await supabase
    .from("answers")
    .select("*")
    .eq("session_id", sessionId)
    .eq("status", "approved");
  const approvedSenderIds = [
    ...new Set(((approvedAnswersRaw as AnswerRow[] | null) ?? []).map((a) => a.sender_id)),
  ];

  let approvedSenderProfiles: ProfileRow[] = [];
  if (approvedSenderIds.length > 0) {
    const { data: approvedSendersRaw } = await supabase
      .from("profiles")
      .select("*")
      .in("id", approvedSenderIds);
    approvedSenderProfiles = (approvedSendersRaw as ProfileRow[] | null) ?? [];
  }

  const members: ProfileRow[] = authorProfile
    ? [authorProfile, ...approvedSenderProfiles]
    : approvedSenderProfiles;
  const memberCount = members.length;

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

  // 日程調整ポーリング取得（RLSで承認済み参加者のみ）
  let schedulePolls: SchedulePollWithResponses[] = [];
  if (role !== "pending") {
    const { data: pollsRaw } = await supabase
      .from("schedule_polls")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    const rawPolls = (pollsRaw as SchedulePollRow[] | null) ?? [];

    if (rawPolls.length > 0) {
      const pollIds = rawPolls.map((p) => p.id);
      const { data: responsesRaw } = await supabase
        .from("schedule_poll_responses")
        .select("*")
        .in("poll_id", pollIds);

      const rawResponses = (responsesRaw as SchedulePollResponseRow[] | null) ?? [];
      const responsesByPoll = new Map<string, Record<string, Record<string, ScheduleAnswerValue>>>();
      for (const r of rawResponses) {
        if (!responsesByPoll.has(r.poll_id)) responsesByPoll.set(r.poll_id, {});
        responsesByPoll.get(r.poll_id)![r.user_id] = r.answers as Record<string, ScheduleAnswerValue>;
      }

      schedulePolls = rawPolls.map((p) => ({
        ...p,
        candidates: p.candidates as unknown as ScheduleCandidate[],
        responses: responsesByPoll.get(p.id) ?? {},
      }));
    }
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
      members={members}
      initialSchedulePolls={schedulePolls}
    />
  );
}
