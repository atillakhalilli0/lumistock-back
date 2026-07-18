import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Server-side only client using the service_role key.
// NEVER expose this key or this client to the frontend.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});