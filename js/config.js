// ============================================================
// SUPABASE CONFIG
// 1. Create a Supabase project.
// 2. In Project Settings → API, copy your Project URL and anon key.
// 3. Paste them below.
// IMPORTANT: The anon key is designed to be public. Your database
// and storage RLS policies are what protect the admin actions.
// ============================================================

export const SUPABASE_URL = "https://rukjxryqkilmxvihqypm.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_4Wt4J_q-0fSHRorzb5Dd2A_rEV30ii4";

export const STORAGE_BUCKET = "month-photos";

export const supabaseReady =
  !SUPABASE_URL.includes("YOUR_") &&
  !SUPABASE_ANON_KEY.includes("YOUR_");
