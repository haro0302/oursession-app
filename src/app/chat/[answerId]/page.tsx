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
  params: Promise<{ answerId: string }>;
}) {
  const { answerId } = await params;
  const supabase = await createServerSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/timeline");

  const currentUserId = authData.user.id;

  // このルームの正体(承認待ち/承認済みの1アンサー)
  const { data: answerRaw } = await supabase
    .from("answers")
    .select("*")
    .eq("id", answerId)
    .single();

  const answer = answerRaw as AnswerRow | null;
  if (!answer) redirect("/messages");

  const { data: sessionRaw } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", answer.session_id)
    .single();

  const session = sessionRaw as SessionRow | null;
  if (!session) redirect("/messages");

  const isAuthor = session.author_id === currentUserId;
  const isSender = answer.sender_id === currentUserId;
  if (!isAuthor && !isSender) redirect("/messages");

  const { data: authorProfileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.author_id)
    .maybeSingle();
  const authorProfile = authorProfileRaw as ProfileRow | null;
  const authorNickname = authorProfile?.nickname ?? "";

  const { data: senderProfileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", answer.sender_id)
    .maybeSingle();
  const senderProfile = senderProfileRaw as ProfileRow | null;

  let role: "host" | "guest" | "pending";
  if (isAuthor) {
    role = "host";
  } else if (answer.status === "approved") {
    role = "guest";
  } else {
    role = "pending";
  }

  // このルームの相手(ホストからは送信者、送信者からはホスト)
  const partnerProfile = isAuthor ? senderProfile : authorProfile;

  // 承認済みルームの参加者2人(ホスト + 送信者)
  const members: ProfileRow[] = [authorProfile, senderProfile].filter(
    (p): p is ProfileRow => p !== null
  );

  // メッセージ取得（RLSでこのルームの当事者のみ）
  let messages: MessageWithSender[] = [];
  if (role !== "pending") {
    const { data: messagesRaw } = await supabase
      .from("messages")
      .select("*")
      .eq("answer_id", answerId)
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

  // 日程調整ポーリング取得（RLSでこのルームの当事者のみ）
  let schedulePolls: SchedulePollWithResponses[] = [];
  if (role !== "pending") {
    const { data: pollsRaw } = await supabase
      .from("schedule_polls")
      .select("*")
      .eq("answer_id", answerId)
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
      answerId={answerId}
      sessionTitle={session.title}
      sessionAudioUrl={session.audio_url}
      sessionAuthorNickname={authorNickname}
      partnerNickname={partnerProfile?.nickname ?? ""}
      initialMessages={messages}
      currentUserId={currentUserId}
      role={role}
      pendingAnswer={answer.status === "pending" ? { ...answer, sender: senderProfile as ProfileRow } : null}
      members={members}
      initialSchedulePolls={schedulePolls}
    />
  );
}
