"use client";

import { useNotifications } from "@/contexts/NotificationsContext";
import { BellIcon, NoteIcon, PinIcon, GuitarIcon, SearchIcon } from "@/components/icons/CustomIcons";
import Wordmark from "@/components/layout/Wordmark";

type FilterKey = "instrument" | "genre" | "area";

const FILTER_CHIPS: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
  { key: "area", label: "エリア", icon: <PinIcon size={19} /> },
  { key: "genre", label: "ジャンル", icon: <NoteIcon size={14} /> },
  { key: "instrument", label: "募集パート", icon: <GuitarIcon size={15} /> },
];

interface Props {
  currentUserId?: string | null;
  filterState?: Record<FilterKey, string[]>;
  onOpenFilter?: (key: FilterKey) => void;
  onOpenSearch?: () => void;
}

export default function TimelineHeader({ currentUserId: _currentUserId, filterState, onOpenFilter, onOpenSearch }: Props) {
  const { openNotifications } = useNotifications();

  const filterPillStyle = (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    height: "32px",
    padding: "0 8px",
    flexShrink: 0,
    border: `1px solid ${active ? "var(--red)" : "var(--accent-muted)"}`,
    borderRadius: "16px",
    background: active ? "var(--red-bg)" : "transparent",
    color: active ? "var(--red)" : "var(--accent-muted)",
    fontSize: "11px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "color 0.15s, border-color 0.15s, background 0.15s",
  });

  return (
    <div style={{ padding: "30px 16px 0" }}>
      {/* ヘッダー行 */}
      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ marginLeft: "2.5px" }}>
          <Wordmark />
        </div>
        <button
          type="button"
          onClick={openNotifications}
          aria-label="通知"
          style={{
            position: "absolute",
            right: "2px",
            top: "4px",
            background: "transparent",
            border: "none",
            color: "var(--red)",
            padding: "6px",
            margin: 0,
            cursor: "pointer",
            display: "flex",
          }}
        >
          <BellIcon size={26} />
        </button>
      </div>

      {/* フィルターチップ + 検索 */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          margin: "24px 0",
          overflowX: "auto",
          padding: "0 0 2px 2px",
          scrollbarWidth: "none",
        }}
      >
        {FILTER_CHIPS.map(({ key, label, icon }) => {
          const count = filterState?.[key]?.length ?? 0;
          const hasValue = count > 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onOpenFilter?.(key)}
              style={filterPillStyle(hasValue)}
            >
              {icon}
              {hasValue ? `${label} · ${count}` : label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="検索"
          style={{ ...filterPillStyle(false), padding: "0 14px" }}
        >
          <SearchIcon size={16} />
        </button>
      </div>
    </div>
  );
}
