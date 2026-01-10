
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Fetch keys from environment variables injected by Vite
const supabaseUrl = (process.env as any).VITE_SUPABASE_URL;
const supabaseAnonKey = (process.env as any).VITE_SUPABASE_ANON_KEY;

// Fail-safe check
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-url')) {
  console.warn(
    "SUPABASE CONFIGURATION MISSING: Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables."
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

// Health check to verify connection in console
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error("Supabase Connection Error:", error.message);
  } else {
    console.log("Supabase Connection: Active");
  }
});
