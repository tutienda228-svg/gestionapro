import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { formatCOP } from "@/lib/utils/currency";
import { ActivityLog } from "@/components/shared/activity-log";
import { Button } from "@/components/ui/button";
import { PaymentForm } from "./payment-form";
import { ReminderForm } from "./reminder-form";
import { InvoiceActionButtons } from "./action-buttons";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  partially_paid: "Pago parcial",
  paid: "Pagada",
  overdue: "Vencida",
  cancelled: "Cancelada",
};

export default async function FacturaDetallePage({ params }: { params: { id: string } }) {
  const current = await getCurrentOrg();
  if (!current) return null;

  const supabase = createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(name, email), invoice_items(*), payments(*)")
    .eq("id", params.id)
    .eq("organization_id", current.organization.id)
    .single();

  if (!invoice) notFound();

  const canManage = ["owner", "admin", "comercial"].includes(current.role);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Factura {invoice.invoice_number}</h1>
          <p className="text-sm text-neutral-500">
            Cliente: {invoice.clients?.name ?? "—"} · Estado: {STATUS_LABEL[invoice.status]}
          </p>
        </div>
        <a href={`/api/pdf/invoice/${invoice.id}`} target="_blank" rel="noreferrer">
          <Button variant="secondary">Descargar PDF</Button>
        </a>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Descripción</th>
              <th className="px-4 py-2 font-medium">Cant.</th>
              <th className="px-4 py-2 font-medium">Precio</th>
              <th className="px-4 py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {invoice.invoice_items.map((it: any) => (
              <tr key={it.id}>
                <td className="px-4 py-2">{it.description}</td>
                <td className="px-4 py-2">
                  {it.quantity} {it.unit}
                </td>
                <td className="px-4 py-2">{formatCOP(it.unit_price)}</td>
                <td className="px-4 py-2">{formatCOP(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-neutral-200 p-4 text-right text-sm">
          <p>Subtotal: {formatCOP(invoice.subtotal)}</p>
          <p>IVA: {formatCOP(invoice.tax_amount)}</p>
          <p className="font-semibold">Total: {formatCOP(invoice.total)}</p>
          <p>Pagado: {formatCOP(invoice.amount_paid)}</p>
          <p className="font-semibold text-primary">Saldo: {formatCOP(invoice.balance_due)}</p>
        </div>
      </div>

      {canManage && (
        <div className="mt-6 space-y-3">
          {invoice.status === "draft" && (
            <Link href={`/facturacion/${invoice.id}/editar`} className="text-sm text-primary hover:underline">
              Editar factura
            </Link>
          )}
          <InvoiceActionButtons invoiceId={invoice.id} status={invoice.status} />
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">Pagos registrados</h2>
        {invoice.payments.length > 0 && (
          <div className="mb-3 overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Monto</th>
                  <th className="px-3 py-2 font-medium">Método</th>
                  <th className="px-3 py-2 font-medium">Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {invoice.payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2">{new Date(p.payment_date).toLocaleDateString("es-CO")}</td>
                    <td className="px-3 py-2">{formatCOP(p.amount)}</td>
                    <td className="px-3 py-2 text-neutral-600">{p.payment_method || "—"}</td>
                    <td className="px-3 py-2 text-neutral-600">{p.reference || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {canManage && invoice.status !== "draft" && <PaymentForm invoiceId={invoice.id} balanceDue={invoice.balance_due} />}
      </section>

      {canManage && invoice.status !== "draft" && invoice.status !== "paid" && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">Recordatorios de pago</h2>
          <ReminderForm invoiceId={invoice.id} />
        </section>
      )}

      <div className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Actividad</h2>
        <ActivityLog organizationId={current.organization.id} entityType="invoices" entityId={invoice.id} />
      </div>
    </div>
  );
}
