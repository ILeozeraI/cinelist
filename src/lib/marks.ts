import type { SupabaseClient } from "@supabase/supabase-js";

export type MarkStatus = "quero_assistir" | "ja_assisti";

export const MARK_STATUSES: readonly MarkStatus[] = ["quero_assistir", "ja_assisti"];

export function isMarkStatus(v: unknown): v is MarkStatus {
  return MARK_STATUSES.some((s) => s === v);
}

export async function getMark(supabase: SupabaseClient, userId: string, movieId: number): Promise<MarkStatus | null> {
  const { data, error } = await supabase.from("movie_marks").select("status").eq("user_id", userId).eq("movie_id", movieId).maybeSingle();
  if (error) throw error;
  return isMarkStatus(data?.status) ? data.status : null;
}

// `null` desmarca o filme.
export async function saveMark(supabase: SupabaseClient, userId: string, movieId: number, status: MarkStatus | null): Promise<void> {
  const table = supabase.from("movie_marks");
  const { error } =
    status === null
      ? await table.delete().eq("user_id", userId).eq("movie_id", movieId)
      : await table.upsert({ user_id: userId, movie_id: movieId, status, updated_at: new Date().toISOString() }, { onConflict: "user_id,movie_id" });
  if (error) throw error;
}

export async function listMarkedMovieIds(supabase: SupabaseClient, userId: string, status: MarkStatus): Promise<number[]> {
  const { data, error } = await supabase
    .from("movie_marks")
    .select("movie_id")
    .eq("user_id", userId)
    .eq("status", status)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.movie_id as number);
}
