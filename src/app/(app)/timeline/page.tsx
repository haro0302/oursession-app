import { createServerSupabase } from "@/lib/supabase-server";
import TimelineClient from "@/components/session/TimelineClient";
import type { SessionWithAuthor } from "@/lib/db";
import type { Database, Song } from "@/types/database";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"] & { song: Song };
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabase();

  const { data: authData } = await supabase.auth.getUser();
  const currentUserId = authData.user?.id ?? null;

  // sessions と profiles を別クエリで取得して結合
  const { data: sessionsRaw } = await supabase
    .from("sessions")
    .select("*, song:songs(*)")
    .order("created_at", { ascending: false })
    .limit(30);

  const rawSessions = (sessionsRaw as unknown as SessionRow[] | null) ?? [];

  const authorIds = [...new Set(rawSessions.map((s) => s.author_id))];
  let profileMap = new Map<string, ProfileRow>();
  if (authorIds.length > 0) {
    const { data: profilesRaw } = await supabase
      .from("profiles")
      .select("*")
      .in("id", authorIds);
    profileMap = new Map(
      ((profilesRaw as ProfileRow[] | null) ?? []).map((p) => [p.id, p])
    );
  }

  let savedIds: string[] = [];
  let blockedIds: string[] = [];
  let answeredIds: string[] = [];
  if (currentUserId) {
    const [savesResult, blocksResult, answersResult] = await Promise.all([
      supabase.from("saves").select("session_id").eq("user_id", currentUserId),
      supabase.from("blocks").select("blocked_id").eq("blocker_id", currentUserId),
      supabase.from("answers").select("session_id").eq("sender_id", currentUserId),
    ]);
    savedIds =
      (savesResult.data as { session_id: string }[] | null)?.map(
        (s) => s.session_id
      ) ?? [];
    blockedIds =
      (blocksResult.data as { blocked_id: string }[] | null)?.map(
        (b) => b.blocked_id
      ) ?? [];
    answeredIds =
      (answersResult.data as { session_id: string }[] | null)?.map(
        (a) => a.session_id
      ) ?? [];
  }

  const sessions: SessionWithAuthor[] = rawSessions
    .filter((s) => !blockedIds.includes(s.author_id))
    .map((s) => {
      const author = profileMap.get(s.author_id);
      if (!author) return null;
      return { ...s, author };
    })
    .filter((s): s is SessionWithAuthor => s !== null);

  return (
    <TimelineClient
      sessions={sessions}
      savedIds={savedIds}
      answeredIds={answeredIds}
      currentUserId={currentUserId}
      welcomeType={params.deleted === "true" ? "deleted" : params.welcome}
    />
  );
}
