import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import LandingPage from "@/components/landing/LandingPage";

export default async function Home() {
  const supabase = await createServerSupabase();
  const { data: authData } = await supabase.auth.getUser();

  if (authData.user?.id) {
    redirect("/timeline");
  }

  return <LandingPage />;
}
