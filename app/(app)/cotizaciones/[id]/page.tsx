import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { formatCOP } from "@/lib/utils/currency";
import { ActivityLog } from "@/components/shared/activity-log";
import { Button } from "@/components/ui/button";
import { QuotationActionButtons } from "./action-buttons";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Expirada",
};

export default async function CotizacionDetallePage({ params }: { params: { id: string } }) {
  const current = await getCurrentOrg();
  if (!current) return null;

  const supabase = createClient();
  const { data: quotation } = await supabase
    .from("quotations")
    .select("*, clients(name, email), quotation_items(*)")
    .eq("id", params.id)
    .eq("organization_id", current.organization.id)
    .single();

  if (!quotation) notFound();

  const canManage = ["owner", "admin", "comercial"].includes(current.role);
  const publicLink = `${process.env.NEXT_PUBLIC_APP_URL}/p/${quotation.public_token}`;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {quotation.quotation_number} — {quotation.title}
          </h1>
          <p className="text-sm text-neutral-500">
            Cliente: {quotation.clients?.name ?? "—"} · Estado: {STATUS_LABEL[quotation.status]}
          </p>
        </div>
        <a href={`/api/pdf/quotation/${quotation.id}`} target="_blank" rel="noreferrer">
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
            {quotation.quotation_items.map((it: any) => (
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
          <p>Subtotal: {formatCOP(quotation.subtotal)}</p>
          <p>Descuento: - {formatCOP(quotation.discount_amount)}</p>
          <p>IVA: {formatCOP(quotation.tax_amount)}</p>
          <p className="font-semibold">Total: {formatCOP(quotation.total)}</p>
        </div>
      </div>

      {canManage && (
        <div className="mt-6 space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
          {quotation.status === "draft" && (
            <Link href={`/cotizaciones/${quotation.id}/editar`} className="text-sm text-primary hover:underline">
              Editar cotización
            </Link>
          )}
          <p className="text-xs text-neutral-500">
            Enlace público para el cliente: <span className="break-all">{publicLink}</span>
          </p>
          <QuotationActionButtons quotationId={quotation.id} status={quotation.status} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Actividad</h2>
        <ActivityLog organizationId={current.organization.id} entityType="quotations" entityId={quotation.id} />
      </div>
    </div>
  );
}
