"use client";

import { useProfile } from "@/contexts/ProfileContext";
import { useBlockStore } from "@/store/blockStore";
import Avatar from "@/components/ui/Avatar";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Props {
  users: Profile[];
}


export default function SimilarUsersSlider({ users }: Props) {
  const { openProfile } = useProfile();
  const { blockedIds } = useBlockStore();
  const visibleUsers = users.filter((u) => !blockedIds.has(u.id));

  if (visibleUsers.length === 0) {
    return (
      <div style={{ fontSize: "13px", color: "var(--text3)", padding: "16px 0" }}>
        プロフィールのジャンルや楽器を充実させると、似ている人が見つかりやすくなります。
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        overflowX: "auto",
        overflowY: "hidden",
        marginRight: "-18px",
        paddingRight: "18px",
        paddingBottom: "14px",
        paddingTop: "6px",
        scrollSnapType: "x proximity",
        WebkitOverflowScrolling: "touch" as unknown as undefined,
        msOverflowStyle: "none" as unknown as undefined,
        scrollbarWidth: "none" as unknown as undefined,
      }}
    >
      {visibleUsers.map((user) => (
        <button
          key={user.id}
          type="button"
          onClick={() => openProfile(user.id)}
          style={{
            flexShrink: 0,
            width: "96px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            padding: "14px 8px 12px",
            background: "var(--card)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            cursor: "pointer",
            scrollSnapAlign: "start",
            transition: "transform 0.18s, border-color 0.18s",
          }}
        >
          <Avatar
            src={user.avatar_url}
            alt={user.nickname ?? ""}
            size="lg"
            isPractice={user.is_practice ?? false}
          />

          {/* ニックネーム */}
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text)",
              textAlign: "center",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "80px",
            }}
          >
            {user.nickname}
          </div>
        </button>
      ))}

      <style>{`
        button:active { transform: scale(0.97); }
      `}</style>
    </div>
  );
}
