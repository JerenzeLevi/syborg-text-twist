import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

// Fetches a wider slice than 10 so mode-filtering (done client-side, same
// logic as the local leaderboard) still has enough rows per mode to rank.
export async function fetchGlobalLeaderboard() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("scores")
    .select("name, score, words_found, mode, date:created_at")
    .order("score", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function submitGlobalScore({ name, score, wordsFound, mode = "classic" }) {
  if (!supabase) return;
  const { error } = await supabase
    .from("scores")
    .insert({ name, score, words_found: wordsFound, mode });
  if (error) throw error;
}
