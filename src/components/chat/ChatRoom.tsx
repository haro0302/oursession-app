"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { insertMessage, upsertAssistAnswer, insertStudioProposal, chooseStudioSlot, markStudioBooked } from "@/lib/db";
import { markChatRead } from "@/lib/chatReads";
import AudioPlayer from "@/components/ui/AudioPlayer";
import Avatar from "@/components/ui/Avatar";
import AssistDeckDrawer from "@/components/chat/AssistDeckDrawer";
import AssistRecordList from "@/components/chat/AssistRecordList";
import SessionAssistPanel from "@/components/chat/SessionAssistPanel";
import StudioProposalDrawer from "@/components/chat/StudioProposalDrawer";
import StudioBookedCelebration from "@/components/chat/StudioBookedCelebration";
import { timeAgo } from "@/lib/time";
import { hasSeenStudioBooked, markStudioBookedSeen } from "@/lib/studioBookedSeen";
import type { MessageWithSender, PendingAnswerWithSender } from "@/app/chat/[answerId]/page";
import type { AssistAnswerValue, Database, StudioProposal, StudioSlot } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type AssistAnswerRow = Database["public"]["Tables"]["session_assist_answers"]["Row"];
type StudioProposalRow = Database["public"]["Tables"]["session_assist_studio_proposals"]["Row"];

const COMPOSER_MAX_HEIGHT = 120;

interface Props {
  answerId: string;
  sessionTitle: string;
  sessionAudioUrl: string | null;
  sessionAuthorNickname: string;
  partnerNickname: string;
  partnerId: string;
  partnerAvatarUrl: string | null;
  myAvatarUrl: string | null;
  initialMessages: MessageWithSender[];
  currentUserId: string;
  role: "host" | "guest" | "pending";
  pendingAnswer: PendingAnswerWithSender | null;
  initialAssistAnswers: Record<number, Record<string, AssistAnswerValue>>;
  initialStudioProposals: StudioProposal[];
}

export default function ChatRoom({
  answerId,
  sessionTitle,
  sessionAudioUrl,
  sessionAuthorNickname,
  partnerNickname,
  partnerId,
  partnerAvatarUrl,
  myAvatarUrl,
  initialMessages,
  currentUserId,
  role,
  pendingAnswer: initialPendingAnswer,
  initialAssistAnswers,
  initialStudioProposals,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [assistAnswers, setAssistAnswers] = useState<Record<number, Record<string, AssistAnswerValue>>>(initialAssistAnswers);
  const [studioProposals, setStudioProposals] = useState<StudioProposal[]>(initialStudioProposals);
  const [deckDrawerOpen, setDeckDrawerOpen] = useState(false);
  const [deckDrawerStartIndex, setDeckDrawerStartIndex] = useState(0);
  const [studioDrawerOpen, setStudioDrawerOpen] = useState(false);
  const [choosingId, setChoosingId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [celebrationProposalId, setCelebrationProposalId] = useState<string | null>(null);
  const celebratedRef = useRef<Set<string>>(new Set());
  const [pendingAnswer, setPendingAnswer] = useState<PendingAnswerWithSender | null>(initialPendingAnswer);
  const [chatVisible, setChatVisible] = useState(
    role === "guest" || (role === "host" && !initialPendingAnswer)
  );
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, assistAnswers, studioProposals]);

  // 入力欄: 改行するたびに、下端を固定したまま上へせり上がるように高さを合わせる
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
  }, [body]);

  useEffect(() => {
    if (role === "pending") return;
    markChatRead(answerId);
  }, [answerId, role]);

  // 見逃した「スタジオが決定しました！」を、次に部屋を開いたときに一度だけ出す
  useEffect(() => {
    if (role === "pending") return;
    const bookedProposal = initialStudioProposals.find((p) => p.booked_at);
    if (bookedProposal && !hasSeenStudioBooked(bookedProposal.id)) {
      const t = setTimeout(() => triggerCelebration(bookedProposal.id), 500);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (role === "pending") return;
    const channel = supabase
      .channel(`chat:${answerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `answer_id=eq.${answerId}` },
        async (payload) => {
          const newMsg = payload.new as MessageRow;
          const { data: profileRaw } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newMsg.sender_id)
            .single();
          if (profileRaw) {
            setMessages((prev) => {
              // 重複防止
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, sender: profileRaw as ProfileRow }];
            });
          }
          markChatRead(answerId);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_assist_answers", filter: `answer_id=eq.${answerId}` },
        (payload) => {
          const row = payload.new as AssistAnswerRow;
          setAssistAnswers((prev) => ({
            ...prev,
            [row.card_index]: { ...prev[row.card_index], [row.user_id]: row.value as AssistAnswerValue },
          }));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_assist_studio_proposals", filter: `answer_id=eq.${answerId}` },
        (payload) => {
          const row = payload.new as StudioProposalRow;
          setStudioProposals((prev) => {
            const before = prev.find((p) => p.id === row.id);
            if (!before?.booked_at && row.booked_at) triggerCelebration(row.id);
            const exists = prev.some((p) => p.id === row.id);
            if (exists) return prev.map((p) => (p.id === row.id ? row : p));
            return [...prev, row].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          });
        }
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("chat realtime subscription failed", status, err);
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [answerId, role]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleApprove(answer: PendingAnswerWithSender) {
    await supabase.from("answers").update({ status: "approved" } as unknown as never).eq("id", answer.id);
    setPendingAnswer(null);
    setChatVisible(true);
    try {
      await insertMessage({
        answer_id: answerId,
        sender_id: currentUserId,
        body: `${answer.sender.nickname}さんと、会えそうですね 🎵`,
      });
    } catch {
      // Realtime で拾えなくてもUI上は chatVisible が true になっているので許容
    }
  }

  function handleSkip() {
    router.back();
  }

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setBody("");
    try {
      await insertMessage({ answer_id: answerId, sender_id: currentUserId, body: trimmed });
    } catch {
      setBody(trimmed);
    } finally {
      setSending(false);
    }
  }

  async function saveAssistAnswer(cardIndex: number, value: AssistAnswerValue) {
    await upsertAssistAnswer({
      answer_id: answerId,
      user_id: currentUserId,
      card_index: cardIndex,
      value: value as unknown as Database["public"]["Tables"]["session_assist_answers"]["Insert"]["value"],
    });
    setAssistAnswers((prev) => ({
      ...prev,
      [cardIndex]: { ...prev[cardIndex], [currentUserId]: value },
    }));
    // 自分が回答したことで初めて相手の回答がRLSで見えるようになる場合があるため、
    // このカードだけ取り直して開封の取りこぼしを防ぐ。
    const { data } = await supabase
      .from("session_assist_answers")
      .select("*")
      .eq("answer_id", answerId)
      .eq("card_index", cardIndex);
    if (data) {
      setAssistAnswers((prev) => {
        const next = { ...prev[cardIndex] };
        for (const row of data as AssistAnswerRow[]) {
          next[row.user_id] = row.value as AssistAnswerValue;
        }
        return { ...prev, [cardIndex]: next };
      });
    }
  }

  function openDeckDrawer(startIndex: number) {
    setDeckDrawerStartIndex(startIndex);
    setDeckDrawerOpen(true);
  }

  async function submitStudioProposal(data: {
    studio_name: string;
    area: string;
    fee_per_hour: number | null;
    url: string | null;
    slots: StudioSlot[];
  }) {
    await insertStudioProposal({
      answer_id: answerId,
      created_by: currentUserId,
      studio_name: data.studio_name,
      area: data.area,
      fee_per_hour: data.fee_per_hour,
      url: data.url,
      slots: data.slots as unknown as Database["public"]["Tables"]["session_assist_studio_proposals"]["Insert"]["slots"],
    });
  }

  async function handleChooseSlot(proposalId: string, index: number) {
    if (choosingId) return;
    setChoosingId(proposalId);
    try {
      await chooseStudioSlot(proposalId, { chosen_index: index, chosen_by: currentUserId });
      setStudioProposals((prev) =>
        prev.map((p) =>
          p.id === proposalId
            ? { ...p, chosen_index: index, chosen_by: currentUserId, chosen_at: new Date().toISOString() }
            : p
        )
      );
    } finally {
      setChoosingId(null);
    }
  }

  async function handleMarkBooked(proposalId: string) {
    if (bookingId) return;
    setBookingId(proposalId);
    try {
      await markStudioBooked(proposalId);
      setStudioProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, booked_at: new Date().toISOString() } : p))
      );
      triggerCelebration(proposalId);
    } finally {
      setBookingId(null);
    }
  }

  function triggerCelebration(proposalId: string) {
    if (celebratedRef.current.has(proposalId)) return;
    celebratedRef.current.add(proposalId);
    markStudioBookedSeen(proposalId);
    setCelebrationProposalId(proposalId);
  }

  const isInputVisible = role !== "pending";

  const feed = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages]);

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "var(--bg)" }}>

      {/* ヘッダー */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(21,21,26,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="戻る"
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "var(--card)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={18} color="var(--text)" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sessionTitle}
          </div>
          {partnerNickname && (
            <div style={{ fontSize: "10.5px", color: "var(--text3)", marginTop: "1px" }}>
              {partnerNickname}さんと
            </div>
          )}
        </div>
      </div>

      {/* スクロールボディ */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: isInputVisible ? "70px" : "40px",
        }}
      >
        {/* セッションスニペット */}
        <div
          style={{
            margin: "12px 18px 0",
            padding: "12px 14px",
            background: "var(--card)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: sessionAudioUrl ? "10px" : "0" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, var(--red-bg), rgba(232,74,95,0.04))",
                border: "1px solid var(--red-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {sessionTitle}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "1px" }}>
                主催 · {sessionAuthorNickname}
              </div>
            </div>
          </div>
          {sessionAudioUrl && (
            <AudioPlayer src={sessionAudioUrl} />
          )}
        </div>

        {/* 承認待ち画面（pending ロール） */}
        {role === "pending" && (
          <div
            style={{
              margin: "16px 18px",
              padding: "16px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>⏳</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
              承認待ちです
            </div>
            <div style={{ fontSize: "12px", color: "var(--text2)", lineHeight: 1.7 }}>
              {sessionAuthorNickname}さんがあなたのアンサーを
              <br />
              聴いてくれるのを待っています
            </div>
          </div>
        )}

        {/* 未承認アンサーカード（ホストのみ） */}
        {role === "host" && pendingAnswer && (
          <AnswerCard
            answer={pendingAnswer}
            onApprove={handleApprove}
            onSkip={handleSkip}
          />
        )}

        {/* セッションアシスト（お題デッキ＋スタジオ枠提案） */}
        {chatVisible && (
          <div style={{ margin: "16px 18px 0" }}>
            <AssistRecordList
              assistAnswers={assistAnswers}
              currentUserId={currentUserId}
              partnerId={partnerId}
              partnerNickname={partnerNickname}
              myAvatarUrl={myAvatarUrl}
              partnerAvatarUrl={partnerAvatarUrl}
            />
            <SessionAssistPanel
              assistAnswers={assistAnswers}
              currentUserId={currentUserId}
              partnerId={partnerId}
              partnerNickname={partnerNickname}
              role={role === "guest" ? "guest" : "host"}
              studioProposals={studioProposals}
              onOpenDeck={openDeckDrawer}
              onOpenStudioDrawer={() => setStudioDrawerOpen(true)}
              onChooseSlot={handleChooseSlot}
              onMarkBooked={handleMarkBooked}
              choosingId={choosingId}
              bookingId={bookingId}
            />
          </div>
        )}

        {/* チャット区切り線 */}
        {chatVisible && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "20px 18px 14px",
              gap: "12px",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--text3)",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              チャット
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>
        )}

        {/* メッセージスレッド */}
        {chatVisible && (
          <div style={{ padding: "0 16px" }}>
            {feed.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text3)", fontSize: "12px", padding: "20px 0" }}>
                最初のメッセージを送りましょう
              </div>
            )}
            {feed.map((msg) => {
              const isSystem = msg.body.includes("会えそうですね");
              const isMine = msg.sender_id === currentUserId;

              if (isSystem) {
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: "center", margin: "14px 0" }}>
                    <div
                      style={{
                        display: "inline-block",
                        fontSize: "11.5px",
                        color: "var(--text3)",
                        padding: "5px 12px",
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: "12px",
                      }}
                    >
                      {msg.body}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: isMine ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    gap: "6px",
                    marginBottom: "10px",
                  }}
                >
                  {!isMine && (
                    <Avatar src={msg.sender.avatar_url} alt={msg.sender.nickname} size="sm" />
                  )}
                  <div style={{ maxWidth: "80%" }}>
                    {!isMine && (
                      <div style={{ fontSize: "10px", color: "var(--text3)", marginBottom: "3px", paddingLeft: "4px" }}>
                        {msg.sender.nickname}
                      </div>
                    )}
                    <div
                      style={{
                        background: isMine ? "var(--red)" : "var(--card)",
                        border: isMine ? "none" : "1px solid var(--border)",
                        borderRadius: isMine ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                        padding: "10px 14px",
                        fontSize: "13.5px",
                        color: isMine ? "white" : "var(--text)",
                        lineHeight: 1.5,
                        wordBreak: "break-word",
                        boxShadow: isMine ? "0 3px 10px rgba(232,74,95,0.3)" : "none",
                      }}
                    >
                      {msg.body}
                    </div>
                    {isMine && (
                      <div style={{ fontSize: "10px", color: "var(--text3)", textAlign: "right", marginTop: "3px", paddingRight: "4px" }}>
                        あなた
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* 入力欄 */}
      {isInputVisible && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "8px 12px calc(8px + env(safe-area-inset-bottom))",
            background: "rgba(21,21,26,0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: "8px",
            alignItems: "flex-end",
          }}
        >
          <textarea
            ref={composerRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="メッセージを入力"
            rows={1}
            style={{
              flex: 1,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "10px 16px",
              fontSize: "14px",
              lineHeight: 1.5,
              color: "var(--text)",
              outline: "none",
              fontFamily: "inherit",
              WebkitAppearance: "none",
              resize: "none",
              maxHeight: `${COMPOSER_MAX_HEIGHT}px`,
              overflowY: "auto",
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!body.trim() || sending}
            aria-label="送信"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: body.trim() ? "var(--red)" : "var(--card2)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: body.trim() ? "pointer" : "not-allowed",
              flexShrink: 0,
              transition: "background 0.2s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={body.trim() ? "white" : "var(--text3)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}

      <AssistDeckDrawer
        open={deckDrawerOpen}
        onClose={() => setDeckDrawerOpen(false)}
        initialIndex={deckDrawerStartIndex}
        mine={[0, 1, 2, 3, 4, 5].map((i) => assistAnswers[i]?.[currentUserId])}
        onSubmit={saveAssistAnswer}
      />

      <StudioProposalDrawer
        open={studioDrawerOpen}
        onClose={() => setStudioDrawerOpen(false)}
        onSubmit={submitStudioProposal}
      />

      <StudioBookedCelebration
        open={celebrationProposalId !== null}
        onClose={() => setCelebrationProposalId(null)}
      />
    </div>
  );
}

function AnswerCard({
  answer,
  onApprove,
  onSkip,
}: {
  answer: PendingAnswerWithSender;
  onApprove: (a: PendingAnswerWithSender) => void;
  onSkip: (a: PendingAnswerWithSender) => void;
}) {
  const instrument = answer.sender.instruments?.[0] ?? null;

  return (
    <div
      style={{
        margin: "12px 18px 0",
        padding: "14px",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "18px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* ヘッド: アバター + 名前 + 楽器 + 時間 */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <Avatar src={answer.sender.avatar_url} alt={answer.sender.nickname} size="md" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
              {answer.sender.nickname}
            </span>
            {instrument && (
              <span
                style={{
                  fontSize: "10px",
                  background: "var(--red-bg)",
                  border: "1px solid var(--red-border)",
                  color: "var(--red2)",
                  padding: "1px 6px",
                  borderRadius: "6px",
                  fontWeight: 600,
                }}
              >
                {instrument}
              </span>
            )}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text3)", marginTop: "2px" }}>
            {timeAgo(answer.created_at)}
          </div>
        </div>
      </div>

      {/* 音源プレイヤー */}
      {answer.audio_url && (
        <div style={{ marginBottom: "10px" }}>
          <AudioPlayer src={answer.audio_url} />
        </div>
      )}

      {/* メッセージ */}
      {answer.message && (
        <div style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.6, marginBottom: "12px" }}>
          {answer.message}
        </div>
      )}

      {/* アクション */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => onSkip(answer)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            background: "var(--card2)",
            border: "1px solid var(--border)",
            color: "var(--text2)",
          }}
        >
          あとで
        </button>
        <button
          type="button"
          onClick={() => onApprove(answer)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            background: "var(--red)",
            border: "1px solid var(--red)",
            color: "white",
            boxShadow: "0 4px 14px rgba(232,74,95,0.4)",
          }}
        >
          承認する
        </button>
      </div>
    </div>
  );
}
