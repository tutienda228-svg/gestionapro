import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { InvoiceForm } from "../invoice-form";
import { createInvoice } from "../actions";

export default async function NuevaFacturaPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  const supabase = createClient();
  const [{ data: clients }, { data: projects }] = await Promise.all([
    supabase.from("clients").select("id, name").eq("organization_id", current.organization.id).eq("status", "active").order("name"),
    supabase.from("projects").select("id, name").eq("organization_id", current.organization.id).order("name"),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold">Nueva factura</h1>
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <InvoiceForm clients={clients ?? []} projects={projects ?? []} onSubmit={createInvoice} submitLabel="Crear factura" />
      </div>
    </div>
  );
}
