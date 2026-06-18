"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem("install_dismissed") === "true") return;

    const count = parseInt(localStorage.getItem("our_session_visits") || "0") + 1;
    localStorage.setItem("our_session_visits", String(count));

    function handlePrompt(e: Event) {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      if (count >= 2) setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem("install_dismissed", "true");
    }
    setVisible(false);
  }

  function handleDismiss() {
    localStorage.setItem("install_dismissed", "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "92px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 90,
        width: "calc(100% - 32px)",
        maxWidth: "420px",
        background: "var(--card2)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
        animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      <span style={{ fontSize: "20px", flexShrink: 0 }}>🎵</span>
      <span style={{ flex: 1, fontSize: "13px", color: "var(--text2)", lineHeight: 1.4 }}>
        ホーム画面に追加すると、すぐに開けます
      </span>
      <button
        type="button"
        onClick={handleInstall}
        style={{
          background: "var(--red)",
          border: "none",
          borderRadius: "10px",
          padding: "7px 13px",
          fontSize: "12px",
          fontWeight: 700,
          color: "#fff",
          cursor: "pointer",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(232,74,95,0.35)",
        }}
      >
        追加する
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="閉じる"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text3)",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          flexShrink: 0,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
