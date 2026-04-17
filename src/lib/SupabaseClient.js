// src/lib/SupabaseClient.js
// ─────────────────────────────────────────────────────────────
//  Replace the two placeholder strings below with your actual
//  Supabase project URL and anon public key.
//  You'll find them at: Project Settings → API → Project URL / anon key
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL  || 'https://lgnqatcykmaainlmefnj.supabase.co';
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON || 'sb_publishable_2vRTSVWzf9wk0223D6xtgA_GsIPJJ_w';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false },
});
