// ═══════════════════════════════════════════════════════════════
//  src/lib/supabase.js
//  Single Supabase client instance for the entire app.
//
//  SETUP:
//  1. Copy .env.example → .env.local
//  2. Fill in your Project URL and anon key from:
//     Supabase Dashboard → Settings → API
// ═══════════════════════════════════════════════════════════════
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.example → .env.local and fill in your project URL and anon key."
  );
}

// Debugging: ensure env vars are actually loaded (restart dev server after editing .env.local)
if (import.meta.env.DEV) {
  console.log("[supabase] URL:", SUPABASE_URL);
  console.log("[supabase] ANON (masked):", SUPABASE_ANON ? `${SUPABASE_ANON.slice(0, 6)}… (len ${SUPABASE_ANON.length})` : "<missing>");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    // Persist session in localStorage so users stay logged in on refresh
    persistSession: true,
    autoRefreshToken: true,
  },
});
