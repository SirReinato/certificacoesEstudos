import { createClient } from '@supabase/supabase-js';

// Fallback seguro para inicialização em ambientes sem variáveis configuradas (ex: Playwright E2E offline)
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!rawUrl || !rawAnonKey) {
  console.warn(
    '[SupabaseClient] Variáveis de ambiente VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não encontradas. Operando com cliente dummy offline para testes.'
  );
}

const supabaseUrl = rawUrl && rawUrl.startsWith('http') ? rawUrl : fallbackUrl;
const supabaseAnonKey = rawAnonKey && rawAnonKey.length > 10 ? rawAnonKey : fallbackAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
