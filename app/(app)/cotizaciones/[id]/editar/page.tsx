import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { QuotationForm } from "../../quotation-form";
import { updateQuotation } from "../../actions";

export default async function EditarCotizacionPage({ params }: { params: { id: string } }) {
  const current = await getCurrentOrg();
  if (!current) return null;

  const supabase = createClient();
  const { data: quotation } = await supabase
    .from("quotations")
    .select("*, quotation_items(*)")
    .eq("id", params.id)
    .eq("organization_id", current.organization.id)
    .single();

  if (!quotation) notFound();
  if (quotation.status !== "draft") redirect(`/cotizaciones/${params.id}`);

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("organization_id", current.organization.id)
    .order("name");

  const boundSubmit = updateQuotation.bind(null, quotation.id);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold">Editar cotización</h1>
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <QuotationForm
          clients={clients ?? []}
          defaultValues={{
            clientId: quotation.client_id,
            title: quotation.title,
            description: quotation.description ?? "",
            taxRate: quotation.tax_rate,
            discountAmount: quotation.discount_amount,
            validUntil: quotation.valid_until ?? "",
            items: quotation.quotation_items.map((it: any) => ({
              description: it.description,
              quantity: it.quantity,
              unit: it.unit ?? "",
              unitPrice: it.unit_price,
            })),
          }}
          onSubmit={boundSubmit}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  );
}
