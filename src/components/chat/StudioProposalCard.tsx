"use client";

import { Headphones, Check } from "lucide-react";
import { timeAgo } from "@/lib/time";
import type { StudioProposal, StudioSlot } from "@/types/database";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function fmtDate(dateStr: string): { label: string; wd: string } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return { label: `${m}/${d}`, wd: WEEKDAYS[dt.getDay()] };
}
function fmtTime(startHour: number, durationHours: number): string {
  return `${startHour}:00〜${startHour + durationHours}:00`;
}

interface Props {
  proposal: StudioProposal;
  currentUserId: string;
  partnerNickname: string;
  role: "host" | "guest";
  interactive: boolean; // 最新かつ未確定の提案か(タップ・確定操作を受け付けるか)
  choosing: boolean;
  booking: boolean;
  onChoose: (index: number) => void;
  onMarkBooked: () => void;
  onRedo: () => void;
}

export default function StudioProposalCard({
  proposal,
  currentUserId,
  partnerNickname,
  role,
  interactive,
  choosing,
  booking,
  onChoose,
  onMarkBooked,
  onRedo,
}: Props) {
  const slots = proposal.slots as unknown as StudioSlot[];
  const mineProp = proposal.created_by === currentUserId;
  const booked = !!proposal.booked_at;
  const chosen = proposal.chosen_index;
  const canPick = interactive && !mineProp && chosen === null && !booked;

  let footer: string;
  if (booked && chosen !== null) {
    const s = slots[chosen];
    const { label, wd } = fmtDate(s.date);
    footer = `${label}(${wd}) ${fmtTime(s.startHour, s.durationHours)}・${proposal.studio_name} を押さえました。当日よろしくお願いします。`;
  } else if (chosen === null) {
    footer = mineProp
      ? `${partnerNickname}さんの返事まち。急かさなくて大丈夫です。`
      : "行ける枠をひとつ選んでください。";
  } else {
    const s = slots[chosen];
    const { label, wd } = fmtDate(s.date);
    footer = mineProp
      ? `${partnerNickname}さんが ${label}(${wd}) ${fmtTime(s.startHour, s.durationHours)} を選びました。スタジオを押さえたら教えてあげてください。`
      : `${label}(${wd}) ${fmtTime(s.startHour, s.durationHours)} を選びました。${partnerNickname}さんが押さえるのを待っています。`;
  }

  return (
    <div
      style={{
        background: "var(--card)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: booked ? "1px solid var(--red-border)" : "1px solid var(--border)",
        borderRadius: "18px",
        padding: "14px",
        marginBottom: "10px",
        opacity: interactive ? 1 : 0.55,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", fontWeight: 700, color: booked ? "var(--red2)" : "var(--text)" }}>
          {booked ? <Check size={14} /> : <Headphones size={14} color="var(--red2)" />}
          {booked ? "予約できました" : "スタジオの空き枠"}
        </div>
        <div style={{ fontSize: "10.5px", color: "var(--text3)", flexShrink: 0, paddingTop: "1px" }}>
          {mineProp ? "あなたが出しました" : `${partnerNickname}さんが出しました`} ・ {timeAgo(proposal.created_at)}
        </div>
      </div>

      <div style={{
        margin: "0 0 12px", padding: "11px 12px", borderRadius: "12px",
        background: "var(--card2)", border: "1px solid var(--border)",
      }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{proposal.studio_name}</div>
        <div style={{ fontSize: "11.5px", color: "var(--text3)", marginTop: "4px", lineHeight: 1.6 }}>
          {proposal.area}{proposal.fee_per_hour ? ` ・ ${proposal.fee_per_hour}円 / 1時間` : ""}
          {proposal.url && (
            <>
              <br />
              <a href={proposal.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--red2)", textDecoration: "none", borderBottom: "1px solid var(--red-border)" }}>
                店舗ページを見る ↗
              </a>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {slots.map((s, i) => {
          const on = chosen === i;
          const dim = chosen !== null && !on;
          const { label, wd } = fmtDate(s.date);
          return (
            <div
              key={i}
              onClick={canPick && !choosing ? () => onChoose(i) : undefined}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "11px 12px", borderRadius: "13px",
                border: on ? "1px solid var(--red-border)" : "1px solid var(--border)",
                background: on ? "var(--red-bg)" : "var(--card2)",
                opacity: dim ? 0.4 : 1,
                cursor: canPick ? "pointer" : "default",
              }}
            >
              <div style={{
                width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0,
                border: `1.5px solid ${on ? "var(--red2)" : "var(--border2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {on && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--red2)" }} />}
              </div>
              <div style={{ fontSize: "13.5px", fontWeight: 600, color: on ? "var(--red2)" : "var(--text)" }}>
                {label}<span style={{ fontWeight: 400, color: "var(--text3)", marginLeft: "4px" }}>({wd})</span>
              </div>
              <div style={{ marginLeft: "auto", fontSize: "13px", color: on ? "var(--red2)" : "var(--text2)" }}>
                {fmtTime(s.startHour, s.durationHours)}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: "11.5px", color: "var(--text3)", lineHeight: 1.7, marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
        {footer}
      </div>

      {interactive && !mineProp && chosen === null && !booked && (
        <div style={{ fontSize: "11px", color: "var(--text3)", lineHeight: 1.6, marginTop: "6px" }}>
          候補日が合わない場合はチャットで相談してみましょう
        </div>
      )}

      {interactive && !booked && mineProp && role === "host" && (
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {chosen !== null && (
            <button
              type="button"
              onClick={onMarkBooked}
              disabled={booking}
              style={{
                width: "100%", padding: "11px", borderRadius: "12px", fontSize: "13.5px", fontWeight: 700,
                cursor: booking ? "default" : "pointer", fontFamily: "inherit",
                background: "var(--red)", border: "1px solid var(--red)", color: "white",
                
              }}
            >
              {booking ? "送信中…" : "スタジオを押さえた"}
            </button>
          )}
          <button
            type="button"
            onClick={onRedo}
            style={{
              width: "100%", padding: "10px 0 2px", background: "transparent", border: "none",
              color: "var(--text3)", fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
              textDecoration: "underline", textUnderlineOffset: "3px",
            }}
          >
            別の候補を出す
          </button>
        </div>
      )}
    </div>
  );
}
