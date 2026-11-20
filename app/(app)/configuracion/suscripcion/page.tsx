import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { PLANS } from "@/lib/stripe/plans";
import { Button } from "@/components/ui/button";
import { startCheckout, openBillingPortal } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  trialing: "En período de prueba",
  active: "Activa",
  past_due: "Pago vencido",
  canceled: "Cancelada",
  incomplete: "Incompleta",
};

export default async function SuscripcionPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  const supabase = createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("plan, subscription_status, trial_ends_at, stripe_customer_id")
    .eq("id", current.organization.id)
    .single();

  const isOwner = current.role === "owner";

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold">Suscripción</h1>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <p className="text-sm text-neutral-500">Plan actual</p>
        <p className="text-lg font-semibold capitalize">{org?.plan ?? "inicial"}</p>
        <p className="mt-2 text-sm">
          Estado:{" "}
          <span className={org?.subscription_status === "active" || org?.subscription_status === "trialing" ? "text-green-700" : "text-red-600"}>
            {STATUS_LABEL[org?.subscription_status ?? "trialing"]}
          </span>
        </p>
        {org?.subscription_status === "trialing" && org?.trial_ends_at && (
          <p className="text-sm text-neutral-500">
            Tu prueba gratuita termina el {new Date(org.trial_ends_at).toLocaleDateString("es-CO")}.
          </p>
        )}

        {isOwner && org?.stripe_customer_id && (
          <form action={openBillingPortal} className="mt-4">
            <Button type="submit" variant="secondary">
              Administrar método de pago y facturas
            </Button>
          </form>
        )}
      </div>

      {isOwner && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {PLANS.map((p) => (
            <form key={p.key} action={startCheckout.bind(null, p.priceId)} className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="font-semibold">{p.label}</p>
              <Button type="submit" className="mt-3 w-full" variant={org?.plan === p.key ? "secondary" : "primary"}>
                {org?.plan === p.key ? "Plan actual" : "Elegir este plan"}
              </Button>
            </form>
          ))}
        </div>
      )}

      {!isOwner && (
        <p className="mt-4 text-sm text-neutral-500">
          Solo el propietario de la organización puede administrar la suscripción.
        </p>
      )}
    </div>
  );
}
