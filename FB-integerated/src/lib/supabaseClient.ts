import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// The publishable key is safe in a browser; never put a service-role key here.
// Keeping this optional lets the jury demo run without exposing credentials.
export const supabase = url && publishableKey
  ? createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export const supabaseEnabled = Boolean(supabase);
