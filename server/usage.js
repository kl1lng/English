import { createClient } from "@supabase/supabase-js";

// Daily per-user limit for costly AI calls, kept in Supabase (see
// supabase/migrations/001_foundation.sql) so it works across serverless instances.
// Returns true when the call is allowed. If the database function is not set up yet,
// it fails open (and logs), so deploying before running the migration breaks nothing.
export async function consume(token, kind, limit) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !token) return true;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.rpc("bump_usage", {
    p_kind: kind,
    p_limit: limit,
  });
  if (error) {
    console.error("Usage limit check unavailable:", error.message);
    return true;
  }
  return data === true;
}

export function dailyLimit(envName, fallback) {
  const value = Number(process.env[envName]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
