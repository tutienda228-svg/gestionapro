import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { CompanyForm } from "./company-form";

export default async function EmpresaPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  const supabase = createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name, nit_or_tax_id, phone, email, address, logo_url")
    .eq("id", current.organization.id)
    .single();

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold">Datos de la empresa</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Esta información aparece en tus cotizaciones y facturas en PDF. Moneda: COP (fija en la v1).
      </p>
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <CompanyForm defaultValues={org} />
      </div>
    </div>
  );
}
