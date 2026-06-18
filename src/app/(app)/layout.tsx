"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import Aurora from "@/components/layout/Aurora";
import FloatingNav from "@/components/layout/FloatingNav";
import AuthGateDrawer, {
  AuthGateRegistrar,
} from "@/components/auth/AuthGateDrawer";
import PostDrawer from "@/components/session/PostDrawer";
import InstallBanner from "@/components/ui/InstallBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPractice, setIsPractice] = useState(true);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [postDrawerOpen, setPostDrawerOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_practice")
          .eq("id", data.user.id)
          .maybeSingle();
        setIsPractice((profile as { is_practice: boolean } | null)?.is_practice ?? true);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleOpenAuthGate = useCallback(() => setAuthGateOpen(true), []);

  function handlePostClick() {
    if (!user) {
      setAuthGateOpen(true);
      return;
    }
    setPostDrawerOpen(true);
  }

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      <Aurora />
      <AuthGateRegistrar onOpen={handleOpenAuthGate} />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100dvh",
          paddingBottom: "90px",
        }}
      >
        {children}
      </div>
      <InstallBanner />
      <FloatingNav onPostClick={handlePostClick} />
      <AuthGateDrawer
        open={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
      />
      {user && (
        <PostDrawer
          open={postDrawerOpen}
          onClose={() => setPostDrawerOpen(false)}
          userId={user.id}
          isPracticeDefault={isPractice}
        />
      )}
    </div>
  );
}
