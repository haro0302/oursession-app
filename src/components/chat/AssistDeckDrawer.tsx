"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { ASSIST_DECK, ASSIST_DECK_LENGTH } from "@/lib/assistDeck";
import type { AssistAnswerValue, AssistProfileValue } from "@/types/database";

interface Props {
  open: boolean;
  onClose: () => void;
  initialIndex: number;
  mine: (AssistAnswerValue | undefined)[]; // length 6、自分の既存回答
  onSubmit: (cardIndex: number, value: AssistAnswerValue) => Promise<void>;
}

export default function AssistDeckDrawer({ open, onClose, initialIndex, mine, onSubmit }: Props) {
  const [dIdx, setDIdx] = useState(initialIndex);
  const [tmpParts, setTmpParts] = useState<string[]>([]);
  const [tmpYears, setTmpYears] = useState<string | null>(null);
  const [tmpMulti, setTmpMulti] = useState<string[]>([]);
  const [tmpText, setTmpText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDIdx(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const card = ASSIST_DECK[dIdx];
    const existing = mine[dIdx];
    if (card.type === "profile") {
      const v = existing as AssistProfileValue | undefined;
      setTmpParts(v ? [...v.parts] : []);
      setTmpYears(v ? v.years : null);
    } else if (card.type === "multi") {
      setTmpMulti(existing ? [...(existing as string[])] : []);
    } else {
      setTmpText(existing ? (existing as string) : "");
    }
  }, [open, dIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const card = ASSIST_DECK[dIdx];
  const isLast = dIdx === ASSIST_DECK_LENGTH - 1;

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  function canSubmit(): boolean {
    if (submitting) return false;
    if (card.type === "profile") return tmpParts.length > 0 && !!tmpYears;
    if (card.type === "multi") return tmpMulti.length > 0;
    return tmpText.trim().length > 0;
  }

  async function handleSubmit() {
    if (!canSubmit()) return;
    let value: AssistAnswerValue;
    if (card.type === "profile") {
      value = { parts: [...tmpParts], years: tmpYears! };
    } else if (card.type === "multi") {
      value = [...tmpMulti];
    } else {
      value = tmpText.trim();
    }
    setSubmitting(true);
    try {
      await onSubmit(dIdx, value);
      if (isLast) {
        onClose();
      } else {
        setDIdx((i) => i + 1);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 70,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 85,
          background: "rgba(20,20,26,0.97)",
          backdropFilter: "blur(32px) saturate(1.4)",
          WebkitBackdropFilter: "blur(32px) saturate(1.4)",
          borderTop: "1px solid var(--border2)",
          borderRadius: "24px 24px 0 0",
          maxHeight: "88%",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Handle */}
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: "8px" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "var(--text3)", opacity: 0.4 }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 18px 14px",
          borderBottom: "1px solid var(--border)", flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent", border: "none",
              fontSize: "14px", color: "var(--text2)", fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit", padding: "6px 2px", minWidth: "60px",
            }}
          >
            あとにする
          </button>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ fontSize: "17px", fontWeight: 700, color: "var(--red2)" }}>{dIdx + 1}</span>
            <span style={{ fontSize: "12px", color: "var(--text3)" }}>/ {ASSIST_DECK_LENGTH}</span>
          </div>
          <div style={{ minWidth: "60px" }} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 32px" }}>
          {/* pips */}
          <div style={{ display: "flex", gap: "5px", marginBottom: "16px" }}>
            {ASSIST_DECK.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1, height: "4px", borderRadius: "2px",
                  background: mine[i] !== undefined ? "var(--red)" : i === dIdx ? "var(--red-border)" : "var(--border)",
                }}
              />
            ))}
          </div>

          <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", lineHeight: 1.4, marginBottom: "6px" }}>
            {card.question}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text3)", lineHeight: 1.6, marginBottom: "16px" }}>
            {card.hint}
          </div>

          {card.type === "profile" && (
            <>
              <div style={{ fontSize: "11px", color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: "9px" }}>
                パート(複数可)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px" }}>
                {card.parts.map((p) => (
                  <Chip key={p} label={p} active={tmpParts.includes(p)} onClick={() => toggle(tmpParts, setTmpParts, p)} />
                ))}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: "9px" }}>
                音楽歴
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {card.years.map((y) => (
                  <Chip key={y} label={y} active={tmpYears === y} onClick={() => setTmpYears(y)} />
                ))}
              </div>
            </>
          )}

          {card.type === "multi" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {card.options.map((o) => (
                <Chip key={o} label={o} active={tmpMulti.includes(o)} onClick={() => toggle(tmpMulti, setTmpMulti, o)} />
              ))}
            </div>
          )}

          {card.type === "text" && (
            <textarea
              value={tmpText}
              onChange={(e) => setTmpText(e.target.value)}
              placeholder="ここに書く"
              style={{
                width: "100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "14px",
                color: "var(--text)", fontFamily: "inherit", fontSize: "14px", lineHeight: 1.6,
                padding: "12px 14px", resize: "none", height: "100px", outline: "none",
              }}
            />
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit()}
            style={{
              width: "100%", marginTop: "22px", padding: "13px", borderRadius: "14px",
              fontSize: "14.5px", fontWeight: 700, cursor: canSubmit() ? "pointer" : "not-allowed",
              fontFamily: "inherit", border: canSubmit() ? "1px solid var(--red)" : "1px solid var(--border)",
              background: canSubmit() ? "var(--red)" : "var(--card2)",
              color: canSubmit() ? "white" : "var(--text3)",
              
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}
          >
            <Send size={13} />
            <span>{submitting ? "送信中…" : isLast ? "答え終わった" : "答えて次へ"}</span>
          </button>
        </div>
      </div>
    </>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "rgba(181,89,60,0.04)" : "var(--card)",
        border: active ? "1px solid var(--red-border)" : "1px solid var(--border)",
        color: active ? "var(--red2)" : "var(--text2)",
        borderRadius: "12px",
        padding: "9px 14px",
        fontSize: "13.5px",
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.18s",
      }}
    >
      {label}
    </button>
  );
}
