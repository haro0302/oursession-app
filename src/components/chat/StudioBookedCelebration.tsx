"use client";

import { useEffect } from "react";
import { PartyPopper } from "lucide-react";

const AUTO_DISMISS_MS = 2600;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function StudioBookedCelebration({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes studioBookedPop {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
          55% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
          75% { transform: translate(-50%, -50%) scale(0.96); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 90,
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)",
        }}
      />
      <div
        onClick={onClose}
        style={{
          position: "fixed", left: "50%", top: "50%", zIndex: 95,
          width: "min(280px, calc(100vw - 64px))",
          background: "rgba(26,26,32,0.97)",
          backdropFilter: "blur(28px) saturate(1.4)", WebkitBackdropFilter: "blur(28px) saturate(1.4)",
          border: "1px solid var(--red-border)", borderRadius: "22px",
          padding: "26px 22px 24px",
          textAlign: "center",
          
          animation: "studioBookedPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        }}
      >
        <div
          style={{
            width: "56px", height: "56px", margin: "0 auto 14px", borderRadius: "50%",
            background: "linear-gradient(135deg, var(--red), var(--red2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            
          }}
        >
          <PartyPopper size={26} color="white" />
        </div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
          スタジオが決定しました！
        </div>
      </div>
    </>
  );
}
