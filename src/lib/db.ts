/**
 * Typed database helpers.
 *
 * @supabase/supabase-js 2.107 + TypeScript 5.9 have a generic inference
 * regression that causes `.update()` parameter to resolve as `never`.
 * These helpers localise the necessary `unknown` cast in one place while
 * keeping all call-site types correct.
 */
import type { Database } from "@/types/database";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type SessionWithAuthor =
  Database["public"]["Tables"]["sessions"]["Row"] & {
    author: Database["public"]["Tables"]["profiles"]["Row"];
  };

export async function addSave(userId: string, sessionId: string): Promise<void> {
  const { createClient } = await import("@/lib/supabase");
  const supabase = createClient();
  await supabase
    .from("saves")
    .insert({ user_id: userId, session_id: sessionId } as unknown as never);
}

export async function removeSave(userId: string, sessionId: string): Promise<void> {
  const { createClient } = await import("@/lib/supabase");
  const supabase = createClient();
  await supabase
    .from("saves")
    .delete()
    .eq("user_id", userId)
    .eq("session_id", sessionId);
}

type AnswerInsert = Database["public"]["Tables"]["answers"]["Insert"];

export async function insertAnswer(data: AnswerInsert): Promise<void> {
  const { createClient } = await import("@/lib/supabase");
  const supabase = createClient();
  const { error } = await supabase
    .from("answers")
    .insert(data as unknown as never);
  if (error) throw new Error(error.message);
}

export async function updateAnswerStatus(
  answerId: string,
  status: "approved" | "declined"
): Promise<void> {
  const { createClient } = await import("@/lib/supabase");
  const supabase = createClient();
  await supabase
    .from("answers")
    .update({ status } as unknown as never)
    .eq("id", answerId);
}

type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];

export async function insertSession(data: SessionInsert): Promise<void> {
  const { createClient } = await import("@/lib/supabase");
  const supabase = createClient();
  const { error } = await supabase
    .from("sessions")
    .insert(data as unknown as never);
  if (error) throw new Error(error.message);
}

export async function updateSession(
  sessionId: string,
  authorId: string,
  data: { title: string; body: string | null; tags: string[] }
): Promise<void> {
  const { createClient } = await import("@/lib/supabase");
  const supabase = createClient();
  const { error } = await supabase
    .from("sessions")
    .update(data as unknown as never)
    .eq("id", sessionId)
    .eq("author_id", authorId);
  if (error) throw new Error(error.message);
}

export async function updateProfile(
  userId: string,
  data: ProfileUpdate
): Promise<void> {
  const { createClient } = await import("@/lib/supabase");
  const supabase = createClient();
  await supabase
    .from("profiles")
    .update(data as unknown as never)
    .eq("id", userId);
}

type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

export async function insertMessage(data: MessageInsert): Promise<void> {
  const { createClient } = await import("@/lib/supabase");
  const supabase = createClient();
  const { error } = await supabase
    .from("messages")
    .insert(data as unknown as never);
  if (error) throw new Error(error.message);
}

type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];

export async function insertReport(data: ReportInsert): Promise<void> {
  const { createClient } = await import("@/lib/supabase");
  const supabase = createClient();
  const { error } = await supabase
    .from("reports")
    .insert(data as unknown as never);
  if (error) throw new Error(error.message);
}

export async function insertBlock(blockerId: string, blockedId: string): Promise<void> {
  const { createClient } = await import("@/lib/supabase");
  const supabase = createClient();
  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: blockerId, blocked_id: blockedId } as unknown as never);
  if (error) throw new Error(error.message);
}

export async function removeBlock(blockerId: string, blockedId: string): Promise<void> {
  const { createClient } = await import("@/lib/supabase");
  const supabase = createClient();
  await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
}
