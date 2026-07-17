import { create } from "zustand";

interface BlockStore {
  blockedIds: Set<string>;
  loaded: boolean;
  fetch: (userId: string) => Promise<void>;
  add: (targetUserId: string) => void;
  remove: (targetUserId: string) => void;
  clear: () => void;
}

export const useBlockStore = create<BlockStore>((set) => ({
  blockedIds: new Set(),
  loaded: false,
  fetch: async (userId: string) => {
    const { createClient } = await import("@/lib/supabase");
    const supabase = createClient();
    const { data } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", userId);
    const ids = new Set<string>(
      ((data as { blocked_id: string }[] | null) ?? []).map((r) => r.blocked_id)
    );
    set({ blockedIds: ids, loaded: true });
  },
  add: (targetUserId: string) => {
    set((s) => ({ blockedIds: new Set(s.blockedIds).add(targetUserId) }));
  },
  remove: (targetUserId: string) => {
    set((s) => {
      const next = new Set(s.blockedIds);
      next.delete(targetUserId);
      return { blockedIds: next };
    });
  },
  clear: () => set({ blockedIds: new Set(), loaded: false }),
}));
