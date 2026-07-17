import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import MypageClient from "./MypageClient";
import type { SessionWithAuthor } from "@/lib/db";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

function intersect(a: string[], b: string[]) {
  const setB = new Set(b);
  return a.filter((v) => setB.has(v));
}

function similarityScore(me: Profile, other: Profile): number {
  return (
    intersect(me.favorite_artists ?? [], other.favorite_artists ?? []).length * 3 +
    intersect(me.genres ?? [], other.genres ?? []).length * 2 +
    intersect(me.instruments ?? [], other.instruments ?? []).length * 1 +
    (me.area && me.area === other.area ? 1 : 0) +
    (me.is_practice === other.is_practice ? 1 : 0)
  );
}

export default async function MyPage() {
  const supabase = await createServerSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/timeline");

  const userId = authData.user.id;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  const profile = data as Profile | null;

  // 自分のセッション
  const { data: ownSessionsRaw } = await supabase
    .from("sessions")
    .select("*")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });
  const ownSessions: SessionWithAuthor[] = profile
    ? ((ownSessionsRaw as SessionRow[] | null) ?? []).map((s) => ({
        ...s,
        author: profile as Profile,
      }))
    : [];

  // 似ている人スライダー
  let similarUsers: Profile[] = [];
  if (profile) {
    const { data: othersRaw } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", userId)
      .limit(50);
    const others = (othersRaw as Profile[] | null) ?? [];
    similarUsers = others
      .map((u) => ({ user: u, score: similarityScore(profile, u) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ user }) => user);
  }

  return (
    <MypageClient
      profile={profile}
      ownSessions={ownSessions}
      similarUsers={similarUsers}
      userId={userId}
    />
  );
}
