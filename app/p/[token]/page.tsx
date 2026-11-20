import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCOP } from "@/lib/utils/currency";
import { PublicQuotationActions } from "./actions-buttons";

export default async function PublicQuotationPage({ params }: { params: { token: string } }) {
  const admin = createAdminClient();

  const { data: quotation } = await admin
    .from("quotations")
    .select("*, clients(name), quotation_items(*), organizations(name, logo_url, phone, email)")
    .eq("public_token", params.token)
    .single();

  if (!quotation) notFound();

  const org = quotation.organizations;
  const canRespond = quotation.status === "sent";

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-neutral-50 px-4 py-10">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">{org?.name}</p>
            <p className="text-xs text-neutral-500">
              {org?.email} {org?.phone ? `· ${org.phone}` : ""}
            </p>
          </div>
          <a href={`/api/pdf/quotation-public/${params.token}`} className="text-sm text-primary hover:underline">
            Descargar PDF
          </a>
        </div>

        <h1 className="text-xl font-semibold">
          {quotation.quotation_number} — {quotation.title}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">Para: {quotation.clients?.name}</p>
        {quotation.description && <p className="mt-3 text-sm text-neutral-700">{quotation.description}</p>}

        <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Descripción</th>
                <th className="px-4 py-2 font-medium">Cant.</th>
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
                  <td className="px-4 py-2">{formatCOP(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-neutral-200 p-4 text-right text-sm">
            <p className="font-semibold">Total: {formatCOP(quotation.total)}</p>
          </div>
        </div>

        <div className="mt-8">
          {canRespond ? (
            <PublicQuotationActions token={params.token} />
          ) : (
            <p className="rounded-lg bg-neutral-100 p-4 text-sm text-neutral-600">
              {quotation.status === "accepted" && "Ya aceptaste esta cotización. ¡Gracias!"}
              {quotation.status === "rejected" && "Esta cotización fue marcada como rechazada."}
              {quotation.status === "draft" && "Esta cotización aún no ha sido enviada."}
              {quotation.status === "expired" && "Esta cotización ha expirado."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
