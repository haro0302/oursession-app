"use client";

import Avatar from "@/components/ui/Avatar";
import { ASSIST_DECK, ASSIST_DECK_LENGTH } from "@/lib/assistDeck";
import type { AssistAnswerValue, AssistProfileValue } from "@/types/database";

interface Props {
  assistAnswers: Record<number, Record<string, AssistAnswerValue>>;
  currentUserId: string;
  partnerId: string;
  partnerNickname: string;
  myAvatarUrl: string | null;
  partnerAvatarUrl: string | null;
}

function formatValue(cardIndex: number, value: AssistAnswerValue): string {
  const card = ASSIST_DECK[cardIndex];
  if (card.type === "profile") {
    const v = value as AssistProfileValue;
    return `${v.parts.join(" / ")} ・ ${v.years}`;
  }
  if (card.type === "multi") return (value as string[]).join(" / ");
  return value as string;
}

export default function AssistRecordList({
  assistAnswers,
  currentUserId,
  partnerId,
  partnerNickname,
  myAvatarUrl,
  partnerAvatarUrl,
}: Props) {
  const rows = [];
  for (let i = 0; i < ASSIST_DECK_LENGTH; i++) {
    const mine = assistAnswers[i]?.[currentUserId];
    if (mine === undefined) continue; // 自分が答えていないカードは記録に出さない
    const partner = assistAnswers[i]?.[partnerId];
    rows.push(
      <div
        key={i}
        style={{
          background: "var(--card)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "13px 14px 14px",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "12.5px", color: "var(--text2)", lineHeight: 1.5, marginBottom: "11px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, color: "var(--red2)", flexShrink: 0, marginTop: "1px",
            border: "1px solid var(--red-border)", borderRadius: "5px", padding: "1px 5px", letterSpacing: "0.06em",
          }}>
            {i + 1}
          </span>
          {ASSIST_DECK[i].question}
        </div>

        <div style={{ display: "flex", gap: "9px", alignItems: "flex-start", marginBottom: "8px" }}>
          <RowLabel avatarUrl={myAvatarUrl} label="あなた" />
          <div style={{ fontSize: "13.5px", lineHeight: 1.6, background: "var(--red-bg)", borderRadius: "11px", padding: "8px 11px", flex: 1, color: "var(--text)" }}>
            {formatValue(i, mine)}
          </div>
        </div>

        <div style={{ display: "flex", gap: "9px", alignItems: "flex-start" }}>
          <RowLabel avatarUrl={partnerAvatarUrl} label={partnerNickname} />
          {partner !== undefined ? (
            <div
              style={{
                fontSize: "13.5px", lineHeight: 1.6, background: "var(--card2)", borderRadius: "11px",
                padding: "8px 11px", flex: 1, color: "var(--text)",
                animation: "assistOpenIn 0.5s cubic-bezier(0.25,0.9,0.3,1.05) both",
              }}
            >
              {formatValue(i, partner)}
            </div>
          ) : (
            <div
              style={{
                flex: 1, borderRadius: "11px", padding: "8px 11px",
                background: "rgba(255,255,255,0.035)", border: "1px dashed var(--border2)",
                fontSize: "12px", color: "var(--text3)", letterSpacing: "0.03em",
                display: "flex", alignItems: "center", gap: "8px",
              }}
            >
              <MaskBars />
              回答まち
            </div>
          )}
        </div>
      </div>
    );
  }

  if (rows.length === 0) return null;

  return (
    <div style={{ padding: "0 2px" }}>
      <style>{`
        @keyframes assistOpenIn {
          from { opacity: 0; transform: translateY(4px); filter: blur(4px); }
          to { opacity: 1; transform: none; filter: none; }
        }
        @keyframes assistShimmer { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.9; } }
      `}</style>
      {rows}
    </div>
  );
}

function RowLabel({ avatarUrl, label }: { avatarUrl: string | null; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flex: "0 0 46px" }}>
      <Avatar src={avatarUrl} alt={label} size="sm" />
      <div style={{
        fontSize: "9.5px", color: "var(--text3)", letterSpacing: "0.02em",
        textAlign: "center", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis",
        whiteSpace: "nowrap", width: "100%",
      }}>
        {label}
      </div>
    </div>
  );
}

function MaskBars() {
  const bars = [13, 22, 9];
  return (
    <span style={{ display: "flex", gap: "3px" }}>
      {bars.map((w, i) => (
        <i
          key={i}
          style={{
            display: "block", width: `${w}px`, height: "8px", borderRadius: "2px",
            background: "rgba(255,255,255,0.1)",
            animation: `assistShimmer 1.6s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}
