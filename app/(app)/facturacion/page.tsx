import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/get-current-org";
import { formatCOP } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/shared/search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";

const PAGE_SIZE = 10;
const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  partially_paid: "Pago parcial",
  paid: "Pagada",
  overdue: "Vencida",
  cancelled: "Cancelada",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  sent: "bg-blue-100 text-blue-700",
  partially_paid: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-neutral-100 text-neutral-400",
};

export default async function FacturacionPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string };
}) {
  const current = await getCurrentOrg();
  if (!current) return null;

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createClient();

  const { data: summary } = await supabase
    .from("invoices")
    .select("balance_due, status")
    .eq("organization_id", current.organization.id)
    .in("status", ["sent", "partially_paid", "overdue"]);

  const totalPorCobrar = (summary ?? []).reduce((acc, i: any) => acc + Number(i.balance_due ?? 0), 0);
  const vencidas = (summary ?? []).filter((i: any) => i.status === "overdue").length;

  let query = supabase
    .from("invoices")
    .select("id, invoice_number, total, balance_due, status, due_date, clients(name)", { count: "exact" })
    .eq("organization_id", current.organization.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (searchParams.q) query = query.ilike("invoice_number", `%${searchParams.q}%`);
  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data: invoices, count } = await query;
  const canCreate = ["owner", "admin", "comercial"].includes(current.role);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Facturación y cartera</h1>
        {canCreate && (
          <Link href="/facturacion/nueva">
            <Button>Nueva factura</Button>
          </Link>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Total por cobrar</p>
          <p className="text-lg font-semibold">{formatCOP(totalPorCobrar)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Facturas vencidas</p>
          <p className="text-lg font-semibold text-red-600">{vencidas}</p>
        </div>
      </div>

      <div className="mt-6">
        <SearchBar
          placeholder="Buscar por número de factura..."
          filterOptions={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
        />
      </div>

      <div className="mt-6">
        {!invoices || invoices.length === 0 ? (
          <EmptyState
            title="Aún no tienes facturas"
            description="Crea tu primera cuenta de cobro o factura en 2 minutos."
            actionHref={canCreate ? "/facturacion/nueva" : undefined}
            actionLabel="Crear mi primera factura"
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">N°</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Vence</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Saldo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/facturacion/${inv.id}`} className="font-medium text-primary hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{inv.clients?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString("es-CO") : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{formatCOP(inv.total)}</td>
                    <td className="px-4 py-3 text-neutral-600">{formatCOP(inv.balance_due)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[inv.status]}`}>
                        {STATUS_LABEL[inv.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} basePath="/facturacion" searchParams={searchParams} />
    </div>
  );
}
