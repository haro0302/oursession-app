import { create } from "zustand";
import { fetchNotifications, type DerivedNotif } from "@/lib/notifications";

const NOTIF_READ_AT_KEY = "notif_read_at";

function getReadAt(): Date | null {
  if (typeof window === "undefined") return null;
  const val = localStorage.getItem(NOTIF_READ_AT_KEY);
  return val ? new Date(val) : null;
}

interface NotificationStore {
  notifs: DerivedNotif[];
  readAt: Date | null;
  loaded: boolean;
  fetch: (userId: string) => Promise<void>;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifs: [],
  readAt: getReadAt(),
  loaded: false,
  fetch: async (userId: string) => {
    const items = await fetchNotifications(userId);
    set({ notifs: items, loaded: true });
  },
  markAllRead: () => {
    const now = new Date().toISOString();
    localStorage.setItem(NOTIF_READ_AT_KEY, now);
    set({ readAt: new Date(now) });
  },
  clear: () => set({ notifs: [], loaded: false }),
}));
