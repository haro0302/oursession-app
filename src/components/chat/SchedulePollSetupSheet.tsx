"use client";

import { useState } from "react";
import { Send, X, Plus, CalendarClock } from "lucide-react";
import { insertSchedulePoll } from "@/lib/db";
import { showToast } from "@/components/ui/Toast";

const MAX_CANDIDATES = 6;

interface Props {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  currentUserId: string;
}

export default function SchedulePollSetupSheet({ open, onClose, sessionId, currentUserId }: Props) {
  const [rows, setRows] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);

  const filledCount = rows.filter((r) => r.trim().length > 0).length;
  const canSubmit = filledCount > 0 && !submitting;

  function updateRow(index: number, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? value : r)));
  }

  function addRow() {
    setRows((prev) => (prev.length >= MAX_CANDIDATES ? prev : [...prev, ""]));
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function resetAndClose() {
    setRows([""]);
    setSubmitting(false);
    onClose();
  }

  function handleClose() {
    const isDirty = rows.some((r) => r.trim().length > 0);
    if (isDirty) {
      if (!confirm("入力内容を破棄しますか?")) return;
    }
    resetAndClose();
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const candidates = rows
        .filter((r) => r.trim().length > 0)
        .map((iso) => ({ id: crypto.randomUUID(), iso }));
      await insertSchedulePoll({
        session_id: sessionId,
        created_by: currentUserId,
        candidates,
      });
      showToast("候補を送りました🎵\nみんなの回答を待ちましょう。");
      resetAndClose();
    } catch {
      showToast("うまく送れませんでした\n電波の届く場所で、もう一度お試しください。");
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          zIndex: 70,
          transition: "opacity 0.25s ease",
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
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
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
            onClick={handleClose}
            style={{
              background: "transparent", border: "none",
              fontSize: "14px", color: "var(--text2)", fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit", padding: "6px 2px", minWidth: "60px",
            }}
          >
            キャンセル
          </button>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>
            日程を提案
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              background: canSubmit ? "var(--red)" : "var(--card2)",
              color: canSubmit ? "white" : "var(--text3)",
              border: canSubmit ? "1px solid var(--red)" : "1px solid var(--border)",
              borderRadius: "16px", padding: "7px 16px",
              fontSize: "13px", fontWeight: 700,
              cursor: canSubmit ? "pointer" : "not-allowed",
              fontFamily: "inherit", transition: "all 0.2s",
              display: "inline-flex", alignItems: "center", gap: "5px",
              boxShadow: canSubmit ? "0 4px 14px rgba(232,74,95,0.4)" : "none",
            }}
          >
            <Send size={13} />
            <span>{submitting ? "送信中…" : "送信"}</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 48px" }}>
          <div style={{
            fontSize: "10px", fontWeight: 700, color: "var(--text3)",
            letterSpacing: "0.8px", textTransform: "uppercase",
            margin: "0 4px 10px", display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span>候補日時</span>
            <span style={{ color: "var(--red2)", fontSize: "9px", letterSpacing: "0.5px" }}>
              最大{MAX_CANDIDATES}件
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {rows.map((value, index) => (
              <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  flex: 1, display: "flex", alignItems: "center", gap: "8px",
                  background: "var(--card)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid var(--border)", borderRadius: "14px",
                  padding: "10px 12px",
                }}>
                  <CalendarClock size={15} color="var(--text3)" />
                  <input
                    type="datetime-local"
                    value={value}
                    onChange={(e) => updateRow(index, e.target.value)}
                    style={{
                      flex: 1, background: "transparent", border: "none", outline: "none",
                      color: "var(--text)", fontFamily: "inherit", fontSize: "13.5px",
                      colorScheme: "dark",
                    }}
                  />
                </div>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    aria-label="この候補を削除"
                    style={{
                      width: "34px", height: "34px", borderRadius: "50%",
                      background: "var(--card2)", border: "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    <X size={14} color="var(--text2)" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            disabled={rows.length >= MAX_CANDIDATES}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              width: "100%", marginTop: "12px", padding: "11px",
              borderRadius: "14px", border: "1px dashed var(--border)",
              background: "transparent",
              color: rows.length >= MAX_CANDIDATES ? "var(--text3)" : "var(--text2)",
              fontSize: "13px", fontWeight: 600,
              cursor: rows.length >= MAX_CANDIDATES ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: rows.length >= MAX_CANDIDATES ? 0.5 : 1,
            }}
          >
            <Plus size={14} />
            候補を追加
          </button>
        </div>
      </div>
    </>
  );
}
