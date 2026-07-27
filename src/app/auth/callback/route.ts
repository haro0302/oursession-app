import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

async function redirectAfterAuth(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  userId: string,
  origin: string,
  birthDate: string | null
) {
  if (birthDate) {
    await supabase
      .from("profile_private")
      .upsert(
        { user_id: userId, birth_date: birthDate } as unknown as never,
        { onConflict: "user_id", ignoreDuplicates: true }
      );
  }

  const result = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  const profile = result.data as ProfileRow | null;

  if (!profile?.onboarded_at) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }
  return NextResponse.redirect(`${origin}/timeline?welcome=returning`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const birthDate = searchParams.get("birth_date");

  const supabase = await createServerSupabase();

  // PKCE フロー（新しい形式）
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      return redirectAfterAuth(supabase, data.user.id, origin, birthDate);
    }
  }

  // token_hash フロー（メール確認・マジックリンクの旧形式）
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "recovery" | "invite" | "email_change",
    });
    if (!error && data.user) {
      return redirectAfterAuth(supabase, data.user.id, origin, birthDate);
    }
  }

  return NextResponse.redirect(`${origin}/timeline`);
}
