import PracticeBadge from "@/components/ui/PracticeBadge";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Props {
  users: Profile[];
}

export default function SimilarUsersSlider({ users }: Props) {
  if (users.length === 0) {
    return (
      <div style={{ fontSize: "13px", color: "var(--text3)", padding: "16px 0" }}>
        プロフィールのジャンルや楽器を充実させると、似ている人が見つかりやすくなります。
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "8px", WebkitOverflowScrolling: "touch" as unknown as undefined }}>
      {users.map((user) => (
        <div
          key={user.id}
          style={{ flexShrink: 0, width: "136px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "14px 12px", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          {/* アバター */}
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--card2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", marginBottom: "8px" }}>
            🎵
          </div>

          {/* ニックネーム */}
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.nickname}
          </div>

          {/* 練習中バッジ */}
          {user.is_practice && (
            <div style={{ marginBottom: "6px" }}>
              <PracticeBadge mini />
            </div>
          )}

          {/* エリア */}
          {user.area && (
            <div style={{ fontSize: "10px", color: "var(--text3)", marginBottom: "6px" }}>
              📍 {user.area}
            </div>
          )}

          {/* 楽器チップ（最大3つ） */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
            {(user.instruments ?? []).slice(0, 3).map((inst) => (
              <span
                key={inst}
                style={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: "6px", padding: "2px 6px", fontSize: "10px", color: "var(--text3)", fontWeight: 500 }}
              >
                {inst}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
