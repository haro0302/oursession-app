"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { insertMessage } from "@/lib/db";
import type { MessageWithSender } from "@/app/chat/[sessionId]/page";
import type { Database } from "@/types/database";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface Props {
  sessionId: string;
  sessionTitle: string;
  initialMessages: MessageWithSender[];
  currentUserId: string;
}

export default function ChatRoom({
  sessionId,
  sessionTitle,
  initialMessages,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // 末尾へスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime 購読
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          const newMsg = payload.new as MessageRow;
          // 送信者プロフィールを取得
          const { data: profileRaw } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newMsg.sender_id)
            .single();
          if (profileRaw) {
            setMessages((prev) => [
              ...prev,
              { ...newMsg, sender: profileRaw as ProfileRow },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setBody("");
    try {
      await insertMessage({
        session_id: sessionId,
        sender_id: currentUserId,
        body: trimmed,
      });
    } catch {
      setBody(trimmed);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--bg)" }}>
      {/* ヘッダー */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px", flexShrink: 0 }}
          aria-label="戻る"
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sessionTitle}
          </div>
        </div>
      </div>

      {/* メッセージリスト */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text3)", fontSize: "13px", marginTop: "40px" }}>
            メッセージはまだありません
          </div>
        )}
        {messages.map((msg) => {
          const isSystem = msg.body.includes("会えそうですね");
          const isMine = msg.sender_id === currentUserId;

          if (isSystem) {
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "20px", padding: "6px 14px", fontSize: "12px", color: "var(--text2)" }}>
                  {msg.body}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              style={{ display: "flex", flexDirection: isMine ? "row-reverse" : "row", alignItems: "flex-end", gap: "6px", marginBottom: "10px" }}
            >
              {!isMine && (
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--card2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "11px" }}>
                  🎵
                </div>
              )}
              <div style={{ maxWidth: "72%" }}>
                {!isMine && (
                  <div style={{ fontSize: "10px", color: "var(--text3)", marginBottom: "3px", paddingLeft: "4px" }}>
                    {msg.sender.nickname}
                  </div>
                )}
                <div style={{ background: isMine ? "var(--red)" : "var(--card)", border: isMine ? "none" : "1px solid var(--border)", borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: "14px", color: isMine ? "white" : "var(--text)", lineHeight: 1.5, wordBreak: "break-word" }}>
                  {msg.body}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "10px 12px calc(10px + env(safe-area-inset-bottom))", background: "var(--bg2)", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力…"
          rows={1}
          style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border2)", borderRadius: "20px", padding: "10px 16px", fontSize: "14px", color: "var(--text)", outline: "none", resize: "none", lineHeight: 1.5, maxHeight: "120px", overflowY: "auto", fontFamily: "inherit", WebkitAppearance: "none" }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!body.trim() || sending}
          style={{ width: "40px", height: "40px", borderRadius: "50%", background: body.trim() ? "var(--red)" : "var(--card2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: body.trim() ? "pointer" : "not-allowed", flexShrink: 0, transition: "background 0.2s" }}
          aria-label="送信"
        >
          <Send size={16} color={body.trim() ? "white" : "var(--text3)"} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
