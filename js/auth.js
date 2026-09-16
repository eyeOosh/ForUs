import { supabase } from "./supabase-client.js";

export async function requireLogin() {
  if (!supabase) {
    return { session: null, setupError: true };
  }

  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    window.location.replace("index.html");
    return { session: null };
  }

  return { session: data.session };
}

export function logout() {
  return supabase?.auth.signOut();
}
