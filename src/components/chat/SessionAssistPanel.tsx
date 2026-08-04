"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { HelpCircle, X } from "lucide-react";
import { ASSIST_DECK_LENGTH, timeOverlap } from "@/lib/assistDeck";
import StudioProposalCard from "./StudioProposalCard";
import type { AssistAnswerValue, StudioProposal } from "@/types/database";

const INFO_CONTENT = {
  deck: {
    title: "セッションアシスト",
    body: "セッションに向けての質問が合計6問！\nそれぞれが回答したタイミングでチャット欄に表示されます。",
  },
  studio: {
    title: "スタジオ候補を出す",
    body: "スタジオ日時の提案時にお使いください！\n・ホスト側（セッションカード主）の機能になります。\n・スタジオの予約機能ではございません\n・実際の空き枠はスタジオのサイトをご確認ください",
  },
} as const;

type InfoKey = keyof typeof INFO_CONTENT;

interface Props {
  assistAnswers: Record<number, Record<string, AssistAnswerValue>>;
  currentUserId: string;
  partnerId: string;
  partnerNickname: string;
  role: "host" | "guest";
  studioProposals: StudioProposal[];
  onOpenDeck: (startIndex: number) => void;
  onOpenStudioDrawer: () => void;
  onChooseSlot: (proposalId: string, index: number) => void;
  onMarkBooked: (proposalId: string) => void;
  choosingId: string | null;
  bookingId: string | null;
}

export default function SessionAssistPanel({
  assistAnswers,
  currentUserId,
  partnerId,
  partnerNickname,
  role,
  studioProposals,
  onOpenDeck,
  onOpenStudioDrawer,
  onChooseSlot,
  onMarkBooked,
  choosingId,
  bookingId,
}: Props) {
  const [openInfo, setOpenInfo] = useState<InfoKey | null>(null);

  const { done, opened, firstUnanswered } = useMemo(() => {
    let doneCount = 0;
    let openedCount = 0;
    let first = -1;
    for (let i = 0; i < ASSIST_DECK_LENGTH; i++) {
      const mineHas = assistAnswers[i]?.[currentUserId] !== undefined;
      const partnerHas = assistAnswers[i]?.[partnerId] !== undefined;
      if (mineHas) doneCount++;
      else if (first === -1) first = i;
      if (partnerHas) openedCount++;
    }
    return { done: doneCount, opened: openedCount, firstUnanswered: first };
  }, [assistAnswers, currentUserId, partnerId]);

  // ── カード1: お題デッキ(常時表示、内容は進捗で変化) ──
  let deckLabel: string;
  let deckNote: string;
  if (done === 0) {
    deckLabel = "セッションアシストを始める";
    deckNote = "";
  } else if (done < ASSIST_DECK_LENGTH) {
    deckLabel = "つづきに答える";
    deckNote = `あと${ASSIST_DECK_LENGTH - done}枚。相手を待たずに進められます。\nひらいたカード ${opened} / ${ASSIST_DECK_LENGTH}`;
  } else {
    deckLabel = "答えを見直す";
    deckNote = `6枚ぜんぶ答えました。\n${partnerNickname}さんが答えたカードから順にひらきます。\nひらいたカード ${opened} / ${ASSIST_DECK_LENGTH}`;
  }

  const deckFullyOpened = done === ASSIST_DECK_LENGTH && opened === ASSIST_DECK_LENGTH;

  // カード6(時間帯)・カード5(場所)は、デッキが両者とも全開封したときだけ material として出す
  const mineTime = (assistAnswers[5]?.[currentUserId] as string[]) ?? [];
  const partnerTime = (assistAnswers[5]?.[partnerId] as string[]) ?? [];
  const overlap = timeOverlap(mineTime, partnerTime);
  const mineLocation = (assistAnswers[4]?.[currentUserId] as string) ?? "";
  const partnerLocation = (assistAnswers[4]?.[partnerId] as string) ?? "";

  const activeProposal = studioProposals.length > 0 ? studioProposals[studioProposals.length - 1] : null;
  const historicalProposals = studioProposals.slice(0, -1);

  return (
    <>
      <Panel>
        <PanelHeader title="6枚のお題で自己紹介" done={done} onInfo={() => setOpenInfo("deck")} />
        {deckNote && (
          <div style={{ fontSize: "12.5px", color: "var(--text2)", lineHeight: 1.75, marginBottom: "14px", whiteSpace: "pre-line" }}>
            {deckNote}
          </div>
        )}
        <PrimaryButton onClick={() => onOpenDeck(firstUnanswered === -1 ? 0 : firstUnanswered)}>{deckLabel}</PrimaryButton>

        {deckFullyOpened && (
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text3)", fontWeight: 600, marginBottom: "12px" }}>
              会う場所と時間の材料
            </div>
            <SummaryLine label="時間">
              {overlap.length > 0 ? (
                <>2人とも <b style={{ color: "var(--red2)" }}>{overlap.join(" / ")}</b> を選びました</>
              ) : (
                "重なった時間帯はありませんでした"
              )}
            </SummaryLine>
            <SummaryLine label="場所">
              あなた「{mineLocation}」
              <br />
              {partnerNickname}さん「{partnerLocation}」
            </SummaryLine>
          </div>
        )}
      </Panel>

      {/* ── カード2: スタジオ枠提案(常時表示。まだ提案が無い間はゲストはボタンだけ操作不可) ── */}
      {historicalProposals.map((p) => (
        <StudioProposalCard
          key={p.id}
          proposal={p}
          currentUserId={currentUserId}
          partnerNickname={partnerNickname}
          role={role}
          interactive={false}
          choosing={false}
          booking={false}
          onChoose={() => {}}
          onMarkBooked={() => {}}
          onRedo={() => {}}
        />
      ))}

      {activeProposal ? (
        <StudioProposalCard
          proposal={activeProposal}
          currentUserId={currentUserId}
          partnerNickname={partnerNickname}
          role={role}
          interactive
          choosing={choosingId === activeProposal.id}
          booking={bookingId === activeProposal.id}
          onChoose={(index) => onChooseSlot(activeProposal.id, index)}
          onMarkBooked={() => onMarkBooked(activeProposal.id)}
          onRedo={onOpenStudioDrawer}
        />
      ) : (
        <Panel>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "11px" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text3)", fontWeight: 600 }}>
              スタジオを決めて、空き枠を共有！
            </div>
            <InfoButton onClick={() => setOpenInfo("studio")} />
          </div>
          <PrimaryButton onClick={onOpenStudioDrawer} disabled={role !== "host"}>
            スタジオ候補をだす
          </PrimaryButton>
        </Panel>
      )}

      {openInfo && (
        <InfoModal
          title={INFO_CONTENT[openInfo].title}
          body={INFO_CONTENT[openInfo].body}
          onClose={() => setOpenInfo(null)}
        />
      )}
    </>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "var(--card)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--border2)",
        borderRadius: "18px",
        padding: "16px",
        marginBottom: "10px",
      }}
    >
      {children}
    </div>
  );
}

function PanelHeader({ title, done, onInfo }: { title: string; done: number; onInfo: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "12px", gap: "8px" }}>
      <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text3)", fontWeight: 600 }}>
        {title}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
          <span
            style={{
              fontSize: "22px", fontWeight: 700,
              background: "linear-gradient(135deg, var(--red), var(--red2))",
              WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
            }}
          >
            {done}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text3)" }}>/ {ASSIST_DECK_LENGTH}</span>
        </div>
        <InfoButton onClick={onInfo} />
      </div>
    </div>
  );
}

function InfoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="この機能について"
      style={{
        width: "26px", height: "26px", flexShrink: 0,
        background: "transparent", border: "none",
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
      }}
    >
      <HelpCircle size={19} color="var(--text3)" />
    </button>
  );
}

function InfoModal({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 90,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
        }}
      />
      <div
        style={{
          position: "fixed", left: "20px", right: "20px", top: "50%", transform: "translateY(-50%)", zIndex: 95,
          background: "rgba(24,24,30,0.97)",
          backdropFilter: "blur(28px) saturate(1.4)", WebkitBackdropFilter: "blur(28px) saturate(1.4)",
          border: "1px solid var(--border2)", borderRadius: "20px",
          padding: "20px 20px 18px", maxWidth: "360px", margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            style={{
              width: "26px", height: "26px", flexShrink: 0, borderRadius: "50%",
              background: "var(--card2)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
            }}
          >
            <X size={13} color="var(--text2)" />
          </button>
        </div>
        <div style={{ fontSize: "13px", color: "var(--text2)", lineHeight: 1.8, whiteSpace: "pre-line" }}>
          {body}
        </div>
      </div>
    </>
  );
}

function SummaryLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "10px", fontSize: "12.5px", lineHeight: 1.65, color: "var(--text2)", marginBottom: "6px" }}>
      <div style={{ color: "var(--text3)", flex: "0 0 34px" }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: "100%",
        border: disabled ? "1px solid var(--border)" : "1px solid var(--red)",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        background: disabled ? "var(--card2)" : "var(--red)",
        color: disabled ? "var(--text3)" : "white",
        fontSize: "14.5px", fontWeight: 700,
        borderRadius: "14px", padding: "13px",
        
      }}
    >
      {children}
    </button>
  );
}
