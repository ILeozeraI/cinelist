"use server";

import { revalidatePath } from "next/cache";
import { isMovieId } from "@/lib/filters";
import { getMark, isMarkStatus, saveMark, type MarkStatus } from "@/lib/marks";
import { createSupabaseServerClient, getCurrentUserId } from "@/lib/supabase/server";

export type MarkResult = { state: "ok"; status: MarkStatus | null } | { state: "anonimo" } | { state: "indisponivel" };

// Server Actions são endpoints públicos: valide tudo o que chega.
function requireMovieId(movieId: unknown): number {
  if (!isMovieId(movieId)) throw new Error("Filme inválido");
  return movieId;
}

export async function loadMark(movieId: number): Promise<MarkResult> {
  const id = requireMovieId(movieId);
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { state: "indisponivel" };
    const userId = await getCurrentUserId(supabase);
    if (!userId) return { state: "anonimo" };
    return { state: "ok", status: await getMark(supabase, userId, id) };
  } catch (error) {
    console.error("loadMark falhou", error);
    return { state: "indisponivel" };
  }
}

export async function setMark(movieId: number, status: MarkStatus | null): Promise<MarkResult> {
  const id = requireMovieId(movieId);
  if (status !== null && !isMarkStatus(status)) throw new Error("Estado inválido");
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { state: "indisponivel" };
    const userId = await getCurrentUserId(supabase);
    if (!userId) return { state: "anonimo" };
    await saveMark(supabase, userId, id, status);
  } catch (error) {
    console.error("setMark falhou", error);
    return { state: "indisponivel" };
  }
  revalidatePath("/quero-assistir");
  revalidatePath("/ja-assisti");
  return { state: "ok", status };
}
