"use client";

interface Props {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  isPractice?: boolean;
  onClick?: () => void;
  ring?: boolean;
}

const SVG_SIZE: Record<string, number> = { sm: 14, md: 18, lg: 24, xl: 38 };

function UserIcon({ px }: { px: number }) {
  return (
    <svg width={px} height={px} viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function Avatar({ src, alt = "", size = "md", isPractice, onClick, ring = false }: Props) {
  const iconPx = SVG_SIZE[size];
  const el = (
    <div className={`av av-${size}`} onClick={onClick} role={onClick ? "button" : undefined} aria-label={onClick ? alt || "プロフィールを見る" : undefined}>
      <div className="av-inner">
        {src
          ? <img src={src} alt={alt} className="av-img" />
          : <UserIcon px={iconPx} />
        }
      </div>
      {isPractice && <div className="av-dot">🔰</div>}
    </div>
  );

  if (ring && size === "xl") {
    return <div className="av-ring">{el}</div>;
  }
  return el;
}
