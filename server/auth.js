import { createClient } from "@supabase/supabase-js";

// Checks the signed-in user on the server. The access token is validated by the
// Supabase Auth server (getUser), which is what Supabase recommends for authorization.
// When Supabase is not configured (local demo), there are no accounts, so the check is
// skipped. When it is configured, a missing or invalid token is rejected.
let client;

function supabaseClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  client ||= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function authConfigured() {
  return Boolean(supabaseClient());
}

// Returns { userId } (userId is null in the no-accounts demo) or null when rejected.
export async function getRequestUser(request) {
  const supabase = supabaseClient();
  if (!supabase) return { userId: null, token: "" };
  const header = String(request.headers?.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return { userId: data.user.id, token };
}
