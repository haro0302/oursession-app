"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import Aurora from "@/components/layout/Aurora";
import FloatingNav from "@/components/layout/FloatingNav";
import AuthGateDrawer, {
  AuthGateRegistrar,
} from "@/components/auth/AuthGateDrawer";
import InstallBanner from "@/components/ui/InstallBanner";
import ProfileOverlay from "@/components/profile/ProfileOverlay";
import { ProfileContext } from "@/contexts/ProfileContext";
import NotificationsOverlay from "@/components/overlay/NotificationsOverlay";
import { NotificationsContext } from "@/contexts/NotificationsContext";
import { useProfileStore } from "@/store/profileStore";
import { useBlockStore } from "@/store/blockStore";
import { useNotificationStore } from "@/store/notificationStore";

const NOTIF_POLL_INTERVAL_MS = 60_000;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user ?? null;
      setUser(u);
      if (u) {
        useProfileStore.getState().refetch(u.id);
        useBlockStore.getState().fetch(u.id);
        useNotificationStore.getState().fetch(u.id);
      } else {
        useProfileStore.getState().clearProfile();
        useBlockStore.getState().clear();
        useNotificationStore.getState().clear();
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        useProfileStore.getState().refetch(u.id);
        useBlockStore.getState().fetch(u.id);
        useNotificationStore.getState().fetch(u.id);
      } else {
        useProfileStore.getState().clearProfile();
        useBlockStore.getState().clear();
        useNotificationStore.getState().clear();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      useNotificationStore.getState().fetch(user.id);
    }, NOTIF_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [user]);

  const handleOpenAuthGate = useCallback(() => setAuthGateOpen(true), []);

  function handlePostClick() {
    if (!user) {
      setAuthGateOpen(true);
      return;
    }
    router.push("/post");
  }

  return (
    <ProfileContext.Provider value={{ openProfile: (id) => setProfileUserId(id) }}>
    <NotificationsContext.Provider value={{ openNotifications: () => setNotificationsOpen(true) }}>
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
            minHeight: "100dvh",
            paddingBottom: "90px",
          }}
        >
          {children}
        </div>
        <InstallBanner />
        <FloatingNav onPostClick={handlePostClick} />
        <ProfileOverlay
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
          currentUserId={user?.id ?? null}
        />
        <NotificationsOverlay
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          currentUserId={user?.id ?? null}
        />
        <AuthGateDrawer
          open={authGateOpen}
          onClose={() => setAuthGateOpen(false)}
        />
      </div>
    </NotificationsContext.Provider>
    </ProfileContext.Provider>
  );
}
