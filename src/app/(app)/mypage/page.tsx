import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import PracticeBadge from "@/components/ui/PracticeBadge";
import LogoutButton from "@/components/profile/LogoutButton";
import ProfileEditDrawer from "@/components/profile/ProfileEditDrawer";
import SimilarUsersSlider from "@/components/mypage/SimilarUsersSlider";
import BlockedUsersList from "@/components/mypage/BlockedUsersList";
import TimelineList from "@/components/session/TimelineList";
import type { SessionWithAuthor } from "@/lib/db";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

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

  // プロフィール
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  const profile = data as Profile | null;

  // 保存済みセッション
  const { data: savesRaw } = await supabase
    .from("saves")
    .select("session_id")
    .eq("user_id", userId);
  const savedIds = (savesRaw as { session_id: string }[] | null)?.map((s) => s.session_id) ?? [];

  let savedSessions: SessionWithAuthor[] = [];
  if (savedIds.length > 0) {
    const { data: sessionsRaw } = await supabase
      .from("sessions")
      .select("*")
      .in("id", savedIds)
      .order("created_at", { ascending: false });
    const rawSessions = (sessionsRaw as SessionRow[] | null) ?? [];
    const authorIds = [...new Set(rawSessions.map((s) => s.author_id))];
    if (authorIds.length > 0) {
      const { data: profilesRaw } = await supabase
        .from("profiles")
        .select("*")
        .in("id", authorIds);
      const profileMap = new Map(
        ((profilesRaw as ProfileRow[] | null) ?? []).map((p) => [p.id, p])
      );
      savedSessions = rawSessions
        .map((s) => {
          const author = profileMap.get(s.author_id);
          if (!author) return null;
          return { ...s, author };
        })
        .filter((s): s is SessionWithAuthor => s !== null);
    }
  }

  // ブロック中ユーザー
  type BlockEntry = { blocked_id: string; profile: Profile };
  let blockedEntries: BlockEntry[] = [];
  {
    const { data: blocksRaw } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", userId);
    const blockedIds = (blocksRaw as { blocked_id: string }[] | null)?.map((b) => b.blocked_id) ?? [];
    if (blockedIds.length > 0) {
      const { data: blockedProfilesRaw } = await supabase
        .from("profiles")
        .select("*")
        .in("id", blockedIds);
      const blockedProfiles = (blockedProfilesRaw as Profile[] | null) ?? [];
      blockedEntries = blockedIds
        .map((id) => {
          const p = blockedProfiles.find((bp) => bp.id === id);
          if (!p) return null;
          return { blocked_id: id, profile: p };
        })
        .filter((e): e is BlockEntry => e !== null);
    }
  }

  // 似ている人
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
      .slice(0, 6)
      .map(({ user }) => user);
  }

  const sectionLabel = {
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--text3)",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    marginBottom: "10px",
  };

  return (
    <main style={{ padding: "0 20px 100px" }}>
      <div style={{ padding: "10px 4px 14px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>
          マイページ
        </h1>
      </div>

      {/* プロフィールカード */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "18px", padding: "20px", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "12px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "var(--card2)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
            🎵
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px" }}>
              <span style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)" }}>
                {profile?.nickname ?? "ゲスト"}
              </span>
              {profile?.is_practice && <PracticeBadge />}
            </div>
            {profile?.area && (
              <div style={{ fontSize: "12px", color: "var(--text3)" }}>📍 {profile.area}</div>
            )}
          </div>
          {profile && <ProfileEditDrawer profile={profile} />}
        </div>

        {profile?.bio && (
          <div style={{ fontSize: "13px", color: "var(--text2)", lineHeight: 1.6, marginBottom: "12px" }}>
            {profile.bio}
          </div>
        )}

        {(profile?.instruments ?? []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {(profile!.instruments).map((inst) => (
              <span key={inst} style={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "3px 9px", fontSize: "11px", color: "var(--text2)", fontWeight: 500 }}>
                {inst}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 似ている人スライダー */}
      <section style={{ marginBottom: "24px" }}>
        <div style={sectionLabel}>似ている人</div>
        <SimilarUsersSlider users={similarUsers} />
      </section>

      {/* 保存済みセッション */}
      <section style={{ marginBottom: "24px" }}>
        <div style={sectionLabel}>保存した音源</div>
        {savedSessions.length === 0 ? (
          <div style={{ fontSize: "13px", color: "var(--text3)", lineHeight: 1.7 }}>
            まだ保存した音源はありません<br />
            <span style={{ fontSize: "12px" }}>タイムラインでブックマークした音源がここに表示されます。</span>
          </div>
        ) : (
          <TimelineList
            sessions={savedSessions}
            savedIds={savedIds}
            currentUserId={userId}
          />
        )}
      </section>

      {/* ブロック中 */}
      <section style={{ marginBottom: "24px" }}>
        <div style={sectionLabel}>ブロック中</div>
        <BlockedUsersList blocks={blockedEntries} currentUserId={userId} />
      </section>

      {/* 設定 */}
      <section>
        <div style={sectionLabel}>設定</div>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "18px", padding: "8px", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
