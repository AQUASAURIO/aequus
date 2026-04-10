import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Server-side client (uses service role for admin operations)
function createServerClient(): SupabaseClient {
  return createClient(
    supabaseUrl,
    supabaseServiceKey || supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

// Singleton pattern for server-side
const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined;
};

export const supabase: SupabaseClient = globalForSupabase.supabase
  ? globalForSupabase.supabase
  : createServerClient();

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase;
}

// Check if Supabase is properly configured and reachable
export async function isSupabaseConnected(): Promise<boolean> {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  try {
    const { error } = await supabase.from('plans').select('id').limit(1);
    return !error;
  } catch (e) {
    return false;
  }
}
