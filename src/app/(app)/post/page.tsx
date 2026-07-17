import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import PostClient from "./PostClient";
import type { Session } from "@/types/database";

export default async function PostPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/timeline");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_practice")
    .eq("id", authData.user.id)
    .maybeSingle();

  const isPracticeDefault =
    (profile as { is_practice: boolean } | null)?.is_practice ?? true;

  let editSession: Session | null = null;
  if (params.edit) {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", params.edit)
      .eq("author_id", authData.user.id)
      .maybeSingle();

    if (!data) redirect("/mypage");
    editSession = data as Session;
  }

  return (
    <PostClient
      userId={authData.user.id}
      isPracticeDefault={isPracticeDefault}
      editSession={editSession}
    />
  );
}
