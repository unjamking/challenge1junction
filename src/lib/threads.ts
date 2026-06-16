import { supabase } from "@/integrations/supabase/client";
import type { UIMessage } from "ai";

export interface ThreadRow {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export async function listThreads(): Promise<ThreadRow[]> {
  const { data, error } = await supabase
    .from("threads")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createThread(): Promise<ThreadRow> {
  const { data, error } = await supabase.from("threads").insert({}).select().single();
  if (error) throw error;
  return data;
}

export async function deleteThread(id: string) {
  const { error } = await supabase.from("threads").delete().eq("id", id);
  if (error) throw error;
}

export async function renameThread(id: string, title: string) {
  const { error } = await supabase
    .from("threads")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function getThreadMessages(threadId: string): Promise<UIMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    role: row.role as UIMessage["role"],
    parts: row.parts as UIMessage["parts"],
  }));
}

export async function saveMessage(threadId: string, message: UIMessage) {
  const { error } = await supabase.from("messages").insert({
    thread_id: threadId,
    role: message.role,
    parts: message.parts as unknown as never,
  });
  if (error) throw error;
  await supabase
    .from("threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId);
}

export function deriveTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New event request";
  return clean.length > 60 ? clean.slice(0, 57) + "…" : clean;
}
