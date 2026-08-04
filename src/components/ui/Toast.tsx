"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export type ToastVariant = "default" | "success" | "error";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

let toastListeners: ((item: ToastItem) => void)[] = [];

export function showToast(message: string, variant: ToastVariant = "default") {
  const item: ToastItem = { id: crypto.randomUUID(), message, variant };
  toastListeners.forEach((fn) => fn(item));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const handler = (item: ToastItem) => {
      setToasts((prev) => [...prev, item]);
      const t = setTimeout(() => dismiss(item.id), 3800);
      timersRef.current.set(item.id, t);
    };
    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== handler);
    };
  }, []);

  function dismiss(id: string) {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "90px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const icon =
    toast.variant === "success"
      ? "🎵"
      : toast.variant === "error"
      ? "⚠️"
      : "🎵";

  return (
    <div
      style={{
        pointerEvents: "auto",
        background: "rgba(28,28,34,0.95)",
        backdropFilter: "blur(28px) saturate(1.5)",
        WebkitBackdropFilter: "blur(28px) saturate(1.5)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "16px",
        padding: "13px 14px 13px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        maxWidth: "calc(390px - 36px)",
        minWidth: "240px",
        
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.32s ease, transform 0.4s cubic-bezier(0.4,1.4,0.5,1)",
        fontFamily: "var(--font-outfit), sans-serif",
      }}
    >
      <div
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          background: "rgba(232,140,90,0.15)",
          border: "1px solid rgba(232,140,90,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "14px",
          lineHeight: 1,
          marginTop: "1px",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: "13px",
          color: "var(--text)",
          lineHeight: 1.55,
          fontWeight: 500,
          whiteSpace: "pre-line",
        }}
      >
        {toast.message}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="閉じる"
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "transparent",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          marginTop: "-1px",
          color: "var(--text3)",
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}
