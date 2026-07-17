import { create } from "zustand";
import type { Profile } from "@/types/database";

interface ProfileStore {
  profile: Profile | null;
  setProfile: (p: Profile) => void;
  clearProfile: () => void;
  refetch: (userId: string) => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  setProfile: (p) => set({ profile: p }),
  clearProfile: () => set({ profile: null }),
  refetch: async (userId: string) => {
    const { createClient } = await import("@/lib/supabase");
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) set({ profile: data as Profile });
  },
}));
