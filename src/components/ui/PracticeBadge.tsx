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
          background: "linear-gradient(100deg, #ffd884, #ffa964)",
          borderRadius: "9px",
          height: "18px",
          padding: "0 9px",
          fontSize: "11.5px",
          fontWeight: 700,
          color: "#3a2a00",
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}
      >
        練習中
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "linear-gradient(100deg, #ffd884, #ffa964)",
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
      練習中
    </span>
  );
}
