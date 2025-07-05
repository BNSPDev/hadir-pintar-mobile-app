import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "https://vuvykznlggzkzarvfzes.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1dnlrem5sZ2d6a3phcnZmemVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1ODQxMjcsImV4cCI6MjA2NzE2MDEyN30.9MLQNAoxrL_fzOXMndJB3ZIskGATQPOZ1ZtHMVrwUmE";

// Only log in development
if (import.meta.env.DEV) {
  console.log("Connecting to Supabase with URL:", SUPABASE_URL);
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
