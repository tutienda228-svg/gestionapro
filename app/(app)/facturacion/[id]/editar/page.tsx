import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { InvoiceForm } from "../../invoice-form";
import { updateInvoice } from "../../actions";

export default async function EditarFacturaPage({ params }: { params: { id: string } }) {
  const current = await getCurrentOrg();
  if (!current) return null;

  const supabase = createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", params.id)
    .eq("organization_id", current.organization.id)
    .single();

  if (!invoice) notFound();
  if (invoice.status !== "draft") redirect(`/facturacion/${params.id}`);

  const [{ data: clients }, { data: projects }] = await Promise.all([
    supabase.from("clients").select("id, name").eq("organization_id", current.organization.id).order("name"),
    supabase.from("projects").select("id, name").eq("organization_id", current.organization.id).order("name"),
  ]);

  const boundSubmit = updateInvoice.bind(null, invoice.id);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold">Editar factura</h1>
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <InvoiceForm
          clients={clients ?? []}
          projects={projects ?? []}
          defaultValues={{
            clientId: invoice.client_id,
            projectId: invoice.project_id,
            issueDate: invoice.issue_date,
            dueDate: invoice.due_date ?? "",
            taxRate: invoice.tax_rate,
            paymentTerms: invoice.payment_terms ?? "",
            notes: invoice.notes ?? "",
            items: invoice.invoice_items.map((it: any) => ({
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
