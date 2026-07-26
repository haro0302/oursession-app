"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { ASSIST_DECK_LENGTH, timeOverlap } from "@/lib/assistDeck";
import StudioProposalCard from "./StudioProposalCard";
import type { AssistAnswerValue, StudioProposal } from "@/types/database";

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
        <PanelHeader title="6枚のお題で自己紹介" done={done} />
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

      {/* ── カード2: スタジオ枠提案(常時表示。提案が無い間、ゲストには何も出さない) ── */}
      {(role === "host" || studioProposals.length > 0) && (
        <>
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
            role === "host" && (
              <Panel>
                <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text3)", fontWeight: 600, marginBottom: "11px" }}>
                  スタジオを決めて、空き枠を共有！
                </div>
                <PrimaryButton onClick={onOpenStudioDrawer}>スタジオ候補をだす</PrimaryButton>
              </Panel>
            )
          )}
        </>
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

function PanelHeader({ title, done }: { title: string; done: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "12px" }}>
      <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text3)", fontWeight: 600 }}>
        {title}
      </div>
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
    </div>
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

function PrimaryButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%", border: "1px solid var(--red)", cursor: "pointer", fontFamily: "inherit",
        background: "var(--red)", color: "white", fontSize: "14.5px", fontWeight: 700,
        borderRadius: "14px", padding: "13px", boxShadow: "0 4px 14px rgba(232,74,95,0.35)",
      }}
    >
      {children}
    </button>
  );
}
