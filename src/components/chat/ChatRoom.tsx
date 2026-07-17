"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Users, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { insertMessage } from "@/lib/db";
import AudioPlayer from "@/components/ui/AudioPlayer";
import type { MessageWithSender, PendingAnswerWithSender } from "@/app/chat/[sessionId]/page";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "昨日";
  return `${day}日前`;
}

function UserIconSmall({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

interface Props {
  sessionId: string;
  sessionTitle: string;
  sessionAudioUrl: string | null;
  sessionAuthorNickname: string;
  initialMessages: MessageWithSender[];
  currentUserId: string;
  role: "host" | "guest" | "pending";
  pendingAnswers: PendingAnswerWithSender[];
  initialMemberCount: number;
}

export default function ChatRoom({
  sessionId,
  sessionTitle,
  sessionAudioUrl,
  sessionAuthorNickname,
  initialMessages,
  currentUserId,
  role,
  pendingAnswers: initialPendingAnswers,
  initialMemberCount,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [pendingAnswers, setPendingAnswers] = useState<PendingAnswerWithSender[]>(initialPendingAnswers);
  const [deferredAnswers, setDeferredAnswers] = useState<PendingAnswerWithSender[]>([]);
  const [pendingBarExpanded, setPendingBarExpanded] = useState(false);
  const [chatVisible, setChatVisible] = useState(
    role !== "host" || initialMemberCount > 1
  );
  const [memberCount, setMemberCount] = useState(initialMemberCount);
  const [greetingOpen, setGreetingOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (role === "pending") return;
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `session_id=eq.${sessionId}` },
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
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, role]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleApprove(answer: PendingAnswerWithSender) {
    await supabase.from("answers").update({ status: "approved" } as unknown as never).eq("id", answer.id);
    const remaining = pendingAnswers.filter((a) => a.id !== answer.id);
    setDeferredAnswers((prev) => [...prev, ...remaining]);
    setPendingAnswers([]);
    setChatVisible(true);
    setMemberCount((n) => n + 1);
    try {
      await insertMessage({
        session_id: sessionId,
        sender_id: currentUserId,
        body: `${answer.sender.nickname}さんと、会えそうですね 🎵`,
      });
    } catch {
      // Realtime で拾えなくてもUI上は chatVisible が true になっているので許容
    }
  }

  function handleSkip(answer: PendingAnswerWithSender) {
    setPendingAnswers((prev) => prev.filter((a) => a.id !== answer.id));
    setDeferredAnswers((prev) => [...prev, answer]);
  }

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setBody("");
    try {
      await insertMessage({ session_id: sessionId, sender_id: currentUserId, body: trimmed });
    } catch {
      setBody(trimmed);
    } finally {
      setSending(false);
    }
  }

  async function sendGreeting(text: string) {
    setGreetingOpen(false);
    setSending(true);
    try {
      await insertMessage({ session_id: sessionId, sender_id: currentUserId, body: text });
    } finally {
      setSending(false);
    }
  }

  async function sendPartPoll() {
    setSending(true);
    try {
      await insertMessage({ session_id: sessionId, sender_id: currentUserId, body: "担当の楽器を教えてください" });
    } finally {
      setSending(false);
    }
  }

  const isInputVisible = role !== "pending";
  const isQuickReplyVisible = chatVisible && role !== "pending";

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
        <div
          style={{
            flex: 1,
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
        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text3)", flexShrink: 0 }}>
          <Users size={13} />
          <span style={{ fontSize: "12px", fontWeight: 600 }}>{memberCount}</span>
        </div>
      </div>

      {/* スクロールボディ */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: isInputVisible ? (isQuickReplyVisible ? "120px" : "70px") : "40px",
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

        {/* 保留中バー */}
        {deferredAnswers.length > 0 && (
          <button
            type="button"
            onClick={() => setPendingBarExpanded((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              padding: "10px 18px",
              background: "var(--card2)",
              border: "none",
              borderBottom: "1px solid var(--border)",
              borderTop: "1px solid var(--border)",
              cursor: "pointer",
              marginTop: "12px",
              fontFamily: "inherit",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--red2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ flex: 1, fontSize: "12px", fontWeight: 600, color: "var(--text2)", textAlign: "left" }}>
              保留中 {deferredAnswers.length}人
            </span>
            {pendingBarExpanded ? <ChevronUp size={14} color="var(--text2)" /> : <ChevronDown size={14} color="var(--text2)" />}
          </button>
        )}

        {/* 展開中の保留アンサー */}
        {pendingBarExpanded && deferredAnswers.map((answer) => (
          <AnswerCard
            key={answer.id}
            answer={answer}
            onApprove={handleApprove}
            onSkip={handleSkip}
          />
        ))}

        {/* 未承認アンサーカード（ホストのみ） */}
        {role === "host" && pendingAnswers.map((answer) => (
          <AnswerCard
            key={answer.id}
            answer={answer}
            onApprove={handleApprove}
            onSkip={handleSkip}
          />
        ))}

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
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text3)", fontSize: "12px", padding: "20px 0" }}>
                最初のメッセージを送りましょう
              </div>
            )}
            {messages.map((msg) => {
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
                    <div
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #3b3b46 0%, #1f1f28 100%)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <UserIconSmall size={12} />
                    </div>
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

      {/* 挨拶ピッカー */}
      {greetingOpen && (
        <div
          style={{
            position: "absolute",
            bottom: isInputVisible ? (isQuickReplyVisible ? "118px" : "68px") : "8px",
            left: "16px",
            right: "16px",
            background: "var(--card)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            overflow: "hidden",
            zIndex: 10,
          }}
        >
          {["こんにちは", "よろしくお願いします", "はじめまして"].map((text, i, arr) => (
            <button
              key={text}
              type="button"
              onClick={() => sendGreeting(text)}
              style={{
                display: "block",
                width: "100%",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "14px",
                color: "var(--text)",
                fontFamily: "inherit",
              }}
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {/* クイックリプライ */}
      {isQuickReplyVisible && (
        <div
          style={{
            position: "fixed",
            bottom: "56px",
            left: 0,
            right: 0,
            display: "flex",
            gap: "8px",
            padding: "6px 16px",
            background: "var(--bg)",
            borderTop: "1px solid var(--border)",
            overflowX: "auto",
          }}
        >
          {[
            { label: "挨拶する", disabled: false, onClick: () => setGreetingOpen((v) => !v) },
            { label: "担当は?", disabled: false, onClick: sendPartPoll },
            { label: "日程は?", disabled: true, onClick: () => {} },
            { label: "スタジオは?", disabled: true, onClick: () => {} },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.disabled ? undefined : chip.onClick}
              disabled={chip.disabled}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                background: chip.disabled ? "transparent" : "var(--card)",
                color: chip.disabled ? "var(--text3)" : "var(--text2)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: chip.disabled ? "default" : "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                fontFamily: "inherit",
                opacity: chip.disabled ? 0.4 : 1,
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

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
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleSend(); }
            }}
            placeholder="メッセージを入力"
            style={{
              flex: 1,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "10px 16px",
              fontSize: "14px",
              color: "var(--text)",
              outline: "none",
              fontFamily: "inherit",
              WebkitAppearance: "none",
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
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b3b46 0%, #1f1f28 100%)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <UserIconSmall />
        </div>
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
