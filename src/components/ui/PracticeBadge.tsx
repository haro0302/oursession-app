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
          background: "linear-gradient(135deg, #fff89a 0%, #ff9a5a 100%)",
          borderRadius: "8px",
          padding: "2px 8px",
          fontSize: "9px",
          fontWeight: 700,
          color: "#3a2a00",
          letterSpacing: "0.3px",
          whiteSpace: "nowrap",
          lineHeight: 1.5,
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
        background: "linear-gradient(135deg, #fff89a 0%, #ff9a5a 100%)",
        borderRadius: "8px",
        padding: "3px 10px",
        fontSize: "10px",
        fontWeight: 700,
        color: "#3a2a00",
        letterSpacing: "0.3px",
        whiteSpace: "nowrap",
        lineHeight: 1.5,
      }}
    >
      🔰 練習中
    </span>
  );
}
