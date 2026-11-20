import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role. SOLO se importa desde código de servidor
 * (Route Handlers, Server Actions, webhooks, jobs cron).
 * "server-only" rompe la build si algún día se importa desde un componente cliente.
 * Nunca se expone SUPABASE_SERVICE_ROLE_KEY al navegador.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
