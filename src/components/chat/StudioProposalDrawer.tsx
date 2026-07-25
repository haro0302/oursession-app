"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Send, X, ChevronLeft } from "lucide-react";
import { STUDIO_AREAS, STUDIO_PREFECTURES } from "@/lib/studios";
import type { StudioSlot } from "@/types/database";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const START_HOURS = Array.from({ length: 13 }, (_, i) => 10 + i); // 10:00〜22:00
const MAX_SLOTS = 3;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function fmtTime(startHour: number, durationHours: number): string {
  return `${startHour}:00〜${startHour + durationHours}:00`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    studio_name: string;
    area: string;
    fee_per_hour: number | null;
    url: string | null;
    slots: StudioSlot[];
  }) => Promise<void>;
}

export default function StudioProposalDrawer({ open, onClose, onSubmit }: Props) {
  const today = new Date();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pref, setPref] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [studio, setStudio] = useState<string | null>(null); // 店舗名 or "__custom"
  const [customName, setCustomName] = useState("");
  const [calY, setCalY] = useState(today.getFullYear());
  const [calM, setCalM] = useState(today.getMonth() + 1);
  const [day, setDay] = useState<number | null>(null);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [duration, setDuration] = useState<1 | 2 | 3>(2);
  const [slots, setSlots] = useState<StudioSlot[]>([]);
  const [fee, setFee] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  function reset() {
    setStep(1);
    setPref(null);
    setArea(null);
    setStudio(null);
    setCustomName("");
    setCalY(today.getFullYear());
    setCalM(today.getMonth() + 1);
    setDay(null);
    setStartHour(null);
    setDuration(2);
    setSlots([]);
    setFee("");
    setUrl("");
    setSubmitting(false);
  }

  function handleClose() {
    const isDirty = pref !== null || slots.length > 0;
    if (isDirty && !confirm("入力内容を破棄しますか?")) return;
    reset();
    onClose();
  }

  function studioName(): string {
    if (studio === "__custom") return customName.trim();
    return studio ?? "";
  }

  function goPrevMonth() {
    if (calM === 1) {
      setCalY((y) => y - 1);
      setCalM(12);
    } else {
      setCalM((m) => m - 1);
    }
    setDay(null);
  }
  function goNextMonth() {
    if (calM === 12) {
      setCalY((y) => y + 1);
      setCalM(1);
    } else {
      setCalM((m) => m + 1);
    }
    setDay(null);
  }

  function addSlot() {
    if (day === null || startHour === null || slots.length >= MAX_SLOTS) return;
    const date = `${calY}-${pad(calM)}-${pad(day)}`;
    const next: StudioSlot = { date, startHour, durationHours: duration };
    if (slots.some((s) => s.date === next.date && s.startHour === next.startHour && s.durationHours === next.durationHours)) return;
    const updated = [...slots, next].sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour);
    setSlots(updated);
    setDay(null);
    setStartHour(null);
  }

  async function handleSubmit() {
    if (submitting || slots.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        studio_name: studioName(),
        area: `${pref} ${area}`,
        fee_per_hour: fee.trim() ? Number(fee.trim()) : null,
        url: url.trim() ? url.trim() : null,
        slots,
      });
      reset();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  const canGoStep2 = !!studio && (studio !== "__custom" || customName.trim().length > 0);
  const titles: Record<1 | 2 | 3, string> = { 1: "スタジオを決める", 2: "空いている枠を出す", 3: "料金とリンク" };

  return (
    <>
      <div
        onClick={handleClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", zIndex: 70 }}
      />
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 85,
          background: "rgba(20,20,26,0.97)",
          backdropFilter: "blur(32px) saturate(1.4)",
          WebkitBackdropFilter: "blur(32px) saturate(1.4)",
          borderTop: "1px solid var(--border2)",
          borderRadius: "24px 24px 0 0",
          height: "88%",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: "8px" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "var(--text3)", opacity: 0.4 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 18px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          {step > 1 && (
            <button type="button" onClick={() => setStep((s) => (s === 3 ? 2 : 1))} aria-label="戻る" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "2px" }}>
              <ChevronLeft size={20} color="var(--text3)" />
            </button>
          )}
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>{titles[step]}</div>
          <div style={{ marginLeft: "auto", fontSize: "11px", color: "var(--text3)", letterSpacing: "0.06em" }}>{step} / 3</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {step === 1 && (
            <>
              <Label>都道府県</Label>
              <ChipRow>
                {STUDIO_PREFECTURES.map((p) => (
                  <Chip key={p} label={p} active={pref === p} onClick={() => { setPref(p); setArea(null); setStudio(null); }} />
                ))}
              </ChipRow>

              {pref && (
                <>
                  <Label>エリア</Label>
                  <ChipRow>
                    {Object.keys(STUDIO_AREAS[pref]).map((a) => (
                      <Chip key={a} label={a} small active={area === a} onClick={() => { setArea(a); setStudio(null); }} />
                    ))}
                  </ChipRow>
                </>
              )}

              {pref && area && (
                <>
                  <Label>スタジオ</Label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "18px" }}>
                    {STUDIO_AREAS[pref][area].map((s) => (
                      <StudioRow key={s.name} name={s.name} sub={s.note} active={studio === s.name} onClick={() => setStudio(s.name)} />
                    ))}
                    <StudioRow name="その他(自分で入力)" sub="リストにないスタジオ" active={studio === "__custom"} onClick={() => setStudio("__custom")} />
                  </div>
                  {studio === "__custom" && (
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="スタジオ名"
                      style={inputStyle}
                    />
                  )}
                </>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <CalendarGrid
                y={calY}
                m={calM}
                day={day}
                slots={slots}
                onPrev={goPrevMonth}
                onNext={goNextMonth}
                onPick={(d) => { setDay(d); setStartHour(null); }}
              />

              {day !== null && (
                <div style={{ marginTop: "16px", paddingTop: "15px", borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "14px" }}>
                    <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>{calM}/{day}</span>
                    <span style={{ fontSize: "12px", color: "var(--text3)" }}>({WEEKDAYS[new Date(calY, calM - 1, day).getDay()]})</span>
                  </div>
                  <Label>開始時刻</Label>
                  <ChipRow>
                    {START_HOURS.map((h) => (
                      <Chip key={h} label={`${h}:00`} small active={startHour === h} onClick={() => setStartHour(h)} />
                    ))}
                  </ChipRow>
                  <Label>利用時間</Label>
                  <ChipRow>
                    {([1, 2, 3] as const).map((t) => (
                      <Chip key={t} label={`${t}時間`} small active={duration === t} onClick={() => setDuration(t)} />
                    ))}
                  </ChipRow>
                  <button
                    type="button"
                    onClick={addSlot}
                    disabled={startHour === null || slots.length >= MAX_SLOTS}
                    style={{
                      width: "100%", padding: "12px", borderRadius: "13px", marginTop: "4px", marginBottom: "6px",
                      fontSize: "13.5px", fontWeight: 700, fontFamily: "inherit",
                      cursor: startHour !== null && slots.length < MAX_SLOTS ? "pointer" : "not-allowed",
                      background: startHour !== null && slots.length < MAX_SLOTS ? "var(--red)" : "var(--card2)",
                      border: startHour !== null && slots.length < MAX_SLOTS ? "1px solid var(--red)" : "1px solid var(--border)",
                      color: startHour !== null && slots.length < MAX_SLOTS ? "white" : "var(--text3)",
                    }}
                  >
                    {startHour !== null ? `${calM}/${day} ${fmtTime(startHour, duration)} を追加` : "開始時刻をえらぶ"}
                  </button>
                </div>
              )}

              {slots.length > 0 && (
                <div style={{ marginTop: "16px", paddingTop: "15px", borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "5px", marginBottom: "11px" }}>
                    <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--red2)" }}>{slots.length}</span>
                    <span style={{ fontSize: "11.5px", color: "var(--text3)" }}>/ {MAX_SLOTS} 出す枠</span>
                  </div>
                  {slots.map((s, i) => {
                    const [y, m, d] = s.date.split("-").map(Number);
                    const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()];
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: "10px", padding: "11px 12px",
                        borderRadius: "12px", background: "var(--red-bg)", border: "1px solid var(--red-border)", marginBottom: "7px",
                      }}>
                        <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)" }}>{m}/{d} ({wd})</div>
                        <div style={{ marginLeft: "auto", fontSize: "13px", color: "var(--red2)" }}>{fmtTime(s.startHour, s.durationHours)}</div>
                        <button
                          type="button"
                          onClick={() => setSlots((prev) => prev.filter((_, idx) => idx !== i))}
                          aria-label="この枠を削除"
                          style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text3)", padding: "2px" }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <Label>1時間あたりの料金(任意)</Label>
              <input type="number" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="1500" style={inputStyle} />
              <Label>店舗ページのリンク(任意)</Label>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" style={inputStyle} />
              <div style={{ fontSize: "11px", color: "var(--text3)", lineHeight: 1.65, margin: "-10px 0 16px" }}>
                どちらも空のままで送れます。相手が見るのは、スタジオ名と枠だけです。
              </div>
              <Label>送る内容</Label>
              <div style={{ padding: "11px 12px", borderRadius: "12px", background: "var(--card2)", border: "1px solid var(--border)", marginBottom: "10px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{studioName()}</div>
                <div style={{ fontSize: "11.5px", color: "var(--text3)", marginTop: "3px" }}>{pref} {area}</div>
              </div>
              {slots.map((s, i) => {
                const [y, m, d] = s.date.split("-").map(Number);
                const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "7px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{m}/{d} ({wd})</div>
                    <div style={{ marginLeft: "auto", fontSize: "12.5px", color: "var(--text2)" }}>{fmtTime(s.startHour, s.durationHours)}</div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div style={{ flexShrink: 0, padding: "13px 20px calc(13px + env(safe-area-inset-bottom))", borderTop: "1px solid var(--border)" }}>
          {step === 1 && (
            <button type="button" onClick={() => setStep(2)} disabled={!canGoStep2} style={primaryBtnStyle(canGoStep2)}>
              枠をえらぶ
            </button>
          )}
          {step === 2 && (
            <button type="button" onClick={() => setStep(3)} disabled={slots.length === 0} style={primaryBtnStyle(slots.length > 0)}>
              次へ
            </button>
          )}
          {step === 3 && (
            <button type="button" onClick={handleSubmit} disabled={submitting} style={primaryBtnStyle(!submitting)}>
              <Send size={13} />
              <span>{submitting ? "送信中…" : "この内容で送る"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            style={{ width: "100%", background: "transparent", border: "none", color: "var(--text3)", fontFamily: "inherit", fontSize: "12.5px", padding: "12px 0 0", cursor: "pointer" }}
          >
            あとにする
          </button>
        </div>
      </div>
    </>
  );
}

const inputStyle: CSSProperties = {
  width: "100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px",
  color: "var(--text)", fontFamily: "inherit", fontSize: "14px", padding: "11px 12px", outline: "none", marginBottom: "16px",
};

function primaryBtnStyle(enabled: boolean): CSSProperties {
  return {
    width: "100%", border: enabled ? "1px solid var(--red)" : "1px solid var(--border)", cursor: enabled ? "pointer" : "not-allowed",
    fontFamily: "inherit", background: enabled ? "var(--red)" : "var(--card2)", color: enabled ? "white" : "var(--text3)",
    fontSize: "14.5px", fontWeight: 700, borderRadius: "14px", padding: "13px",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    boxShadow: enabled ? "0 4px 14px rgba(232,74,95,0.35)" : "none",
  };
}

function Label({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: "11px", color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, margin: "0 0 9px" }}>
      {children}
    </div>
  );
}
function ChipRow({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px" }}>{children}</div>;
}
function Chip({ label, active, small, onClick }: { label: string; active: boolean; small?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "rgba(232,74,95,0.04)" : "var(--card)",
        border: active ? "1px solid var(--red-border)" : "1px solid var(--border)",
        color: active ? "var(--red2)" : "var(--text2)",
        borderRadius: "12px",
        padding: small ? "8px 12px" : "9px 14px",
        fontSize: small ? "12.5px" : "13.5px",
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}
function StudioRow({ name, sub, active, onClick }: { name: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "11px", padding: "13px",
        borderRadius: "13px", cursor: "pointer",
        border: active ? "1px solid var(--red-border)" : "1px solid var(--border)",
        background: active ? "var(--red-bg)" : "var(--card2)",
      }}
    >
      <div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{name}</div>
        <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "3px" }}>{sub}</div>
      </div>
      {active && <div style={{ marginLeft: "auto", color: "var(--red2)", fontSize: "15px" }}>✓</div>}
    </div>
  );
}

function CalendarGrid({
  y, m, day, slots, onPrev, onNext, onPick,
}: {
  y: number; m: number; day: number | null; slots: StudioSlot[];
  onPrev: () => void; onNext: () => void; onPick: (d: number) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const lead = first.getDay();
  const isCurrentOrPastMonth = y < today.getFullYear() || (y === today.getFullYear() && m <= today.getMonth() + 1);

  const cells: ReactNode[] = [];
  for (let k = 0; k < lead; k++) cells.push(<div key={`void-${k}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(y, m - 1, d);
    const isPast = dt < today;
    const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
    const hasSlot = slots.some((s) => s.date === `${y}-${pad(m)}-${pad(d)}`);
    const isOn = day === d;
    cells.push(
      <div
        key={d}
        onClick={isPast ? undefined : () => onPick(d)}
        style={{
          aspectRatio: "1/1", borderRadius: "10px", position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13.5px", cursor: isPast ? "default" : "pointer",
          background: isOn ? "var(--red-bg)" : "var(--card2)",
          border: isOn ? "1px solid var(--red-border)" : "1px solid transparent",
          color: isPast ? "var(--text3)" : isWeekend ? "var(--text)" : "var(--text2)",
          opacity: isPast ? 0.3 : 1,
          fontWeight: isOn ? 700 : 400,
        }}
      >
        {d}
        {hasSlot && (
          <div style={{ position: "absolute", bottom: "5px", width: "4px", height: "4px", borderRadius: "50%", background: "var(--red2)" }} />
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "11px" }}>
        <button type="button" onClick={onPrev} disabled={isCurrentOrPastMonth} style={calNavBtnStyle(!isCurrentOrPastMonth)}>‹</button>
        <div style={{ fontSize: "15px", fontWeight: 600 }}>{y}年 {m}月</div>
        <button type="button" onClick={onNext} style={calNavBtnStyle(true)}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "4px" }}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} style={{ textAlign: "center", fontSize: "10.5px", padding: "4px 0 6px", color: i === 0 || i === 6 ? "var(--red2)" : "var(--text3)" }}>
            {w}
          </div>
        ))}
        {cells}
      </div>
    </div>
  );
}
function calNavBtnStyle(enabled: boolean): CSSProperties {
  return {
    background: "none", border: "1px solid var(--border)", color: "var(--text2)",
    width: "30px", height: "30px", borderRadius: "9px", cursor: enabled ? "pointer" : "default",
    opacity: enabled ? 1 : 0.25, fontSize: "14px", fontFamily: "inherit",
  };
}
