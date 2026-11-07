import { createClient } from "@supabase/supabase-js";

// Public values only. The publishable key is safe in the browser; RLS protects the data.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseReady = Boolean(url && key);

export const supabase = supabaseReady
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
