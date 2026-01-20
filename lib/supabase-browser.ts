import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client for auth
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Validate USC email domain
export function isValidUSCEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@usc.edu')
}
