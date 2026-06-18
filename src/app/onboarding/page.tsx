import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export default async function OnboardingPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/timeline");

  const result = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = result.data as ProfileRow | null;

  if (profile?.area) redirect("/timeline");

  return <OnboardingScreen userId={user.id} />;
}
