interface PracticeBadgeProps {
  mini?: boolean;
}

export default function PracticeBadge({ mini = false }: PracticeBadgeProps) {
  if (mini) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "2px",
          background: "linear-gradient(135deg, rgba(255,230,80,0.18) 0%, rgba(255,140,60,0.18) 100%)",
          border: "1px solid rgba(255,160,60,0.35)",
          borderRadius: "6px",
          padding: "1px 6px",
          fontSize: "10px",
          fontWeight: 600,
          color: "#ffb347",
          whiteSpace: "nowrap",
        }}
      >
        🔰 練習中
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: "linear-gradient(135deg, rgba(255,230,80,0.14) 0%, rgba(255,140,60,0.14) 100%)",
        border: "1px solid rgba(255,160,60,0.35)",
        borderRadius: "10px",
        padding: "3px 10px",
        fontSize: "12px",
        fontWeight: 600,
        color: "#ffb347",
        whiteSpace: "nowrap",
      }}
    >
      🔰 練習中
    </span>
  );
}
