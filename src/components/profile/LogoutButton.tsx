"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { showToast } from "@/components/ui/Toast";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    showToast("ログアウトしました");
    router.push("/timeline");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "14px 16px",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        color: "var(--text2)",
        fontSize: "14px",
        fontWeight: 500,
        transition: "background 0.18s",
        textAlign: "left",
      }}
    >
      <LogOut size={16} />
      <span>{loading ? "ログアウト中…" : "ログアウト"}</span>
    </button>
  );
}
