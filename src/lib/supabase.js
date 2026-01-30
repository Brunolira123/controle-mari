import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yvslxucasatfstuqauxr.supabase.co'
const supabaseAnonKey = 'sb_publishable_LmlmagjuKbIDZQkSvrO5lQ_QeRx8JPU'
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})