import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { QuotationForm } from "../quotation-form";
import { createQuotation } from "../actions";

export default async function NuevaCotizacionPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  const supabase = createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("organization_id", current.organization.id)
    .eq("status", "active")
    .order("name");

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold">Nueva cotización</h1>
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <QuotationForm
          clients={clients ?? []}
          onSubmit={createQuotation}
          submitLabel="Crear cotización"
        />
      </div>
    </div>
  );
}
