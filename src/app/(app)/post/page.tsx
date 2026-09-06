import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import PostClient from "./PostClient";
import type { Session, Song } from "@/types/database";

export default async function PostPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/timeline");

  let editSession: (Session & { song: Song }) | null = null;
  if (params.edit) {
    const { data } = await supabase
      .from("sessions")
      .select("*, song:songs(*)")
      .eq("id", params.edit)
      .eq("author_id", authData.user.id)
      .maybeSingle();

    if (!data) redirect("/mypage");
    editSession = data as unknown as Session & { song: Song };
  }

  return (
    <PostClient
      userId={authData.user.id}
      editSession={editSession}
    />
  );
}
