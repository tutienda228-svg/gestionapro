import { createClient } from "@/lib/supabase/server";
import { getPlanLimits } from "@/lib/stripe/plans";

/**
 * Regla de negocio: si la suscripción está vencida o cancelada, se bloquea la
 * creación de NUEVAS cotizaciones o facturas, pero se permite seguir
 * consultando los datos existentes (lectura libre, solo se bloquea insert).
 */
export function assertSubscriptionActive(status: string) {
  if (status === "past_due" || status === "canceled") {
    throw new Error(
      "Tu suscripción está vencida. Regulariza el pago en Configuración > Suscripción para seguir creando cotizaciones o facturas."
    );
  }
}

function monthStartISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

/**
 * Hace cumplir, en el servidor, los límites de "cotizaciones y facturas por
 * mes" del Plan Inicial (y el tope de usuarios de cualquier plan). Antes
 * esto solo se mostraba como información en la landing; ahora se valida
 * antes de insertar, independientemente de lo que muestre la UI.
 */
export async function assertWithinPlanLimits(
  organizationId: string,
  plan: string,
  kind: "quotation" | "invoice" | "member"
) {
  const limits = getPlanLimits(plan);
  const supabase = createClient();

  if (kind === "quotation" && limits.quotationsPerMonth != null) {
    const { count } = await supabase
      .from("quotations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", monthStartISO());
    if ((count ?? 0) >= limits.quotationsPerMonth) {
      throw new Error(
        `Tu plan permite hasta ${limits.quotationsPerMonth} cotizaciones por mes. Mejora tu plan en Configuración > Suscripción para crear más.`
      );
    }
  }

  if (kind === "invoice" && limits.invoicesPerMonth != null) {
    const { count } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", monthStartISO());
    if ((count ?? 0) >= limits.invoicesPerMonth) {
      throw new Error(
        `Tu plan permite hasta ${limits.invoicesPerMonth} facturas por mes. Mejora tu plan en Configuración > Suscripción para crear más.`
      );
    }
  }

  if (kind === "member" && limits.maxUsers != null) {
    const { count } = await supabase
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["active", "invited"]);
    if ((count ?? 0) >= limits.maxUsers) {
      throw new Error(
        `Tu plan permite hasta ${limits.maxUsers} usuario${limits.maxUsers === 1 ? "" : "s"}. Mejora tu plan en Configuración > Suscripción para invitar más.`
      );
    }
  }
}
