import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import ChatRoom from "@/components/chat/ChatRoom";
import type { AssistAnswerValue, Database, ScheduleAnswerValue, ScheduleCandidate, StudioProposal } from "@/types/database";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type AnswerRow = Database["public"]["Tables"]["answers"]["Row"];
type AssistAnswerRow = Database["public"]["Tables"]["session_assist_answers"]["Row"];
type SchedulePollRow = Database["public"]["Tables"]["schedule_polls"]["Row"];

export type MessageWithSender = MessageRow & { sender: ProfileRow };
export type PendingAnswerWithSender = AnswerRow & { sender: ProfileRow };

// 日程調整ポーリング(旧・第1段)はUIから撤去済みだが、SchedulePollCard.tsx は
// 当面残しているためこの型だけは互換のためエクスポートしておく。
export type SchedulePollWithResponses = Omit<SchedulePollRow, "candidates"> & {
  candidates: ScheduleCandidate[];
  responses: Record<string, Record<string, ScheduleAnswerValue>>;
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

  // セッションアシストの回答取得（RLSにより、自分の回答 or 両者が答えて開封済みの行だけが返る）
  const assistAnswers: Record<number, Record<string, AssistAnswerValue>> = {};
  let studioProposals: StudioProposal[] = [];
  if (role !== "pending") {
    const { data: assistRaw } = await supabase
      .from("session_assist_answers")
      .select("*")
      .eq("answer_id", answerId);

    for (const row of (assistRaw as AssistAnswerRow[] | null) ?? []) {
      if (!assistAnswers[row.card_index]) assistAnswers[row.card_index] = {};
      assistAnswers[row.card_index][row.user_id] = row.value as AssistAnswerValue;
    }

    const { data: proposalsRaw } = await supabase
      .from("session_assist_studio_proposals")
      .select("*")
      .eq("answer_id", answerId)
      .order("created_at", { ascending: true });
    studioProposals = (proposalsRaw as StudioProposal[] | null) ?? [];
  }

  return (
    <ChatRoom
      answerId={answerId}
      sessionTitle={session.title}
      sessionAudioUrl={session.audio_url}
      sessionAuthorNickname={authorNickname}
      partnerNickname={partnerProfile?.nickname ?? ""}
      partnerId={partnerProfile?.id ?? ""}
      initialMessages={messages}
      currentUserId={currentUserId}
      role={role}
      pendingAnswer={answer.status === "pending" ? { ...answer, sender: senderProfile as ProfileRow } : null}
      initialAssistAnswers={assistAnswers}
      initialStudioProposals={studioProposals}
    />
  );
}
