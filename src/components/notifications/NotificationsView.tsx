import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import IncomingAnswerList from "@/components/answer/IncomingAnswerList";
import type { Database } from "@/types/database";

type AnswerRow = Database["public"]["Tables"]["answers"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

export type AnswerWithContext = AnswerRow & {
  sender: ProfileRow;
  session: Pick<SessionRow, "id" | "title">;
};

export type ActiveChat = {
  answerId: string; // ルームID
  sessionTitle: string;
  partnerNickname: string;
  partnerAvatarUrl: string | null;
  partnerIsPractice: boolean;
};

interface Props {
  pendingAnswers: AnswerWithContext[];
  activeChats: ActiveChat[];
  currentUserId: string;
}

export default function NotificationsView({ pendingAnswers, activeChats, currentUserId }: Props) {
  const hasContent = pendingAnswers.length > 0 || activeChats.length > 0;

  return (
    <main style={{ padding: "0 20px 100px" }}>
      <div style={{ padding: "10px 4px 14px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>
          通知
        </h1>
      </div>

      {!hasContent && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", gap: "12px", color: "var(--text3)", fontSize: "13px", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
            🔔
          </div>
          <div>
            <div style={{ color: "var(--text2)", fontWeight: 600, marginBottom: "4px" }}>通知はまだありません</div>
            <div>アンサーが届いたらここに表示されます。</div>
          </div>
        </div>
      )}

      {pendingAnswers.length > 0 && (
        <section style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
            届いたアンサー
          </div>
          <IncomingAnswerList answers={pendingAnswers} currentUserId={currentUserId} />
        </section>
      )}

      {activeChats.length > 0 && (
        <section>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
            チャット中
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {activeChats.map((chat) => (
              <Link
                key={chat.answerId}
                href={`/chat/${chat.answerId}`}
                style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "14px 16px", textDecoration: "none", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
              >
                <Avatar
                  src={chat.partnerAvatarUrl}
                  alt={chat.partnerNickname}
                  size="md"
                  isPractice={chat.partnerIsPractice}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {chat.partnerNickname}さんと
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    ↳ {chat.sessionTitle}
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--red2)", fontWeight: 600, flexShrink: 0 }}>
                  チャットへ →
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
